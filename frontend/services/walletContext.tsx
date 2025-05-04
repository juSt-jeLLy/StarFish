'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useCurrentWallet } from '@mysten/dapp-kit';
import { isSlushWallet } from './slushWalletAdapter';
import { debugWalletCapabilities } from './debugWallet';

// Define custom event for wallet connection changes
export const WALLET_CONNECTION_EVENT = 'wallet-connection-changed';

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
  debugWallet: () => void;
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
  debugWallet: () => {},
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
  
  // Update wallet state when currentWallet changes
  useEffect(() => {
    if (currentWallet && currentWallet.accounts && currentWallet.accounts.length > 0) {
      const address = currentWallet.accounts[0].address;
      const name = currentWallet.name || 'Unknown Wallet';
      const slushDetected = isSlushWallet(currentWallet);
      
      setIsConnected(true);
      setWalletAddress(address);
      setShortAddress(`${address.slice(0, 6)}...${address.slice(-4)}`);
      setWalletName(name);
      setIsSlush(slushDetected);
      
      // Check if wallet has proper signing capabilities
      const debug = debugWalletCapabilities(currentWallet);
      setWalletInfo(debug);
      
      const hasSigningCapability = checkWalletCapabilities(currentWallet, slushDetected);
      
      if (!hasSigningCapability) {
        setHasError(true);
        setErrorMessage('Wallet does not support required transaction signing methods');
      } else {
        setHasError(false);
        setErrorMessage(null);
      }
      
      // Log wallet connection for debugging
      console.log(`Wallet connected: ${name} (${slushDetected ? 'Slush' : 'Standard'})`);
      console.log(`Address: ${address}`);
      
      // Store wallet connection state in localStorage for persistence across pages and sessions
      if (typeof window !== 'undefined') {
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('walletAddress', address);
        localStorage.setItem('walletName', name);
        
        // Dispatch custom event to notify components about wallet connection
        window.dispatchEvent(new CustomEvent(WALLET_CONNECTION_EVENT, {
          detail: { connected: true, address, name }
        }));
      }
    } else {
      // Clear wallet state
      setIsConnected(false);
      setWalletAddress(null);
      setShortAddress(null);
      setWalletName(null);
      setIsSlush(false);
      setWalletInfo(null);
      setHasError(false);
      setErrorMessage(null);
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('walletConnected');
        localStorage.removeItem('walletAddress');
        localStorage.removeItem('walletName');
        
        // Dispatch custom event to notify components about wallet disconnection
        window.dispatchEvent(new CustomEvent(WALLET_CONNECTION_EVENT, {
          detail: { connected: false }
        }));
      }
      
      console.log('Wallet disconnected');
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
    debugWallet,
  };
  
  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}; 