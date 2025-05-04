'use client';

import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getFullnodeUrl } from '@mysten/sui/client';
import { ReactNode, useEffect } from 'react';
import WalletStatus from '../components/WalletStatus';
import { getChainIdentifier } from '../services/networkHelper';
import { WalletContextProvider } from '../services/walletContext';

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

// Store network info in window for global access - this helps wallets like Slush
if (typeof window !== 'undefined') {
  (window as any).__sui_network = {
    name: DEFAULT_NETWORK,
    chainId: getChainIdentifier(DEFAULT_NETWORK),
    url: networks[DEFAULT_NETWORK].url,
  };
}

// Define localStorage key for wallet persistence
const STORAGE_KEY = 'sui-wallet-connection';

// Log available wallets for debugging
function logWalletFeatures(wallet: any) {
  if (!wallet) return;
  
  console.log('Wallet name:', wallet.name);
  console.log('Wallet accounts:', wallet.accounts?.length || 0);
  
  // Log supported features
  if (wallet.features) {
    console.log('Wallet features:');
    try {
      Object.keys(wallet.features).forEach(key => {
        console.log(`- ${key}`);
      });
    } catch (e) {
      console.log('Could not enumerate features');
    }
  }
  
  // Log available methods
  console.log('Available methods:');
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(wallet))
    .filter(name => typeof wallet[name] === 'function' && name !== 'constructor');
  methods.forEach((method: string) => {
    console.log(`- ${method}`);
  });
}

export default function ClientProviders({ children }: { children: ReactNode }) {
  // Register console handler to help debug wallet connection issues
  useEffect(() => {
    const originalConsoleError = console.error;
    console.error = function(...args) {
      // Filter out known React errors related to wallet connection
      const errorMessage = args[0]?.toString() || '';
      if (errorMessage.includes('Warning: Invalid prop') && 
          errorMessage.includes('wallet')) {
        return;
      }
      originalConsoleError.apply(console, args);
    };
    
    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork={DEFAULT_NETWORK}>
        <WalletProvider 
          autoConnect={true}
          enableUnsafeBurner={false}
          storageKey={STORAGE_KEY}
          storage={typeof window !== 'undefined' ? window.localStorage : undefined}
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