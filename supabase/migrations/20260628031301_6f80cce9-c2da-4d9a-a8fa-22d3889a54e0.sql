UPDATE public.user_profiles SET is_admin = true WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'hoangthien10ku@gmail.com');

CREATE OR REPLACE FUNCTION public.ensure_admin_for_owner()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'hoangthien10ku@gmail.com' THEN
    UPDATE public.user_profiles SET is_admin = true WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS ensure_admin_for_owner_trigger ON auth.users;
CREATE TRIGGER ensure_admin_for_owner_trigger AFTER INSERT OR UPDATE OF email ON auth.users FOR EACH ROW EXECUTE FUNCTION public.ensure_admin_for_owner();