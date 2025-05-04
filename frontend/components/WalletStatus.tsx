'use client';

import { useCurrentWallet } from '@mysten/dapp-kit';
import { useEffect, useState } from 'react';
import { isSlushWallet } from '../services/slushWalletAdapter';
import { debugWalletCapabilities } from '../services/debugWallet';
import { useWallet, WALLET_CONNECTION_EVENT } from '../services/walletContext';

const WalletStatus = () => {
  const { currentWallet } = useCurrentWallet();
  const { isConnected, walletAddress, walletName, isSlush: contextIsSlush } = useWallet();
  const [showStatus, setShowStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [walletInfo, setWalletInfo] = useState<string | null>(null);
  const [errorState, setErrorState] = useState(false);
  const [isSlush, setIsSlush] = useState(false);
  
  // Debug wallet features when wallet changes
  useEffect(() => {
    if (currentWallet) {
      console.log('Connected wallet:', currentWallet.name);
      
      // Check if it's Slush wallet
      const slushDetected = isSlushWallet(currentWallet);
      setIsSlush(slushDetected);
      
      // Get comprehensive debug info
      const debugInfo = debugWalletCapabilities(currentWallet);
      setWalletInfo(debugInfo);
      console.log(debugInfo);
      
      // Check for transaction signing features using safer type checking
      const hasSignAndExecute = typeof (currentWallet as any).signAndExecuteTransactionBlock === 'function';
      const features = (currentWallet as any).features;
      const hasFeatures = features && typeof features === 'object';
      
      // Check if wallet has signing capabilities
      let hasSigningCapability = hasSignAndExecute;
      
      if (hasFeatures) {
        try {
          // Try to check for specific features
          hasSigningCapability = hasSigningCapability || 
                               (features['sui:signTransactionBlock'] != null);
        } catch (e) {
          console.error('Error checking wallet features:', e);
        }
      }
      
      // Extra check for Slush wallet
      if (slushDetected) {
        hasSigningCapability = true; // We'll use our custom adapter for Slush
      }
      
      if (!hasSigningCapability) {
        setErrorState(true);
        setStatusMessage('Warning: This wallet may not support transaction signing');
        setShowStatus(true);
      } else {
        const address = currentWallet.accounts[0]?.address;
        const walletLabel = slushDetected ? 'Slush' : currentWallet.name?.split(' ')[0] || 'Wallet';
        setStatusMessage(`Connected: ${walletLabel} ${address?.slice(0, 6)}...${address?.slice(-4)}`);
        setErrorState(false);
        setShowStatus(true);
        
        // Hide success message after a delay
        const timer = setTimeout(() => {
          setShowStatus(false);
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    } else {
      // Try to restore from local storage if currentWallet is not available
      if (typeof window !== 'undefined') {
        const savedWalletConnected = localStorage.getItem('walletConnected');
        const savedAddress = localStorage.getItem('walletAddress');
        const savedName = localStorage.getItem('walletName');
        
        if (savedWalletConnected === 'true' && savedAddress && savedName) {
          // We might be in a state where the wallet is connected but dapp-kit hasn't initialized it yet
          console.log('Wallet not available yet, but found in localStorage');
          return;
        }
      }
      
      setStatusMessage('Wallet disconnected');
      setErrorState(true);
      setShowStatus(true);
      setWalletInfo(null);
      setIsSlush(false);
      
      // Hide warning after a delay
      const timer = setTimeout(() => {
        setShowStatus(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [currentWallet]);
  
  // Listen for wallet connection events
  useEffect(() => {
    const handleWalletConnection = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail.connected) {
        // Display connection status
        const address = customEvent.detail.address;
        const name = customEvent.detail.name || 'Wallet';
        setStatusMessage(`Connected: ${name} ${address?.slice(0, 6)}...${address?.slice(-4)}`);
        setErrorState(false);
        setShowStatus(true);
        
        // Hide success message after a delay
        const timer = setTimeout(() => {
          setShowStatus(false);
        }, 5000);
        
        return () => clearTimeout(timer);
      } else {
        setStatusMessage('Wallet disconnected');
        setErrorState(true);
        setShowStatus(true);
        
        // Hide warning after a delay
        const timer = setTimeout(() => {
          setShowStatus(false);
        }, 3000);
        
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener(WALLET_CONNECTION_EVENT, handleWalletConnection);
    
    return () => {
      window.removeEventListener(WALLET_CONNECTION_EVENT, handleWalletConnection);
    };
  }, []);
  
  const handleDebugClick = () => {
    if (walletInfo) {
      console.log(walletInfo);
      alert(walletInfo);
    }
  };
  
  // Don't render anything if we're not showing status
  if (!showStatus && !errorState) return null;
  
  return (
    <div className={`fixed bottom-4 right-4 p-3 rounded-lg shadow-lg z-50 ${
      errorState ? 'bg-red-100 text-red-800' : 
      isSlush ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
    }`}>
      <p className="font-medium">{statusMessage}</p>
      {walletInfo && (
        <button 
          onClick={handleDebugClick}
          className="text-xs underline mt-1"
        >
          Debug wallet info
        </button>
      )}
    </div>
  );
};

export default WalletStatus; 