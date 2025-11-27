-- Function to handle user deletion and update contacts
CREATE OR REPLACE FUNCTION handle_user_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email text;
BEGIN
  -- Get user email from auth.users (if accessible)
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = OLD.user_id;
  
  -- Mark contact as inactive if exists
  IF v_user_email IS NOT NULL THEN
    UPDATE contacts
    SET status = 'inactive',
        notes = COALESCE(notes, '') || E'\n\n--- Compte utilisateur supprimé le ' || to_char(now(), 'DD/MM/YYYY HH24:MI') || ' ---',
        updated_at = now()
    WHERE email = v_user_email;
  END IF;
  
  RETURN OLD;
END;
$$;

-- Trigger on user_roles deletion
DROP TRIGGER IF EXISTS on_user_role_deleted ON user_roles;
CREATE TRIGGER on_user_role_deleted
  BEFORE DELETE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_deletion();