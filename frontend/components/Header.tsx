'use client';

import Link from 'next/link';
import { ConnectButton, useCurrentWallet } from '@mysten/dapp-kit';
import { useEffect, useState } from 'react';

const Header = () => {
  const { currentWallet } = useCurrentWallet();
  const [address, setAddress] = useState<string | null>(null);

  // Update address when wallet changes
  useEffect(() => {
    if (currentWallet && currentWallet.accounts[0]) {
      const walletAddress = currentWallet.accounts[0].address;
      // Format the address for display (first 6 and last 4 chars)
      setAddress(`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`);
    } else {
      setAddress(null);
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
          <Link href="/" className="hover:text-blue-200 transition-colors">
            Home
          </Link>
          <Link href="/create" className="hover:text-blue-200 transition-colors">
            Create Subscription
          </Link>
          <Link href="/subscriptions" className="hover:text-blue-200 transition-colors">
            My Subscriptions
          </Link>
          <Link href="/merchant" className="hover:text-blue-200 transition-colors">
            Merchant Dashboard
          </Link>
        </nav>
        
        <div className="flex items-center gap-4">
          {address && (
            <div className="bg-purple-700 px-3 py-1 rounded text-sm">
              {address}
            </div>
          )}
          <ConnectButton />
        </div>
      </div>
    </header>
  );
};

export default Header; 