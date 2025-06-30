import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, username, email, password } = req.body;

    // Create user with admin API
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        username
      }
    });

    if (userError) throw userError;

    return res.status(200).json({ user: userData.user });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to create user' 
    });
  }
} 