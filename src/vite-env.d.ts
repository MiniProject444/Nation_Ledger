/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_ETHEREUM_RPC_URL: string
  readonly VITE_CONTRACT_ADDRESS: string
  readonly VITE_IPFS_API_URL: string
  readonly VITE_IPFS_GATEWAY_URL: string
  readonly VITE_PINATA_API_KEY: string
  readonly VITE_PINATA_API_SECRET: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
