# NationLedger Backend

A blockchain-based document management system for government entities using Supabase, IPFS, and Ethereum smart contracts.

## Features

- User authentication and role-based access control
- Document upload and storage on IPFS
- Document metadata storage on blockchain
- Private and public document chains
- Document verification system

## Tech Stack

- Backend: Node.js with Express
- Database: Supabase (PostgreSQL)
- Storage: IPFS (Pinata)
- Blockchain: Ethereum (Solidity smart contracts)
- Authentication: Supabase Auth

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account
- Pinata account
- Ethereum wallet (for contract deployment)
- Infura account (for Ethereum node access)

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   PINATA_API_KEY=your_pinata_api_key
   PINATA_API_SECRET=your_pinata_api_secret
   ETHEREUM_RPC_URL=your_ethereum_rpc_url
   PRIVATE_KEY=your_wallet_private_key
   ```

4. Compile and deploy smart contracts:
   ```bash
   npx hardhat compile
   npx hardhat run scripts/deploy.ts --network sepolia
   ```

5. Start the server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login with email and password
- `POST /api/auth/register` - Register new user (admin only)

### Documents

- `POST /api/documents/upload` - Upload document (admin/employee only)
- `GET /api/documents` - List documents
- `GET /api/documents/:id/download` - Download document
- `POST /api/documents/verify` - Verify document authenticity

### Admin

- `POST /api/admin/create-employee` - Create employee account (admin only)

## Smart Contracts

### PrivateDocumentChain

- `addDocument(ipfsHash, sector, isClassified)` - Add document metadata
- `getDocument(ipfsHash)` - Get document metadata
- `authorizeUser(address)` - Authorize user access
- `revokeUser(address)` - Revoke user access

### PublicDocumentChain

- `addDocument(ipfsHash, sector)` - Add document metadata
- `getDocument(ipfsHash)` - Get document metadata
- `verifyDocument(ipfsHash)` - Verify document existence

## Security

- All sensitive data is encrypted
- Role-based access control for all endpoints
- Document access control based on classification
- Secure file upload validation
- Blockchain-based document verification

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT 