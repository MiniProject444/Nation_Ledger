-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'employee')),
    ethereum_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    sector TEXT NOT NULL,
    description TEXT,
    is_classified BOOLEAN NOT NULL DEFAULT false,
    ipfs_hash TEXT NOT NULL,
    blockchain_tx_hash TEXT,
    uploaded_by UUID REFERENCES users(id) NOT NULL,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    chain_type TEXT NOT NULL CHECK (chain_type IN ('private', 'public', 'both')),
    file_size TEXT,
    file_type TEXT
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_documents_sector ON documents(sector);
CREATE INDEX IF NOT EXISTS idx_documents_is_classified ON documents(is_classified);
CREATE INDEX IF NOT EXISTS idx_documents_upload_date ON documents(upload_date);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Allow trigger to insert users" ON users;
DROP POLICY IF EXISTS "Public can view declassified documents" ON documents;
DROP POLICY IF EXISTS "Employees and admins can view all documents" ON documents;
DROP POLICY IF EXISTS "Only admins and employees can upload documents" ON documents;
DROP POLICY IF EXISTS "Admin users can insert documents" ON documents;

-- Create default admin user if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@gmail.com') THEN
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, role)
        VALUES (
            '00000000-0000-0000-0000-000000000000',
            'admin@gmail.com',
            crypt('12345678', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            'authenticated'
        );
    END IF;
END $$;

-- Create corresponding user record if not exists
INSERT INTO users (id, email, role)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'admin@gmail.com',
    'admin'
) ON CONFLICT (id) DO NOTHING;

-- Create policies for users table
CREATE POLICY "Users can view their own data"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
    ON users FOR ALL
    USING (
        auth.uid() = '00000000-0000-0000-0000-000000000000'
        OR
        id = auth.uid()
    );

CREATE POLICY "Allow trigger to insert users"
    ON users FOR INSERT
    WITH CHECK (true);

-- Create policies for documents table (ORIGINAL WORKING POLICIES)
CREATE POLICY "Public can view declassified documents"
    ON documents FOR SELECT
    USING (is_classified = false);

CREATE POLICY "Employees and admins can view all documents"
    ON documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role IN ('admin', 'employee')
        )
    );

CREATE POLICY "Only admins and employees can upload documents"
    ON documents FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role IN ('admin', 'employee')
        )
    );

CREATE POLICY "Admin users can insert documents"
    ON documents FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, role)
    VALUES (new.id, new.email, 'employee');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 