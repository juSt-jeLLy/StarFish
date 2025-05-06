// Utility functions for handling wallet connection events and data reloading

import { WALLET_CONNECTION_EVENT, WALLET_RECONNECT_EVENT } from '../services/walletContext';

// Testnet chain identifier
export const TESTNET_CHAIN_ID = '2afc6800f98fb4462f821e8d41d0d8364a75bfe23b8a3d00daa25c3c6a3bb986';

/**
 * Check if a wallet is connected based on localStorage
 * @returns Boolean indicating if wallet is connected
 */
export function isWalletConnected(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('walletConnected') === 'true';
}

/**
 * Get wallet address from localStorage
 * @returns Wallet address or null if not available
 */
export function getStoredWalletAddress(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('walletAddress');
}

/**
 * Setup a listener for wallet connection events
 * @param onConnect Function to call when wallet connects
 * @param onDisconnect Function to call when wallet disconnects
 * @returns Cleanup function to remove the event listener
 */
export function setupWalletConnectionListener(
  onConnect: (address: string, name: string) => void,
  onDisconnect: () => void
): () => void {
  const handleWalletConnection = (event: Event) => {
    const customEvent = event as CustomEvent;
    
    if (customEvent.detail.connected) {
      onConnect(
        customEvent.detail.address,
        customEvent.detail.name || 'Unknown Wallet'
      );
    } else {
      onDisconnect();
    }
  };

  window.addEventListener(WALLET_CONNECTION_EVENT, handleWalletConnection);
  
  return () => {
    window.removeEventListener(WALLET_CONNECTION_EVENT, handleWalletConnection);
  };
}

/**
 * Adds a listener for wallet reconnection attempts
 * @param reconnectCallback Function to call when wallet reconnection is attempted
 * @returns A cleanup function to remove the event listener
 */
export function setupWalletReconnectListener(reconnectCallback: () => void): () => void {
  const handleWalletReconnect = () => {
    console.log('Wallet reconnect event received');
    reconnectCallback();
  };

  window.addEventListener(WALLET_RECONNECT_EVENT, handleWalletReconnect);
  
  return () => {
    window.removeEventListener(WALLET_RECONNECT_EVENT, handleWalletReconnect);
  };
}

/**
 * Safely reload the page, preventing infinite reload loops
 */
export function safeReloadPage(): void {
  if (typeof window === 'undefined') return;
  
  // Check if we're already in a reload cycle
  const reloadInProgress = localStorage.getItem('walletReloadInProgress') === 'true';
  
  if (!reloadInProgress) {
    // Set a flag to prevent multiple reloads
    localStorage.setItem('walletReloadInProgress', 'true');
    
    // Clear the flag after 3 seconds to prevent permanent lock
    setTimeout(() => {
      localStorage.removeItem('walletReloadInProgress');
    }, 3000);
    
    // Reload the page
    window.location.reload();
  } else {
    console.log('Reload already in progress, skipping additional reload');
    
    // Force clear the lock after 5 seconds in case something went wrong
    setTimeout(() => {
      localStorage.removeItem('walletReloadInProgress');
    }, 5000);
  }
}

/**
 * Checks if a chain ID corresponds to Sui testnet
 */
export function isTestnetChain(chainId: string): boolean {
  // Direct match with testnet chainId
  if (chainId === TESTNET_CHAIN_ID) return true;
  
  // Check for testnet string in chainId (some wallets use different formats)
  if (chainId.includes('testnet')) return true;
  
  // Check stored network info
  const storedNetwork = localStorage.getItem('sui_network');
  if (storedNetwork === 'testnet') {
    const storedChainId = localStorage.getItem('sui_chainId');
    if (storedChainId === chainId) return true;
  }
  
  return false;
}

/**
 * Tries to switch the wallet to testnet
 * @param wallet The wallet instance to switch
 * @returns A promise that resolves when the switch is complete or rejects if it fails
 */
export async function switchWalletToTestnet(wallet: any): Promise<boolean> {
  if (!wallet) return false;
  
  try {
    // Try standard switchChain method first
    if (typeof wallet.switchChain === 'function') {
      await wallet.switchChain('sui:testnet');
      return true;
    }
    
    // Try Suiet wallet format
    if (typeof wallet.select === 'function') {
      await wallet.select('testnet');
      return true;
    }
    
    // Try setting chain directly
    if (wallet.chain && typeof wallet.setChain === 'function') {
      await wallet.setChain('sui:testnet');
      return true;
    }
    
    // No supported method found
    console.warn('No supported method to switch network found for this wallet');
    return false;
  } catch (error) {
    console.error('Error switching to testnet:', error);
    return false;
  }
}

/**
 * Gets the wallet name from localStorage
 */
export function getStoredWalletName(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('walletName');
}

/**
 * Gets the wallet chain ID from localStorage
 */
export function getStoredWalletChainId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('wallet_chainId');
}

/**
 * Checks if the wallet is connected to testnet
 */
export function isWalletOnTestnet(): boolean {
  if (typeof window === 'undefined') return false;
  const chainId = getStoredWalletChainId();
  return chainId ? isTestnetChain(chainId) : false;
}

/**
 * Reloads the current page - useful for refreshing data after wallet changes
 */
export function reloadPage(): void {
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
}

/**
 * Forces pages to reload on next navigation if wallet state changed
 */
export function scheduleReloadAfterNavigation(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('needsReload', 'true');
  }
} 