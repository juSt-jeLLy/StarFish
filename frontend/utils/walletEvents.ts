// Utility functions for handling wallet connection events and data reloading

import { WALLET_CONNECTION_EVENT } from '../services/walletContext';

/**
 * Adds a listener for wallet connection changes that triggers data reloading
 * @param reloadCallback Function to call when wallet connection changes
 * @returns A cleanup function to remove the event listener
 */
export function setupWalletConnectionListener(reloadCallback: () => void): () => void {
  const handleWalletConnection = () => {
    console.log('Wallet connection changed, reloading data...');
    reloadCallback();
  };

  window.addEventListener(WALLET_CONNECTION_EVENT, handleWalletConnection);
  
  return () => {
    window.removeEventListener(WALLET_CONNECTION_EVENT, handleWalletConnection);
  };
}

/**
 * Checks if the wallet is connected by checking localStorage
 * Use this to perform initial state checks before the wallet context is fully loaded
 */
export function isWalletConnected(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('walletConnected') === 'true';
}

/**
 * Gets the wallet address from localStorage
 * Use this to access the wallet address before the wallet context is fully loaded
 */
export function getStoredWalletAddress(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('walletAddress');
} 