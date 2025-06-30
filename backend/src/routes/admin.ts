import express, { Request, Response, RequestHandler, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

// Middleware to check if user is admin
const isAdmin = (async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: { user } } = await supabase.auth.getUser(req.headers.authorization?.split(' ')[1] || '');
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}) as RequestHandler;

// Create employee
router.post('/create-employee', isAdmin, (async (req: Request, res: Response) => {
  try {
    const { email, password, ethereum_address } = req.body;

    if (!email || !password || !ethereum_address) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) throw authError;

    // Add user to users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        role: 'employee',
        ethereum_address
      })
      .select()
      .single();

    if (userError) throw userError;

    // TODO: Add ethereum_address to PrivateDocumentChain contract
    // This would require the contract ABI and address

    res.json({
      id: userData.id,
      email: userData.email,
      role: userData.role
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create employee' });
  }
}) as RequestHandler);

export default router; 