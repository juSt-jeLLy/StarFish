/**
 * Debug utility for Sui wallets - focuses on finding transaction signing capabilities
 */

/**
 * Debug wallet capabilities and features
 * @param wallet The wallet to debug
 * @returns A string with debug information
 */
export function debugWalletCapabilities(wallet: any): string {
  if (!wallet) {
    return 'No wallet connected';
  }
  
  let debugInfo = `Wallet: ${wallet.name || 'Unknown'}\n`;
  debugInfo += `Accounts: ${wallet.accounts?.length || 0}\n`;
  
  // Check for basic connection features
  debugInfo += '\n=== Basic Features ===\n';
  debugInfo += `Connected: ${!!wallet.accounts?.length}\n`;
  debugInfo += `Chain: ${wallet.chain || 'unknown'}\n`;
  debugInfo += `Network: ${wallet.network || 'unknown'}\n`;
  
  // Check for transaction signing methods
  debugInfo += '\n=== Transaction Signing ===\n';
  debugInfo += `signAndExecuteTransactionBlock: ${typeof wallet.signAndExecuteTransactionBlock === 'function'}\n`;
  debugInfo += `signTransaction: ${typeof wallet.signTransaction === 'function'}\n`;
  debugInfo += `signMessage: ${typeof wallet.signMessage === 'function'}\n`;
  
  // Check for wallet features
  try {
    debugInfo += '\n=== Wallet Features ===\n';
    if (wallet.features) {
      const featureList = Object.keys(wallet.features);
      debugInfo += `Feature count: ${featureList.length}\n`;
      
      // Log each feature
      featureList.forEach(feature => {
        debugInfo += `- ${feature}\n`;
        
        // Check if the feature is a signing feature
        if (feature.toLowerCase().includes('sign')) {
          debugInfo += `  (Is signing feature)\n`;
        }
      });
      
      // Check for specific Sui features
      const hasSuiSignTx = featureList.some(f => f === 'sui:signTransactionBlock');
      const hasSuiExecTx = featureList.some(f => f === 'sui:executeTransactionBlock');
      
      debugInfo += `\nSui-specific features:\n`;
      debugInfo += `- sui:signTransactionBlock: ${hasSuiSignTx}\n`;
      debugInfo += `- sui:executeTransactionBlock: ${hasSuiExecTx}\n`;
    } else {
      debugInfo += 'No wallet.features object found\n';
    }
  } catch (e) {
    debugInfo += `Error accessing features: ${e}\n`;
  }
  
  // For Slush wallet specifically
  if (wallet.name?.toLowerCase().includes('slush')) {
    debugInfo += '\n=== Slush Wallet Specific ===\n';
    
    try {
      // Try to access Slush-specific properties
      if (wallet._features) {
        debugInfo += 'Found _features property\n';
      }
      
      // Check for adapter
      if (wallet.adapter) {
        debugInfo += 'Has adapter property\n';
        debugInfo += `Adapter methods: ${Object.getOwnPropertyNames(wallet.adapter).join(', ')}\n`;
      }
    } catch (e) {
      debugInfo += `Error accessing Slush properties: ${e}\n`;
    }
  }
  
  return debugInfo;
}

/**
 * Debug the wallet in the console
 */
export function logWalletDebug(wallet: any) {
  const debug = debugWalletCapabilities(wallet);
  console.log('=== WALLET DEBUG INFO ===');
  console.log(debug);
  return debug;
} 