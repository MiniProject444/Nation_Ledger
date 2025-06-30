import { useState, useEffect } from 'react';
import { blockchainService } from '@/utils/blockchain';
import { useToast } from '@/hooks/use-toast';

export const useBlockchain = (userType: 'admin' | 'employee' = 'employee') => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isGanache, setIsGanache] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Only check connection if there's no explicit disconnect state in localStorage
    const disconnectKey = `walletDisconnected_${userType}`;
    const isDisconnected = localStorage.getItem(disconnectKey) === 'true';
    if (!isDisconnected) {
      checkConnection();
    }
  }, [userType]);

  const checkConnection = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ 
          method: 'eth_accounts' 
        });
        
        if (accounts.length > 0) {
          setIsConnected(true);
          setWalletAddress(accounts[0]);
          
          // Check if connected to Ganache
          const chainId = await window.ethereum.request({ 
            method: 'eth_chainId' 
          });
          setIsGanache(chainId === '0x539');
        }
      }
    } catch (error) {
      console.error('Error checking connection:', error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Failed to check wallet connection. Please make sure MetaMask is installed and unlocked.",
      });
    }
  };

  const connect = async () => {
    try {
      setIsLoading(true);
      
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed. Please install MetaMask to use blockchain features.');
      }

      // Connect wallet
      const address = await blockchainService.connectWallet();
      setWalletAddress(address);
      setIsConnected(true);
      
      // Switch to Ganache
      await blockchainService.switchToGanache();
      setIsGanache(true);
      
      // Clear disconnect state
      localStorage.removeItem(`walletDisconnected_${userType}`);
      
      toast({
        title: "Wallet Connected",
        description: `Successfully connected to MetaMask as ${userType} and switched to Ganache network.`,
      });
    } catch (error: any) {
      console.error('Connection error:', error);
      
      let errorMessage = "Failed to connect wallet";
      if (error.message) {
        if (error.message.includes('MetaMask is not installed')) {
          errorMessage = "MetaMask is not installed. Please install MetaMask to use blockchain features.";
        } else if (error.message.includes('User rejected')) {
          errorMessage = "Connection was rejected. Please approve the connection request in MetaMask.";
        } else if (error.message.includes('Ganache')) {
          errorMessage = "Failed to connect to Ganache network. Please make sure Ganache is running.";
        }
      }
      
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: errorMessage,
      });
      
      // Reset connection state
      setIsConnected(false);
      setWalletAddress(null);
      setIsGanache(false);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setWalletAddress(null);
    setIsGanache(false);
    
    // Set disconnect state in localStorage with user type
    localStorage.setItem(`walletDisconnected_${userType}`, 'true');
    
    // Remove MetaMask event listeners
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', blockchainService.handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', blockchainService.handleChainChanged);
    }
    
    toast({
      title: "Wallet Disconnected",
      description: `Successfully disconnected from MetaMask as ${userType}.`,
    });
  };

  return {
    isConnected,
    walletAddress,
    isGanache,
    isLoading,
    connect,
    disconnect,
    checkConnection
  };
}; 