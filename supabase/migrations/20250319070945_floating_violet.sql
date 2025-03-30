/*
  # Add Tipalti Integration
  
  1. New Columns
    - Add tipalti_id to auth.users metadata
    - Add payment_enabled flag to auth.users metadata
  
  2. New Functions
    - generate_tipalti_id(): Generates unique Tipalti-compatible IDs
    - assign_tipalti_id(): Assigns Tipalti ID to new users after onboarding
  
  3. Security
    - Ensure IDs follow Tipalti requirements
    - Add validation for ID format
*/

-- Function to generate a unique Tipalti-compatible ID
CREATE OR REPLACE FUNCTION generate_tipalti_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id text;
  is_unique boolean := false;
BEGIN
  -- Generate ID until a unique one is found
  WHILE NOT is_unique LOOP
    -- Generate base using timestamp and random elements
    new_id := 
      -- Use timestamp for uniqueness
      to_char(current_timestamp, 'YYYYMMDD') || '_' ||
      -- Add random alphanumeric string
      encode(gen_random_bytes(8), 'hex') || '_' ||
      -- Add random suffix
      encode(gen_random_bytes(4), 'base64');
    
    -- Clean up the ID to match Tipalti requirements
    new_id := regexp_replace(new_id, '[^a-zA-Z0-9,._-]', '', 'g');
    
    -- Ensure max length of 64
    new_id := substring(new_id, 1, 64);
    
    -- Check uniqueness
    SELECT NOT EXISTS (
      SELECT 1 FROM auth.users 
      WHERE raw_user_meta_data->>'tipalti_id' = new_id
    ) INTO is_unique;
  END LOOP;

  RETURN new_id;
END;
$$;

-- Function to assign Tipalti ID after onboarding
CREATE OR REPLACE FUNCTION assign_tipalti_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tipalti_id text;
BEGIN
  -- Only assign ID if onboarding is complete and no ID exists
  IF (NEW.raw_user_meta_data->>'onboarding_complete')::boolean = true 
     AND (NEW.raw_user_meta_data->>'tipalti_id') IS NULL THEN
    
    -- Generate new Tipalti ID
    tipalti_id := generate_tipalti_id();
    
    -- Update user metadata with Tipalti ID
    NEW.raw_user_meta_data := NEW.raw_user_meta_data || jsonb_build_object(
      'tipalti_id', tipalti_id,
      'payment_enabled', true
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to assign Tipalti ID after onboarding
DROP TRIGGER IF EXISTS assign_tipalti_id_trigger ON auth.users;
CREATE TRIGGER assign_tipalti_id_trigger
  BEFORE UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION assign_tipalti_id();

-- Function to validate Tipalti ID format
CREATE OR REPLACE FUNCTION validate_tipalti_id(id text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN id ~ '^[a-zA-Z0-9,._-]{1,64}$';
END;
$$;

-- Update existing users who have completed onboarding but don't have Tipalti IDs
DO $$
DECLARE
  user_record RECORD;
  new_tipalti_id text;
BEGIN
  FOR user_record IN
    SELECT id, raw_user_meta_data
    FROM auth.users
    WHERE 
      (raw_user_meta_data->>'onboarding_complete')::boolean = true
      AND (raw_user_meta_data->>'tipalti_id') IS NULL
  LOOP
    -- Generate new Tipalti ID
    new_tipalti_id := generate_tipalti_id();
    
    -- Update user metadata
    UPDATE auth.users
    SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
      'tipalti_id', new_tipalti_id,
      'payment_enabled', true
    )
    WHERE id = user_record.id;
  END LOOP;
END;
$$;