'use client';

import Link from 'next/link';
import { ConnectButton, useCurrentWallet } from '@mysten/dapp-kit';
import { useEffect, useState } from 'react';
import { useWallet, WALLET_CONNECTION_EVENT } from '../services/walletContext';

const Header = () => {
  const { currentWallet } = useCurrentWallet();
  const { isConnected, shortAddress, walletName } = useWallet();
  const [activeRoute, setActiveRoute] = useState<string>('/');

  // Set active route on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setActiveRoute(window.location.pathname);
    }
  }, []);

  // Update address when wallet changes and dispatch events
  useEffect(() => {
    if (currentWallet && currentWallet.accounts[0]) {
      const walletAddress = currentWallet.accounts[0].address;
      const walletName = currentWallet.name || 'Unknown Wallet';
      
      // Dispatch wallet connection event for other components
      window.dispatchEvent(new CustomEvent(WALLET_CONNECTION_EVENT, {
        detail: {
          connected: true,
          address: walletAddress,
          name: walletName
        }
      }));
    } else if (typeof window !== 'undefined' && localStorage.getItem('walletConnected') === 'true') {
      // Dispatch wallet disconnection event
      window.dispatchEvent(new CustomEvent(WALLET_CONNECTION_EVENT, {
        detail: { connected: false }
      }));
    }
  }, [currentWallet]);

  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="text-xl font-bold">
            Sui Recurring Payments
          </Link>
        </div>
        
        <nav className="hidden md:flex space-x-6">
          <Link 
            href="/" 
            className={`hover:text-blue-200 transition-colors ${activeRoute === '/' ? 'text-white border-b-2 border-white pb-1' : 'text-blue-100'}`}
          >
            Home
          </Link>
          <Link 
            href="/create" 
            className={`hover:text-blue-200 transition-colors ${activeRoute === '/create' ? 'text-white border-b-2 border-white pb-1' : 'text-blue-100'}`}
          >
            Create Subscription
          </Link>
          <Link 
            href="/subscriptions" 
            className={`hover:text-blue-200 transition-colors ${activeRoute === '/subscriptions' ? 'text-white border-b-2 border-white pb-1' : 'text-blue-100'}`}
          >
            My Subscriptions
          </Link>
          <Link 
            href="/merchant" 
            className={`hover:text-blue-200 transition-colors ${activeRoute === '/merchant' ? 'text-white border-b-2 border-white pb-1' : 'text-blue-100'}`}
          >
            Merchant Dashboard
          </Link>
          <Link 
            href="/check-transactions" 
            className={`hover:text-blue-200 transition-colors ${activeRoute === '/check-transactions' ? 'text-white border-b-2 border-white pb-1' : 'text-blue-100'}`}
          >
            Transaction Checker
          </Link>
        </nav>
        
        <div className="flex items-center gap-4">
          {isConnected && shortAddress && (
            <div className="bg-purple-700 px-3 py-1 rounded text-sm">
              {shortAddress}
            </div>
          )}
          <ConnectButton />
        </div>
      </div>
    </header>
  );
};

export default Header; 