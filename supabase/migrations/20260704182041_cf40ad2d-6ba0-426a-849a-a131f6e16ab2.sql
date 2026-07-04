CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT USAGE ON SCHEMA private TO service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

REVOKE EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO service_role;

DROP POLICY IF EXISTS "users see own roles" ON public.user_roles;
DROP POLICY IF EXISTS "admins manage roles" ON public.user_roles;
CREATE POLICY "users see own roles" ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'it_admin'));
CREATE POLICY "admins manage roles" ON public.user_roles
FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'it_admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'it_admin'));

DROP POLICY IF EXISTS "public reads published" ON public.workshops;
DROP POLICY IF EXISTS "signed in members read plans" ON public.workshops;
DROP POLICY IF EXISTS "coordinators insert own drafts" ON public.workshops;
DROP POLICY IF EXISTS "coordinators update own drafts" ON public.workshops;
DROP POLICY IF EXISTS "admins delete" ON public.workshops;
CREATE POLICY "public reads published" ON public.workshops
FOR SELECT TO anon
USING (is_published = true);
CREATE POLICY "signed in members read plans" ON public.workshops
FOR SELECT TO authenticated
USING (true);
CREATE POLICY "coordinators insert own drafts" ON public.workshops
FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (
    private.has_role(auth.uid(), 'admin')
    OR private.has_role(auth.uid(), 'it_admin')
    OR private.has_role(auth.uid(), 'coordinator')
  )
);
CREATE POLICY "coordinators update own drafts" ON public.workshops
FOR UPDATE TO authenticated
USING (
  private.has_role(auth.uid(), 'admin')
  OR private.has_role(auth.uid(), 'it_admin')
  OR (created_by = auth.uid() AND is_published = false)
)
WITH CHECK (
  private.has_role(auth.uid(), 'admin')
  OR private.has_role(auth.uid(), 'it_admin')
  OR (created_by = auth.uid() AND is_published = false)
);
CREATE POLICY "admins delete" ON public.workshops
FOR DELETE TO authenticated
USING (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'it_admin'));

DROP POLICY IF EXISTS "own or admin read" ON public.change_requests;
DROP POLICY IF EXISTS "admins review" ON public.change_requests;
CREATE POLICY "own or admin read" ON public.change_requests
FOR SELECT TO authenticated
USING (requested_by = auth.uid() OR private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'it_admin'));
CREATE POLICY "admins review" ON public.change_requests
FOR UPDATE TO authenticated
USING (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'it_admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'it_admin'));

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);