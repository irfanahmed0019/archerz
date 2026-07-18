DROP POLICY IF EXISTS "profiles readable to auth" ON public.profiles;
CREATE POLICY "profiles self select" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());