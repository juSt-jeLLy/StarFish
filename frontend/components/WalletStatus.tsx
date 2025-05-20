'use client';

import { useCurrentWallet } from '@mysten/dapp-kit';
import { useEffect, useState } from 'react';
import { isSlushWallet } from '../services/slushWalletAdapter';
import { useWallet, WALLET_CONNECTION_EVENT, WALLET_RECONNECT_EVENT } from '../services/walletContext';

const WalletStatus = () => {
  const { currentWallet } = useCurrentWallet();
  const { 
    isConnected, 
    walletAddress, 
    walletName, 
    isSlush: contextIsSlush, 
    refreshPage,
    hasError,
    errorMessage,
    isTestnet 
  } = useWallet();
  
  const [showStatus, setShowStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorState, setErrorState] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  
  // Update status when wallet context has errors
  useEffect(() => {
    if (hasError && errorMessage) {
      setStatusMessage(errorMessage);
      setErrorState(true);
      setShowStatus(true);
    } else if (isConnected && walletAddress) {
      const networkStatus = isTestnet ? 'Testnet' : 'Unknown Network';
      setStatusMessage(`Connected: ${walletName} (${networkStatus})`);
      setErrorState(false);
      setShowStatus(true);
      
      // Hide success message after delay
      const timer = setTimeout(() => {
        setShowStatus(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [hasError, errorMessage, isConnected, isTestnet, walletName, walletAddress]);
  
  // Listen for wallet connection events
  useEffect(() => {
    const handleWalletConnection = (event: Event) => {
      const customEvent = event as CustomEvent;
      
      if (customEvent.detail.connected) {
        // Display connection status
        const name = customEvent.detail.name || 'Wallet';
        const isTestnet = customEvent.detail.isTestnet;
        const networkStatus = isTestnet ? 'Testnet' : 'Unknown Network';
        
        setStatusMessage(`Connected: ${name} (${networkStatus})`);
        setErrorState(false);
        setShowStatus(true);
        setReconnecting(false);
        
        // Hide success message after a delay
        const timer = setTimeout(() => {
          setShowStatus(false);
        }, 3000);
        
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
    
    const handleWalletReconnect = () => {
      setStatusMessage('Reconnecting wallet...');
      setErrorState(false);
      setShowStatus(true);
      setReconnecting(true);
    };

    window.addEventListener(WALLET_CONNECTION_EVENT, handleWalletConnection);
    window.addEventListener(WALLET_RECONNECT_EVENT, handleWalletReconnect);
    
    return () => {
      window.removeEventListener(WALLET_CONNECTION_EVENT, handleWalletConnection);
      window.removeEventListener(WALLET_RECONNECT_EVENT, handleWalletReconnect);
    };
  }, []);
  
  // Only render if there's a status to show
  if (!showStatus) return null;
  
  return (
    <div className="fixed top-20 right-4 z-50 max-w-xs w-full">
      <div 
        className={`px-4 py-3 rounded shadow-lg ${
          errorState 
            ? 'bg-red-50 border border-red-200 text-red-700' 
            : reconnecting
              ? 'bg-yellow-50 border border-yellow-200 text-yellow-700'
              : 'bg-green-50 border border-green-200 text-green-700'
        }`}
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {errorState ? (
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            ) : reconnecting ? (
              <svg className="h-5 w-5 text-yellow-400 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">
              {statusMessage}
            </p>
          </div>
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
        <button 
                onClick={() => setShowStatus(false)}
                className={`inline-flex rounded-md p-1.5 ${
                  errorState 
                    ? 'text-red-500 hover:bg-red-100 focus:bg-red-100' 
                    : reconnecting
                      ? 'text-yellow-500 hover:bg-yellow-100 focus:bg-yellow-100'
                      : 'text-green-500 hover:bg-green-100 focus:bg-green-100'
                }`}
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
        </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletStatus; 