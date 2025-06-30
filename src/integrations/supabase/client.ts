import { createClient } from '@supabase/supabase-js';

// Default values for development
const DEFAULT_SUPABASE_URL = 'https://jeupobawicozspmqvvpy.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpldXBvYmF3aWNvenNwbXF2dnB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzOTU2NDcsImV4cCI6MjA2MDk3MTY0N30.OSHEMrveMuGwt1Gc0Iav5PLmHsaAM9wOcCDG1RtzKSw';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Missing Supabase environment variables. Using default values.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export const getDocumentPreviewUrl = (ipfsHash: string) => {
  return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
};

export const getIpfsUrl = (ipfsHash: string) => {
  return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
}; 