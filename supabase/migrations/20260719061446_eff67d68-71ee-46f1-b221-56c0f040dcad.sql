
DROP POLICY IF EXISTS "anyone can register" ON public.event_registrations;
CREATE POLICY "anyone can register" ON public.event_registrations
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(trim(full_name)) BETWEEN 2 AND 120
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND (notes IS NULL OR char_length(notes) <= 1000)
    AND status = 'pending'
  );
