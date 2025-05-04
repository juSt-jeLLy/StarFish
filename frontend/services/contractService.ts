import { SuiClient } from '@mysten/sui/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import type { WalletAccount } from '@mysten/wallet-standard';
import { isSlushWallet, executeSlushTransaction } from './slushWalletAdapter';

// Replace with your actual contract IDs after deployment
const PACKAGE_ID = '0x177d14d5f5ac73f35fef5c9667566a0d8947386b59c93f1aa3219299e68ba381'; // Replace with your deployed package ID
const REGISTRY_ID = '0x1c94bd91d5b1cda4988e91b2e11b01af59858e2d286076b2bd08a9568d754c43'; // Replace with your deployed registry object ID

export interface SubscriptionData {
  id: string;
  merchantAddress: string;
  amount: string;
  token: string;
  interval: string;
  nextPayment: string;
  status: string;
  totalPaid: string;
  remainingPayments: number | string;
}

/**
 * Basic wallet validation (account exists)
 */
function validateWallet(wallet: any): void {
  if (!wallet) {
    throw new Error('Wallet not connected. Please connect your wallet first.');
  }
  
  if (!wallet.accounts || wallet.accounts.length === 0) {
    throw new Error('No account found in wallet. Please connect your wallet properly.');
  }
}

/**
 * Executes a transaction using the connected wallet - handles various wallet implementations
 */
async function executeTransaction(wallet: any, tx: TransactionBlock, options = { showEffects: true, showObjectChanges: true }) {
  validateWallet(wallet);
  
  // Check if it's Slush wallet first
  if (isSlushWallet(wallet)) {
    console.log('Detected Slush wallet, using Slush adapter');
    return executeSlushTransaction(wallet, tx, options);
  }
  
  // Get supported features from wallet
  const walletName = wallet.name || 'Unknown Wallet';
  console.log(`Using wallet: ${walletName}`);
  
  if (wallet.accounts && wallet.accounts.length > 0) {
    console.log(`Wallet address: ${wallet.accounts[0].address}`);
  }
  
  // Log available methods on the wallet
  const methods = Object.getOwnPropertyNames(wallet)
    .filter(prop => typeof wallet[prop] === 'function')
    .join(', ');
  console.log(`Wallet methods: ${methods}`);
  
  // Different wallets have different interfaces for signing transactions
  try {
    // For Sui Wallet and most standard wallets
    if (typeof wallet.signAndExecuteTransactionBlock === 'function') {
      console.log('Using standard signAndExecuteTransactionBlock method');
      const result = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: tx,
        options,
      });
      console.log('Transaction signed and executed successfully');
      return result;
    }
    
    // For wallets with custom adapters
    else if (wallet.adapter && typeof wallet.adapter.signAndExecuteTransaction === 'function') {
      console.log('Using adapter.signAndExecuteTransaction method');
      const result = await wallet.adapter.signAndExecuteTransaction(tx);
      console.log('Transaction signed and executed successfully via adapter');
      return result;
    }
    
    // For wallets that expose signTransaction
    else if (typeof wallet.signTransaction === 'function') {
      console.log('Using signTransaction method');
      const result = await wallet.signTransaction(tx);
      console.log('Transaction signed successfully');
      return result;
    }
    
    // If none of these methods exist, wallet isn't compatible
    throw new Error(`Wallet ${walletName} doesn't support any known transaction signing methods. Available methods: ${methods}`);
  } catch (error: any) {
    console.error('Transaction signing error:', error);
    
    // Try to extract useful information from the error
    let errorMessage = error.message || 'Unknown error';
    
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
    
    if (error.data) {
      console.error('Error data:', error.data);
    }
    
    throw new Error(`Failed to sign transaction with ${walletName}: ${errorMessage}`);
  }
}

/**
 * Creates a new subscription
 */
export async function createSubscription(
  suiClient: SuiClient,
  wallet: any,
  merchantAddress: string,
  amount: number,
  intervalSecs: number
) {
  try {
    console.log('Creating subscription with the following parameters:');
    console.log(`- Package ID: ${PACKAGE_ID}`);
    console.log(`- Registry ID: ${REGISTRY_ID} (not used directly in function call)`);
    console.log(`- Merchant Address: ${merchantAddress}`);
    console.log(`- Amount (MIST): ${amount}`);
    console.log(`- Amount (SUI): ${amount / 1_000_000_000}`);
    console.log(`- Interval (seconds): ${intervalSecs}`);
    console.log(`- Wallet:`, wallet ? wallet.name : 'Unknown');
    
    // Validate merchant address format
    if (!merchantAddress || !merchantAddress.startsWith('0x')) {
      throw new Error('Invalid merchant address format. It must start with 0x');
    }
    
    // Make sure amount is a positive number
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Create transaction block
    const tx = new TransactionBlock();
    console.log('Building transaction block...');
    
    // Call the create_subscription function with the correct parameters
    // Based on contract inspection, the function expects:
    // merchant_address, amount, interval_secs, clock
    tx.moveCall({
      target: `${PACKAGE_ID}::subscription::create_subscription`,
      arguments: [
        tx.pure(merchantAddress),    // Merchant address
        tx.pure(amount),             // Amount (as a number, not a coin object)
        tx.pure(intervalSecs),       // Interval in seconds
        tx.object('0x6'),            // Clock object
      ],
    });
    
    console.log('Transaction block built successfully');
    console.log('Executing transaction...');
    
    // Use our universal transaction execution function
    const result = await executeTransaction(wallet, tx);
    
    console.log('Transaction executed successfully:', result);
    
    // Check for key properties in the result
    if (!result.digest) {
      console.warn('Transaction result missing digest. This may indicate an issue:', result);
    }
    
    return result;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

/**
 * Gets all subscriptions for a subscriber
 */
export async function getSubscriptionsForSubscriber(
  suiClient: SuiClient,
  subscriberAddress: string
) {
  if (!subscriberAddress) {
    throw new Error('Subscriber address is required');
  }
  
  console.log(`Fetching subscriptions for subscriber: ${subscriberAddress}`);
  console.log(`Using package ID: ${PACKAGE_ID}`);
  
  try {
    // Query objects owned by the subscriber
    console.log('Querying owned objects...');
    const objectType = `${PACKAGE_ID}::subscription::Subscription`;
    console.log(`Looking for objects of type: ${objectType}`);
    
    const subscriptions = await suiClient.getOwnedObjects({
      owner: subscriberAddress,
      filter: {
        StructType: objectType
      },
      options: {
        showContent: true,
        showType: true,
      }
    });
    
    console.log(`Found ${subscriptions.data.length} subscription objects`);
    
    // If no subscriptions found, return empty array
    if (!subscriptions.data || subscriptions.data.length === 0) {
      console.log('No subscriptions found for this address');
      return [];
    }
    
    // Map the raw data to our subscription interface
    const formattedSubscriptions = subscriptions.data.map(sub => {
      console.log(`Processing subscription: ${sub.data?.objectId}`);
      return formatSubscriptionData(sub);
    });
    
    console.log('Formatted subscriptions:', formattedSubscriptions);
    return formattedSubscriptions;
  } catch (error: any) {
    console.error('Error in getSubscriptionsForSubscriber:', error);
    
    // Check for specific error types to provide better error messages
    if (error.message && error.message.includes('not found')) {
      throw new Error(`Address ${subscriberAddress} not found. Please check the address and try again.`);
    }
    
    if (error.message && error.message.includes('Invalid digest')) {
      throw new Error('Network error: Invalid object digest. There might be an issue with the Sui network.');
    }
    
    throw new Error(`Failed to fetch subscriptions: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Execute payment for a subscription
 */
export async function executePayment(
  suiClient: SuiClient,
  wallet: any,
  subscriptionId: string,
  amount: number
) {
  try {
    const tx = new TransactionBlock();
    
    // Split coin for payment
    const [coin] = tx.splitCoins(tx.gas, [tx.pure(amount)]);
    
    // Call the execute_payment function
    tx.moveCall({
      target: `${PACKAGE_ID}::subscription::execute_payment`,
      arguments: [
        tx.object(subscriptionId),
        coin,
        tx.object('0x6'), // Clock object
      ],
    });
    
    // Use our universal transaction execution function
    return await executeTransaction(wallet, tx);
  } catch (error) {
    console.error('Error executing payment:', error);
    throw error;
  }
}

/**
 * Pause a subscription
 */
export async function pauseSubscription(
  suiClient: SuiClient,
  wallet: any,
  subscriptionId: string
) {
  try {
    const tx = new TransactionBlock();
    
    tx.moveCall({
      target: `${PACKAGE_ID}::subscription::pause_subscription`,
      arguments: [
        tx.object(subscriptionId),
      ],
    });
    
    // Use our universal transaction execution function with both options
    return await executeTransaction(wallet, tx, { showEffects: true, showObjectChanges: true });
  } catch (error) {
    console.error('Error pausing subscription:', error);
    throw error;
  }
}

/**
 * Resume a subscription
 */
export async function resumeSubscription(
  suiClient: SuiClient,
  wallet: any,
  subscriptionId: string
) {
  try {
    const tx = new TransactionBlock();
    
    tx.moveCall({
      target: `${PACKAGE_ID}::subscription::resume_subscription`,
      arguments: [
        tx.object(subscriptionId),
      ],
    });
    
    // Use our universal transaction execution function with both options
    return await executeTransaction(wallet, tx, { showEffects: true, showObjectChanges: true });
  } catch (error) {
    console.error('Error resuming subscription:', error);
    throw error;
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  suiClient: SuiClient,
  wallet: any,
  subscriptionId: string
) {
  try {
    const tx = new TransactionBlock();
    
    tx.moveCall({
      target: `${PACKAGE_ID}::subscription::cancel_subscription`,
      arguments: [
        tx.object(subscriptionId),
      ],
    });
    
    // Use our universal transaction execution function with both options
    return await executeTransaction(wallet, tx, { showEffects: true, showObjectChanges: true });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
}

/**
 * Formats subscription data from chain for UI
 */
export function formatSubscriptionData(rawData: any): SubscriptionData {
  console.log('Raw subscription data:', rawData);
  
  try {
    // Handle the case where data is in a different format
    const objectId = rawData.objectId || rawData.data?.objectId || '';
    
    // Extract content fields safely
    const fields = rawData.content?.fields || rawData.data?.content?.fields || {};
    console.log('Subscription fields:', fields);
    
    // Default values if fields are not available
    const merchantAddress = fields.merchant || fields.merchantAddress || 'Unknown';
    const amount = fields.amount || '0';
    const intervalSecs = fields.interval_secs || fields.intervalSecs || 0;
    const nextPaymentTime = fields.next_payment_time || fields.nextPaymentTime || 0;
    const isActive = fields.status?.active || fields.isActive || false;
    const paymentCount = fields.payment_count || fields.paymentCount || '0';
    
    return {
      id: objectId,
      merchantAddress: merchantAddress,
      amount: amount.toString(),
      token: 'SUI', // Default to SUI for MVP
      interval: formatInterval(parseInt(intervalSecs) || 0),
      nextPayment: formatDate(parseInt(nextPaymentTime) || 0),
      status: isActive ? 'active' : 'inactive',
      totalPaid: paymentCount.toString(),
      remainingPayments: 'N/A', // This might need to be calculated or stored on chain
    };
  } catch (error) {
    console.error('Error formatting subscription data:', error, rawData);
    
    // Return a default object instead of failing
    return {
      id: rawData.objectId || 'unknown-id',
      merchantAddress: 'Error: Could not parse data',
      amount: '0',
      token: 'SUI',
      interval: 'unknown',
      nextPayment: 'unknown',
      status: 'inactive',
      totalPaid: '0',
      remainingPayments: 'N/A',
    };
  }
}

// Helper function to format interval
function formatInterval(seconds: number): string {
  const days = seconds / 86400;
  if (days === 1) return 'daily';
  if (days === 7) return 'weekly';
  if (days >= 28 && days <= 31) return 'monthly';
  if (days >= 90 && days <= 92) return 'quarterly';
  if (days >= 365 && days <= 366) return 'yearly';
  return `${days} days`;
}

// Helper function to format timestamp
function formatDate(timestamp: number): string {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString();
}

/**
 * Extracts a subscription ID from transaction results
 */
export async function extractSubscriptionId(
  suiClient: SuiClient,
  txDigest: string
): Promise<string | null> {
  if (!txDigest) {
    console.error('No transaction digest provided');
    return null;
  }
  
  try {
    console.log(`Extracting subscription ID from transaction: ${txDigest}`);
    
    // Get transaction details
    const txData = await suiClient.getTransactionBlock({
      digest: txDigest,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      }
    });
    
    // Look for created objects in transaction
    const createdObjects = txData.objectChanges?.filter(change => 
      change.type === 'created' && 
      change.objectType.includes(`${PACKAGE_ID}::subscription::Subscription`)
    ) || [];
    
    if (createdObjects.length > 0) {
      const createdObject = createdObjects[0] as any; // Cast to any to avoid TypeScript errors
      console.log(`Found subscription object: ${createdObject.objectId}`);
      return createdObject.objectId;
    }
    
    console.log('No subscription object found in transaction');
    return null;
  } catch (error) {
    console.error('Error extracting subscription ID:', error);
    return null;
  }
}

/**
 * Gets a subscription by its ID
 */
export async function getSubscriptionById(
  suiClient: SuiClient,
  subscriptionId: string
): Promise<SubscriptionData | null> {
  if (!subscriptionId) {
    throw new Error('Subscription ID is required');
  }
  
  try {
    console.log(`Fetching subscription with ID: ${subscriptionId}`);
    
    const subscription = await suiClient.getObject({
      id: subscriptionId,
      options: {
        showContent: true,
        showType: true,
      }
    });
    
    if (!subscription.data || !subscription.data.content) {
      console.log('Subscription not found or has no content');
      return null;
    }
    
    return formatSubscriptionData(subscription);
  } catch (error) {
    console.error('Error fetching subscription by ID:', error);
    return null;
  }
} 