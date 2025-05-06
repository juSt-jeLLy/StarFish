'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useCurrentWallet } from '@mysten/dapp-kit';
import { isSlushWallet } from './slushWalletAdapter';
import { debugWalletCapabilities } from './debugWallet';

// Define custom events for wallet connection changes
export const WALLET_CONNECTION_EVENT = 'wallet-connection-changed';
export const WALLET_RECONNECT_EVENT = 'wallet-reconnect-attempt';
export const WALLET_NETWORK_MISMATCH_EVENT = 'wallet-network-mismatch';

// Testnet chain ID
export const TESTNET_CHAIN_ID = '2afc6800f98fb4462f821e8d41d0d8364a75bfe23b8a3d00daa25c3c6a3bb986';

// Define the context shape
interface WalletContextType {
  isConnected: boolean;
  walletAddress: string | null;
  walletName: string | null;
  shortAddress: string | null;
  isSlush: boolean;
  walletInfo: string | null;
  hasError: boolean;
  errorMessage: string | null;
  isTestnet: boolean;
  chainId: string | null;
  debugWallet: () => void;
  refreshPage: () => void;
  switchToTestnet: () => Promise<boolean>;
}

// Create the context with default values
const WalletContext = createContext<WalletContextType>({
  isConnected: false,
  walletAddress: null,
  walletName: null,
  shortAddress: null,
  isSlush: false,
  walletInfo: null,
  hasError: false,
  errorMessage: null,
  isTestnet: false,
  chainId: null,
  debugWallet: () => {},
  refreshPage: () => {},
  switchToTestnet: async () => false,
});

// Hook to use the wallet context
export const useWallet = () => useContext(WalletContext);

// Provider component
export const WalletContextProvider = ({ children }: { children: ReactNode }) => {
  const { currentWallet } = useCurrentWallet();
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [shortAddress, setShortAddress] = useState<string | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [isSlush, setIsSlush] = useState(false);
  const [walletInfo, setWalletInfo] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previousWalletAddress, setPreviousWalletAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [isTestnet, setIsTestnet] = useState(false);
  
  // Function to refresh the current page
  const refreshPage = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };
  
  // Function to attempt switching to testnet
  const switchToTestnet = async (): Promise<boolean> => {
    if (!currentWallet) return false;
    
    try {
      // Try standard switchChain method first
      if (typeof (currentWallet as any).switchChain === 'function') {
        await (currentWallet as any).switchChain('sui:testnet');
        return true;
      }
      
      // Try Suiet wallet format
      if (typeof (currentWallet as any).select === 'function') {
        await (currentWallet as any).select('testnet');
        return true;
      }
      
      // Try setting chain directly
      if ((currentWallet as any).chain && typeof (currentWallet as any).setChain === 'function') {
        await (currentWallet as any).setChain('sui:testnet');
        return true;
      }
      
      // No supported method found, show manual instructions
      if (isSlush) {
        alert('Please open your Slush wallet and switch to Testnet network manually');
      } else {
        alert('Please open your wallet settings and switch to Testnet network manually');
      }
      
      return false;
    } catch (error) {
      console.error('Error switching to testnet:', error);
      alert('Please manually switch to Testnet in your wallet settings');
      return false;
    }
  };
  
  // Automatically restore wallet state on page load
  useEffect(() => {
    if (typeof window !== 'undefined' && !currentWallet) {
      const walletConnected = localStorage.getItem('walletConnected') === 'true';
      const storedAddress = localStorage.getItem('walletAddress');
      const storedName = localStorage.getItem('walletName');
      
      if (walletConnected && storedAddress) {
        console.log('Found stored wallet session, attempting to reconnect');
        
        // Set initial state from localStorage
        setIsConnected(true);
        setWalletAddress(storedAddress);
        setShortAddress(`${storedAddress.slice(0, 6)}...${storedAddress.slice(-4)}`);
        setWalletName(storedName || 'Unknown Wallet');
        
        // Trigger reconnection attempt
        window.dispatchEvent(new CustomEvent(WALLET_RECONNECT_EVENT));
      }
    }
  }, []);
  
  // Listen for storage changes across tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'walletConnected' || e.key === 'walletAddress') {
        const connected = localStorage.getItem('walletConnected') === 'true';
        const address = localStorage.getItem('walletAddress');
        
        // If wallet state changed in another tab, update this tab
        if (connected !== isConnected || (address && address !== walletAddress)) {
          console.log('Wallet state changed in another tab, reloading page');
          refreshPage();
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isConnected, walletAddress]);
  
  // Check if the wallet is on testnet
  const checkIsTestnet = (wallet: any): boolean => {
    // Try to get chain ID in various formats
    try {
      // Get chain ID directly if available
      let detectedChainId = null;
      
      if (wallet.chain) {
        // Some wallets use format "sui:testnet"
        const chain = wallet.chain;
        if (typeof chain === 'string') {
          detectedChainId = chain.split(':')[1] || chain;
        }
      }
      
      // Try to get from accounts
      if (!detectedChainId && wallet.accounts && wallet.accounts[0] && wallet.accounts[0].chains) {
        const chains = wallet.accounts[0].chains;
        if (Array.isArray(chains) && chains.length > 0) {
          // Extract chain ID from format like "sui:testnet"
          detectedChainId = chains[0].split(':')[1] || chains[0];
        }
      }
      
      // Store chain ID for later use
      if (detectedChainId) {
        setChainId(detectedChainId);
        localStorage.setItem('wallet_chainId', detectedChainId);
        
        // Check if it's testnet
        const onTestnet = detectedChainId === TESTNET_CHAIN_ID || 
                        detectedChainId.includes('testnet') ||
                        detectedChainId === '3d73001730ae5c368c4df95ecf07df14685cb85c0c0caa870872e994ab1752f4';
        
        setIsTestnet(onTestnet);
        return onTestnet;
      }
    } catch (e) {
      console.error('Error detecting chain:', e);
    }
    
    // Default to assume it's not testnet if we can't detect
    setIsTestnet(false);
    return false;
  };
  
  // Update wallet state when currentWallet changes
  useEffect(() => {
    if (currentWallet && currentWallet.accounts && currentWallet.accounts.length > 0) {
      const address = currentWallet.accounts[0].address;
      const name = currentWallet.name || 'Unknown Wallet';
      const slushDetected = isSlushWallet(currentWallet);
      
      // Check if wallet has changed
      const walletChanged = previousWalletAddress !== null && previousWalletAddress !== address;
      
      setIsConnected(true);
      setWalletAddress(address);
      setShortAddress(`${address.slice(0, 6)}...${address.slice(-4)}`);
      setWalletName(name);
      setIsSlush(slushDetected);
      setPreviousWalletAddress(address);
      
      // Check if wallet is on testnet
      const onTestnet = checkIsTestnet(currentWallet);
      
      // Check if wallet has proper signing capabilities
      const debug = debugWalletCapabilities(currentWallet);
      setWalletInfo(debug);
      
      const hasSigningCapability = checkWalletCapabilities(currentWallet, slushDetected);
      
      if (!hasSigningCapability) {
        setHasError(true);
        setErrorMessage('Wallet does not support required transaction signing methods');
      } else if (!onTestnet) {
        setHasError(true);
        setErrorMessage('Your wallet is not connected to Testnet. Please switch networks.');
        
        // Dispatch network mismatch event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent(WALLET_NETWORK_MISMATCH_EVENT, {
            detail: { chainId, expected: TESTNET_CHAIN_ID }
          }));
        }
      } else {
        setHasError(false);
        setErrorMessage(null);
      }
      
      // Log wallet connection for debugging
      console.log(`Wallet connected: ${name} (${slushDetected ? 'Slush' : 'Standard'})`);
      console.log(`Address: ${address}`);
      console.log(`Network: ${onTestnet ? 'Testnet' : 'Not Testnet'}, ChainId: ${chainId || 'Unknown'}`);
      
      // Store wallet connection state in localStorage for persistence across pages and sessions
      if (typeof window !== 'undefined') {
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('walletAddress', address);
        localStorage.setItem('walletName', name);
        if (chainId) {
          localStorage.setItem('wallet_chainId', chainId);
        }
        
        // Dispatch custom event to notify components about wallet connection
        const eventDetail = { 
          connected: true, 
          address, 
          name,
          chainId,
          isTestnet: onTestnet,
          changed: walletChanged 
        };
        
        window.dispatchEvent(new CustomEvent(WALLET_CONNECTION_EVENT, {
          detail: eventDetail
        }));
        
        // Reload the page if wallet address has changed to refresh subscription data
        if (walletChanged) {
          console.log('Wallet address changed, reloading page');
          
          // Set a flag to prevent multiple reloads
          if (!localStorage.getItem('walletReloadInProgress')) {
            localStorage.setItem('walletReloadInProgress', 'true');
            
            // Clear the flag after the reload completes or after a timeout
            setTimeout(() => {
              localStorage.removeItem('walletReloadInProgress');
              refreshPage();
            }, 1000);
          } else {
            console.log('Reload already in progress, skipping additional reload');
          }
        }
      }
    } else if (isConnected) {
      // Clear wallet state when disconnected
      setIsConnected(false);
      setWalletAddress(null);
      setShortAddress(null);
      setWalletName(null);
      setIsSlush(false);
      setWalletInfo(null);
      setHasError(false);
      setErrorMessage(null);
      setPreviousWalletAddress(null);
      setChainId(null);
      setIsTestnet(false);
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('walletConnected');
        localStorage.removeItem('walletAddress');
        localStorage.removeItem('walletName');
        localStorage.removeItem('wallet_chainId');
        
        // Dispatch custom event to notify components about wallet disconnection
        window.dispatchEvent(new CustomEvent(WALLET_CONNECTION_EVENT, {
          detail: { connected: false }
        }));
        
        // Reload the page to refresh subscription data
        console.log('Wallet disconnected, reloading page');
        setTimeout(refreshPage, 500); // Small delay to allow event to propagate
      }
    }
  }, [currentWallet]);
  
  // Helper function to check wallet capabilities
  const checkWalletCapabilities = (wallet: any, isSlushWallet: boolean) => {
    if (!wallet) return false;
    
    // For Slush wallet, we handle it separately with our adapter
    if (isSlushWallet) return true;
    
    // Check standard capabilities
    const hasSignAndExecute = typeof wallet.signAndExecuteTransactionBlock === 'function';
    
    // Check for wallet-standard features
    let hasSignFeature = false;
    try {
      if (wallet.features) {
        hasSignFeature = wallet.features['sui:signTransactionBlock'] != null;
      }
    } catch (e) {
      console.error('Error checking wallet features:', e);
    }
    
    return hasSignAndExecute || hasSignFeature;
  };
  
  // Function to debug wallet
  const debugWallet = () => {
    if (walletInfo) {
      console.log(walletInfo);
      alert(walletInfo);
    } else {
      alert('No wallet information available');
    }
  };
  
  // Provide the wallet context
  const contextValue = {
    isConnected,
    walletAddress,
    walletName,
    shortAddress,
    isSlush,
    walletInfo,
    hasError,
    errorMessage,
    isTestnet,
    chainId,
    debugWallet,
    refreshPage,
    switchToTestnet,
  };
  
  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}; 