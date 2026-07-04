CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles(id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), split_part(NEW.email,'@',1)))
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name);

  INSERT INTO public.user_roles(user_id, role)
  VALUES (NEW.id, 'normal')
  ON CONFLICT DO NOTHING;

  IF lower(NEW.email) = 'irfanahammad855@gmail.com' THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'it_admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

INSERT INTO public.user_roles(user_id, role)
SELECT p.id, 'normal'::public.app_role
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id
)
ON CONFLICT DO NOTHING;