'use client';

import { useCurrentWallet } from '@mysten/dapp-kit';
import { useEffect, useState } from 'react';

const WalletStatus = () => {
  const { currentWallet } = useCurrentWallet();
  const [showStatus, setShowStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  useEffect(() => {
    // Set message based on wallet connection status
    if (currentWallet) {
      const address = currentWallet.accounts[0]?.address;
      setStatusMessage(`Connected: ${address?.slice(0, 6)}...${address?.slice(-4)}`);
      
      // Show a temporary message when wallet is connected
      setShowStatus(true);
      const timer = setTimeout(() => {
        setShowStatus(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    } else {
      setStatusMessage('Wallet disconnected');
      setShowStatus(true);
      const timer = setTimeout(() => {
        setShowStatus(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [currentWallet]);
  
  // Don't render anything if we're not showing status
  if (!showStatus) return null;
  
  return (
    <div className={`fixed bottom-4 right-4 p-3 rounded-lg shadow-lg z-50 ${
      currentWallet ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`}>
      <p className="font-medium">{statusMessage}</p>
    </div>
  );
};

export default WalletStatus; 