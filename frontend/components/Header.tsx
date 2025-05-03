'use client';

import Link from 'next/link';
import { ConnectButton } from '@mysten/dapp-kit';

const Header = () => {
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
        
        <div className="flex items-center">
          <ConnectButton />
        </div>
      </div>
    </header>
  );
};

export default Header; 