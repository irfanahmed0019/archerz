-- Allow admins and it_admins to read all profiles (needed for members management UI)
CREATE POLICY "admins read all profiles"
  ON public.profiles FOR SELECT
  USING (
    private.has_role(auth.uid(), 'admin'::app_role)
    OR private.has_role(auth.uid(), 'it_admin'::app_role)
  );