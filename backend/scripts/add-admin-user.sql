-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Public can view declassified documents" ON documents;
DROP POLICY IF EXISTS "Employees and admins can view all documents" ON documents;
DROP POLICY IF EXISTS "Only admins and employees can upload documents" ON documents;
DROP POLICY IF EXISTS "Admin users can insert documents" ON documents;

-- Drop existing helper function if it exists
DROP FUNCTION IF EXISTS get_my_role();

-- Create or update admin user
DO $$
DECLARE
    admin_id UUID;
BEGIN
    -- Check if admin user exists by email
    SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@gmail.com';
    
    IF admin_id IS NULL THEN
        -- Create new admin user using auth.users table directly
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token,
            email_change_token_new,
            email_change,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            phone,
            phone_confirmed_at,
            phone_change,
            phone_change_token,
            confirmed_at,
            email_change_token_current,
            email_change_confirm_status,
            banned_until,
            reauthentication_token,
            is_sso_user,
            deleted_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'admin@gmail.com',
            crypt('12345678', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '',
            '',
            '',
            '',
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{}',
            false,
            null,
            null,
            '',
            '',
            NOW(),
            '',
            0,
            null,
            '',
            false,
            null
        ) RETURNING id INTO admin_id;
    END IF;

    -- Ensure the user exists in the users table
    INSERT INTO users (id, email, role)
    VALUES (admin_id, 'admin@gmail.com', 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin';
END $$;

-- Helper function to get the role of the current user
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$;

-- Create policies for users table
CREATE POLICY "Users can view their own data"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
    ON users FOR SELECT
    -- Use the helper function to check the role, avoiding recursion
    USING (get_my_role() = 'admin');

-- Create policies for documents table
CREATE POLICY "Public can view declassified documents"
    ON documents FOR SELECT
    USING (is_classified = false);

CREATE POLICY "Employees and admins can view all documents"
    ON documents FOR SELECT
    USING (
        -- Use the helper function here as well for consistency and safety
        get_my_role() IN ('admin', 'employee')
    );

CREATE POLICY "Only admins and employees can upload documents"
    ON documents FOR INSERT
    WITH CHECK (
        -- Use the helper function here as well
        get_my_role() IN ('admin', 'employee')
    );

CREATE POLICY "Admin users can insert documents"
    ON documents FOR INSERT
    WITH CHECK (
        -- Use the helper function here as well
        get_my_role() = 'admin'
    ); 