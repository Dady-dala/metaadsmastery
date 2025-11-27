-- Function to sync contact_submissions to contacts
CREATE OR REPLACE FUNCTION sync_contact_submission_to_contacts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO contacts (
    email,
    first_name,
    last_name,
    phone,
    source,
    status,
    created_at
  )
  VALUES (
    NEW.email,
    NEW.first_name,
    NEW.last_name,
    NEW.phone_number,
    'registration_form',
    'lead',
    NEW.created_at
  )
  ON CONFLICT (email) 
  DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, contacts.first_name),
    last_name = COALESCE(EXCLUDED.last_name, contacts.last_name),
    phone = COALESCE(EXCLUDED.phone, contacts.phone),
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Trigger for contact_submissions
DROP TRIGGER IF EXISTS sync_contact_submission ON contact_submissions;
CREATE TRIGGER sync_contact_submission
  AFTER INSERT ON contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION sync_contact_submission_to_contacts();

-- Function to sync contact_messages to contacts
CREATE OR REPLACE FUNCTION sync_contact_message_to_contacts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO contacts (
    email,
    first_name,
    source,
    status,
    notes,
    created_at
  )
  VALUES (
    NEW.email,
    NEW.name,
    'contact_form',
    'inquiry',
    NEW.message,
    NEW.created_at
  )
  ON CONFLICT (email) 
  DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, contacts.first_name),
    notes = CASE 
      WHEN contacts.notes IS NULL THEN EXCLUDED.notes
      ELSE contacts.notes || E'\n\n--- Message du ' || to_char(NEW.created_at, 'DD/MM/YYYY HH24:MI') || E' ---\n' || EXCLUDED.notes
    END,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Trigger for contact_messages
DROP TRIGGER IF EXISTS sync_contact_message ON contact_messages;
CREATE TRIGGER sync_contact_message
  AFTER INSERT ON contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION sync_contact_message_to_contacts();

-- Function to sync form_submissions to contacts
CREATE OR REPLACE FUNCTION sync_form_submission_to_contacts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_first_name text;
  v_last_name text;
  v_phone text;
BEGIN
  -- Extract common fields from JSONB data
  v_first_name := NEW.data->>'first_name';
  v_last_name := NEW.data->>'last_name';
  v_phone := NEW.data->>'phone';
  
  IF NEW.email IS NOT NULL THEN
    INSERT INTO contacts (
      email,
      first_name,
      last_name,
      phone,
      source,
      status,
      metadata,
      created_at
    )
    VALUES (
      NEW.email,
      v_first_name,
      v_last_name,
      v_phone,
      'custom_form',
      'lead',
      NEW.data,
      NEW.submitted_at
    )
    ON CONFLICT (email) 
    DO UPDATE SET
      first_name = COALESCE(EXCLUDED.first_name, contacts.first_name),
      last_name = COALESCE(EXCLUDED.last_name, contacts.last_name),
      phone = COALESCE(EXCLUDED.phone, contacts.phone),
      metadata = COALESCE(contacts.metadata, '{}'::jsonb) || EXCLUDED.metadata,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for form_submissions
DROP TRIGGER IF EXISTS sync_form_submission ON form_submissions;
CREATE TRIGGER sync_form_submission
  AFTER INSERT ON form_submissions
  FOR EACH ROW
  EXECUTE FUNCTION sync_form_submission_to_contacts();

-- Add unique constraint on email if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contacts_email_key'
  ) THEN
    ALTER TABLE contacts ADD CONSTRAINT contacts_email_key UNIQUE (email);
  END IF;
END $$;