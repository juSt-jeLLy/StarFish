import { TransactionBlock } from '@mysten/sui.js/transactions';
import { getChainIdentifier, getNetworkInfo } from './networkHelper';

/**
 * Helper function to check if the wallet is Slush wallet
 */
export function isSlushWallet(wallet: any): boolean {
  if (!wallet) return false;
  
  const name = wallet.name?.toLowerCase() || '';
  return name.includes('slush') || name === 'slush wallet';
}

/**
 * Special adapter for Slush Wallet to handle transaction execution
 */
export async function executeSlushTransaction(
  wallet: any, 
  transactionBlock: TransactionBlock,
  options = { showEffects: true, showObjectChanges: true }
) {
  if (!wallet) {
    throw new Error('Wallet not connected');
  }
  
  if (!wallet.accounts || wallet.accounts.length === 0) {
    throw new Error('No account found in wallet');
  }
  
  try {
    console.log('Using Slush wallet adapter...');
    
    // Get the network information
    const networkInfo = getNetworkInfo();
    // Ensure we have a valid chain identifier for Slush wallet
    const chain = wallet.chain || networkInfo.chainId;
    console.log('Using chain identifier:', chain);
    
    // Focus on using sui:signTransactionBlock as mentioned in the error message
    if (wallet.features && wallet.features['sui:signTransactionBlock']) {
      console.log('Slush: Using sui:signTransactionBlock feature');
      
      // Sign the transaction with the proper chain identifier
      const signResult = await wallet.features['sui:signTransactionBlock'].signTransactionBlock({
        transactionBlock,
        account: wallet.accounts[0],
        chain: chain, // Important: This is the key field Slush needs
      });
      
      console.log('Transaction signed successfully:', signResult);
      
      // Now we need to execute the transaction if the wallet supports it
      if (wallet.features['sui:executeTransactionBlock']) {
        console.log('Executing signed transaction with sui:executeTransactionBlock');
        return await wallet.features['sui:executeTransactionBlock'].executeTransactionBlock({
          transactionBlock: signResult.bytes,
          signature: signResult.signature,
          publicKey: wallet.accounts[0].publicKey,
          requestType: 'WaitForEffectsCert',
          options,
        });
      }
      
      return signResult;
    }
    
    // Try standard approach as fallback
    if (typeof wallet.signAndExecuteTransactionBlock === 'function') {
      console.log('Slush: Using standard signAndExecuteTransactionBlock method');
      
      // Add chain identifier to the request
      return await wallet.signAndExecuteTransactionBlock({
        transactionBlock,
        chain: chain,
        options,
      });
    }
    
    // If all else fails, throw a specific error about chain identifier
    throw new Error(`Slush wallet error: Please make sure to use 'sui:signTransactionBlock' feature with a valid chain identifier (sui:testnet or sui:mainnet)`);
  } catch (error: any) {
    console.error('Slush wallet error:', error);
    
    // Check for chain identifier error
    if (error.message && error.message.includes('chain identifier')) {
      const networkInfo = getNetworkInfo();
      throw new Error(`Chain identifier error: Please ensure your app is configured for the correct network (currently using ${networkInfo.name}). Valid chain identifiers are 'sui:testnet' or 'sui:mainnet'.`);
    }
    
    throw new Error(`Slush wallet error: ${error.message || 'Unknown error'}`);
  }
} 