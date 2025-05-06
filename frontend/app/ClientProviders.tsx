'use client';

import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getFullnodeUrl } from '@mysten/sui/client';
import { ReactNode } from 'react';
import { WalletContextProvider } from '../services/walletContext';
import WalletStatus from '../components/WalletStatus';

// Create a query client
const queryClient = new QueryClient();

// Configure the SUI network - explicitly set testnet for better compatibility
const networks = {
  devnet: { url: getFullnodeUrl('devnet') },
  testnet: { url: getFullnodeUrl('testnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
};

// Set default network
const DEFAULT_NETWORK = 'testnet';

// Define localStorage key for wallet persistence
const STORAGE_KEY = 'sui-wallet-connection';

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork={DEFAULT_NETWORK}>
        <WalletProvider 
          autoConnect={true}
          enableUnsafeBurner={false}
          storageKey={STORAGE_KEY}
          storage={typeof window !== 'undefined' ? window.localStorage : undefined}
          preferredWallets={["Sui Wallet", "Ethos Wallet", "Suiet", "Surf Wallet"]}
        >
          <WalletContextProvider>
            <WalletStatus />
            {children}
          </WalletContextProvider>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
} 