DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'app_role'
      AND e.enumlabel = 'normal'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'normal';
  END IF;
END $$;

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workshops TO authenticated;
GRANT SELECT ON public.workshops TO anon;
GRANT ALL ON public.workshops TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.change_requests TO authenticated;
GRANT ALL ON public.change_requests TO service_role;

DROP POLICY IF EXISTS "signed in members read plans" ON public.workshops;
CREATE POLICY "signed in members read plans"
ON public.workshops
FOR SELECT
TO authenticated
USING (true);