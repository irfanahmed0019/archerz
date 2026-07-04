
-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('admin', 'it_admin', 'coordinator');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users see own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'it_admin'));
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'it_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'it_admin'));

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable to auth" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Seed profile + auto-admin for the founding email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles(id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)))
  ON CONFLICT (id) DO NOTHING;

  IF lower(NEW.email) = 'irfanahammad855@gmail.com' THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'it_admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ WORKSHOPS ============
CREATE TABLE public.workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  long_description TEXT,
  image_url TEXT,
  event_date TEXT,
  duration TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN',
  register_url TEXT,
  ordering INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.workshops TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.workshops TO authenticated;
GRANT ALL ON public.workshops TO service_role;
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public reads published" ON public.workshops FOR SELECT TO anon, authenticated
  USING (is_published = true OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'it_admin') OR created_by = auth.uid());
CREATE POLICY "coordinators insert own drafts" ON public.workshops FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND (
      public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'it_admin') OR public.has_role(auth.uid(),'coordinator')
    )
  );
CREATE POLICY "coordinators update own drafts" ON public.workshops FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'it_admin')
    OR (created_by = auth.uid() AND is_published = false)
  )
  WITH CHECK (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'it_admin')
    OR (created_by = auth.uid() AND is_published = false)
  );
CREATE POLICY "admins delete" ON public.workshops FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'it_admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER workshops_updated_at BEFORE UPDATE ON public.workshops
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ CHANGE REQUESTS ============
CREATE TABLE public.change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  target_id UUID,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);
GRANT SELECT, INSERT ON public.change_requests TO authenticated;
GRANT UPDATE, DELETE ON public.change_requests TO authenticated;
GRANT ALL ON public.change_requests TO service_role;
ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or admin read" ON public.change_requests FOR SELECT TO authenticated
  USING (requested_by = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'it_admin'));
CREATE POLICY "self create" ON public.change_requests FOR INSERT TO authenticated
  WITH CHECK (requested_by = auth.uid());
CREATE POLICY "admins review" ON public.change_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'it_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'it_admin'));

-- Seed initial workshops
INSERT INTO public.workshops (slug, code, title, body, long_description, event_date, duration, status, register_url, ordering, is_published) VALUES
('design-with-ai', 'MOD_01', 'DESIGN WITH AI',
 'Create websites, interfaces, and digital experiences using modern AI-powered design tools.',
 'A hands-on workshop introducing modern AI-powered design tools. Learn how to move from prompt to production interface, generate visual concepts, and integrate AI copilots into your everyday design flow. Participants will build a complete landing page using AI tooling.',
 'OCT 12', '3H', 'OPEN', 'https://forms.gle/KMNC6zrhtcqRcShaA', 1, true),
('typing-speed-challenge', 'MOD_02', 'TYPING SPEED CHALLENGE',
 'Test your typing speed, accuracy, and consistency in a competitive real-time environment.',
 'A competitive typing arena. Compete live against your peers across multiple rounds of code snippets, prose, and pattern drills. Prizes for the fastest, the most accurate, and the most consistent.',
 'OCT 17', '2H', 'OPEN', 'https://forms.gle/KMNC6zrhtcqRcShaA', 2, true),
('blind-coding-challenge', 'MOD_03', 'BLIND CODING CHALLENGE',
 'Test your ability to write accurate, functional code without seeing your screen.',
 'The ultimate mental-model challenge. You get the spec; your screen goes dark. Type an entire program blind, then reveal and run. Points for correctness, structure, and grace under pressure.',
 'TBD', '2H', 'QUEUED', 'https://forms.gle/KMNC6zrhtcqRcShaA', 3, true);
