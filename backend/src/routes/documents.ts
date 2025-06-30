import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import pinataSDK from '@pinata/sdk';
import { ethers } from 'ethers';
import crypto from 'crypto';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Initialize clients
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
const pinata = new pinataSDK({
  pinataApiKey: process.env.PINATA_API_KEY!,
  pinataSecretApiKey: process.env.PINATA_API_SECRET!
});
const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL!);

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Middleware to check user role
const checkRole = (roles: string[]): RequestHandler => {
  return (async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data: { user } } = await supabase.auth.getUser(req.headers.authorization?.split(' ')[1] || '');
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!userData || !roles.includes(userData.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }) as RequestHandler;
};

// Upload document
router.post('/upload', checkRole(['admin', 'employee']), upload.single('file'), (async (req: Request, res: Response) => {
  try {
    const { sector, is_classified, chain_type } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    // Upload to IPFS
    const ipfsResult = await pinata.pinFileToIPFS(file.buffer, {
      pinataMetadata: {
        name: file.originalname
      }
    });

    // Calculate file hash
    const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');

    // Store in Supabase
    const { data: document, error } = await supabase
      .from('documents')
      .insert({
        title: file.originalname,
        sector,
        is_classified: is_classified === 'true',
        ipfs_hash: ipfsResult.IpfsHash,
        uploaded_by: req.user.id,
        chain_type
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      id: document.id,
      ipfs_hash: document.ipfs_hash,
      title: document.title
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
}) as RequestHandler);

// List documents
router.get('/', async (req: Request, res: Response) => {
  try {
    const { sector, is_classified } = req.query;
    let query = supabase.from('documents').select('*');

    if (sector) query = query.eq('sector', sector);
    if (is_classified) query = query.eq('is_classified', is_classified === 'true');

    const { data: documents, error } = await query;

    if (error) throw error;
    res.json(documents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Download document
router.get('/:id/download', (async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Check if document is classified and user has access
    if (document.is_classified) {
      const { data: { user } } = await supabase.auth.getUser(req.headers.authorization?.split(' ')[1] || '');
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!userData || !['admin', 'employee'].includes(userData.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    // Get file from IPFS
    const response = await fetch(`https://gateway.pinata.cloud/ipfs/${document.ipfs_hash}`);
    const buffer = await response.arrayBuffer();

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename=${document.title}`);
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to download document' });
  }
}) as RequestHandler);

// Verify document
router.post('/verify', upload.single('file'), (async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');

    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('ipfs_hash', fileHash)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.json({ isAuthentic: false });
      }
      throw error;
    }

    res.json({ isAuthentic: true, document });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to verify document' });
  }
}) as RequestHandler);

export default router; 