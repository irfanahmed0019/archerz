
CREATE TABLE public.event_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workshop_id UUID REFERENCES public.workshops(id) ON DELETE SET NULL,
  event_title TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  branch TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.event_registrations TO anon, authenticated;
GRANT ALL ON public.event_registrations TO service_role;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can register" ON public.event_registrations
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "staff can view registrations" ON public.event_registrations
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'it_admin'::app_role) OR private.has_role(auth.uid(), 'coordinator'::app_role));
CREATE POLICY "admins can update registrations" ON public.event_registrations
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'it_admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'it_admin'::app_role));
CREATE POLICY "admins can delete registrations" ON public.event_registrations
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'it_admin'::app_role));
