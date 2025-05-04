/**
 * Helper to get the proper network identifier for wallet requests
 */
export function getChainIdentifier(network?: string): string {
  // Default to testnet if not specified
  const networkName = network?.toLowerCase() || 'testnet';
  
  // Format according to Sui chain identifier requirements
  if (networkName.startsWith('sui:')) {
    return networkName;
  }
  
  // Handle different network names
  if (networkName.includes('main')) {
    return 'sui:mainnet';
  } else if (networkName.includes('dev')) {
    return 'sui:devnet';
  } else {
    return 'sui:testnet'; // Default to testnet
  }
}

/**
 * Get full network information
 */
export function getNetworkInfo() {
  // Try to get network info from window if available
  const isBrowser = typeof window !== 'undefined';
  if (isBrowser && (window as any).__sui_network) {
    const networkData = (window as any).__sui_network;
    return {
      name: networkData.name,
      chainId: getChainIdentifier(networkData.name),
      url: networkData.url,
    };
  }
  
  // Fallback to testnet
  return {
    name: 'testnet',
    chainId: 'sui:testnet',
    url: 'https://fullnode.testnet.sui.io',
  };
} 