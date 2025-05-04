'use client';

import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getFullnodeUrl } from '@mysten/sui/client';
import { ReactNode } from 'react';
import WalletStatus from '../components/WalletStatus';

// Create a query client
const queryClient = new QueryClient();

// Configure the SUI network
const networks = {
  devnet: { url: getFullnodeUrl('devnet') },
  testnet: { url: getFullnodeUrl('testnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
};

// Note: Get a project ID from https://cloud.walletconnect.com/
const walletConnectId = "2d00473ab5dd7beda8d72036d79a260f";

// Define localStorage key for wallet persistence
const STORAGE_KEY = 'sui-wallet-connection';

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork="testnet">
        <WalletProvider 
          autoConnect={true}
          enableUnsafeBurner={false}
          storageKey={STORAGE_KEY}
          preferredWallets={['Sui Wallet']}
        >
          <WalletStatus />
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
} 