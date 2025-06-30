-- Create a function to delete users that can only be called by authenticated users with admin role
CREATE OR REPLACE FUNCTION delete_user(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the calling user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can delete users';
  END IF;

  -- Delete from users table first (this will cascade to related tables)
  DELETE FROM users WHERE id = user_id;
  
  -- Delete from auth.users
  DELETE FROM auth.users WHERE id = user_id;
END;
$$; 