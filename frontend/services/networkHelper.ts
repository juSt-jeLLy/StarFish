/**
 * Helper to get the proper network identifier for wallet requests
 */
export function getChainIdentifier(network?: string): string {
  // Always use testnet for this application
  return 'sui:testnet';
}

/**
 * Get full network information
 */
export function getNetworkInfo() {
  // Always return testnet information for this application
  return {
    name: 'testnet',
    chainId: 'sui:testnet',
    url: 'https://fullnode.testnet.sui.io',
  };
} 