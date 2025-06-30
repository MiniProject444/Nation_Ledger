import { ethers } from 'ethers';
import { toast } from '@/hooks/use-toast';

// Ganache network configuration
const GANACHE_CONFIG = {
  chainId: '0x539', // 1337 in hex
  chainName: 'Ganache',
  rpcUrls: ['http://127.0.0.1:7545'],
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18
  }
};

// Contract ABIs (you'll need to replace these with your actual contract ABIs)
const PRIVATE_DOCUMENT_CHAIN_ABI = [
  // Add your PrivateDocumentChain.sol ABI here
];

const PUBLIC_DOCUMENT_CHAIN_ABI = [
  // Add your PublicDocumentChain.sol ABI here
];

// Contract addresses (replace with your deployed contract addresses)
const PRIVATE_DOCUMENT_CHAIN_ADDRESS = 'YOUR_PRIVATE_CONTRACT_ADDRESS';
const PUBLIC_DOCUMENT_CHAIN_ADDRESS = 'YOUR_PUBLIC_CONTRACT_ADDRESS';

class BlockchainService {
  private provider: ethers.providers.Web3Provider | null = null;
  private signer: ethers.Signer | null = null;
  private privateContract: ethers.Contract | null = null;
  private publicContract: ethers.Contract | null = null;

  async initialize() {
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed');
      }

      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      this.signer = this.provider.getSigner();
      
      // Listen for account changes
      window.ethereum.on('accountsChanged', this.handleAccountsChanged);
      // Listen for chain changes
      window.ethereum.on('chainChanged', this.handleChainChanged);
      
      // Initialize contracts
      this.privateContract = new ethers.Contract(
        PRIVATE_DOCUMENT_CHAIN_ADDRESS,
        PRIVATE_DOCUMENT_CHAIN_ABI,
        this.signer
      );
      
      this.publicContract = new ethers.Contract(
        PUBLIC_DOCUMENT_CHAIN_ADDRESS,
        PUBLIC_DOCUMENT_CHAIN_ABI,
        this.signer
      );
      
      return true;
    } catch (error) {
      console.error('Failed to initialize blockchain service:', error);
      throw error;
    }
  }

  public handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      this.provider = null;
      this.signer = null;
      this.privateContract = null;
      this.publicContract = null;
      window.location.reload();
    } else {
      // User switched accounts
      window.location.reload();
    }
  };

  public handleChainChanged = (chainId: string) => {
    // Reload the page when the chain changes
    window.location.reload();
  };

  async connectWallet(): Promise<string> {
    try {
      if (!this.provider) {
        await this.initialize();
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      return accounts[0];
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('User rejected the connection request');
      }
      throw error;
    }
  }

  async switchToGanache() {
    try {
      const GANACHE_CHAIN_ID = '0x539';
      const GANACHE_NETWORK = {
        chainId: GANACHE_CHAIN_ID,
        chainName: 'Ganache',
        nativeCurrency: {
          name: 'ETH',
          symbol: 'ETH',
          decimals: 18
        },
        rpcUrls: ['http://127.0.0.1:7545'],
        blockExplorerUrls: null
      };

      // Check if we're already on Ganache
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (currentChainId === GANACHE_CHAIN_ID) {
        return;
      }

      try {
        // Try to switch to Ganache
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: GANACHE_CHAIN_ID }],
        });
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          try {
            // Add the Ganache network to MetaMask
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [GANACHE_NETWORK],
            });
          } catch (addError) {
            throw new Error('Failed to add Ganache network to MetaMask');
          }
        } else {
          throw switchError;
        }
      }
    } catch (error: any) {
      console.error('Failed to switch to Ganache:', error);
      throw new Error('Failed to switch to Ganache network. Please make sure Ganache is running.');
    }
  }

  async getBalance(address: string): Promise<string> {
    try {
      if (!this.provider) {
        await this.initialize();
      }

      const balance = await this.provider.getBalance(address);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw error;
    }
  }

  async getGasPrice(): Promise<string> {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }
      const gasPrice = await this.provider.getGasPrice();
      return ethers.utils.formatUnits(gasPrice, 'gwei');
    } catch (error) {
      console.error('Error getting gas price:', error);
      throw error;
    }
  }

  async verifyDocument(ipfsHash: string, sector: string): Promise<boolean> {
    try {
      if (!this.privateContract) {
        throw new Error('Private contract not initialized');
      }

      // Get current gas price
      const gasPrice = await this.getGasPrice();
      
      // Estimate gas for the transaction
      const gasEstimate = await this.privateContract.estimateGas.verifyDocument(
        ipfsHash,
        sector
      );

      // Add 20% buffer to gas estimate
      const gasLimit = gasEstimate.mul(120).div(100);

      // Send transaction
      const tx = await this.privateContract.verifyDocument(
        ipfsHash,
        sector,
        {
          gasLimit,
          gasPrice: ethers.utils.parseUnits(gasPrice, 'gwei')
        }
      );

      // Wait for transaction to be mined
      const receipt = await tx.wait();
      return receipt.status === 1;
    } catch (error) {
      console.error('Error verifying document:', error);
      throw error;
    }
  }

  async addDocument(ipfsHash: string, sector: string, isClassified: boolean): Promise<boolean> {
    try {
      const contract = isClassified ? this.privateContract : this.publicContract;
      if (!contract) {
        throw new Error('Contract not initialized');
      }

      // Get current gas price
      const gasPrice = await this.getGasPrice();
      
      // Estimate gas for the transaction
      const gasEstimate = await contract.estimateGas.addDocument(
        ipfsHash,
        sector,
        isClassified
      );

      // Add 20% buffer to gas estimate
      const gasLimit = gasEstimate.mul(120).div(100);

      // Send transaction
      const tx = await contract.addDocument(
        ipfsHash,
        sector,
        isClassified,
        {
          gasLimit,
          gasPrice: ethers.utils.parseUnits(gasPrice, 'gwei')
        }
      );

      // Wait for transaction to be mined
      const receipt = await tx.wait();
      return receipt.status === 1;
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  }

  async getDocumentMetadata(ipfsHash: string, isClassified: boolean): Promise<any> {
    try {
      const contract = isClassified ? this.privateContract : this.publicContract;
      if (!contract) {
        throw new Error('Contract not initialized');
      }

      return await contract.getDocument(ipfsHash);
    } catch (error) {
      console.error('Error getting document metadata:', error);
      throw error;
    }
  }
}

// Create a singleton instance
export const blockchainService = new BlockchainService(); 