import { SuiClient } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import type { WalletAccount } from '@mysten/wallet-standard';

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
 * Creates a new subscription
 */
export async function createSubscription(
  suiClient: SuiClient,
  wallet: any, // Accept wallet object from dapp-kit
  merchantAddress: string,
  amount: number,
  intervalSecs: number
) {
  try {
    const tx = new TransactionBlock();
    
    // Call the create_subscription function
    tx.moveCall({
      target: `${PACKAGE_ID}::subscription::create_subscription`,
      arguments: [
        tx.pure(merchantAddress),
        tx.pure(amount),
        tx.pure(intervalSecs),
        tx.object('0x6'), // Clock object
      ],
    });
    
    // First sign the transaction with the wallet
    const signedTx = await wallet.signAndExecuteTransactionBlock({
      transactionBlock: tx,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });
    
    return signedTx;
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
  try {
    // This will need to be implemented based on your registry structure
    // For MVP, you may need to directly query objects owned by the subscriber
    const subscriptions = await suiClient.getOwnedObjects({
      owner: subscriberAddress,
      filter: {
        StructType: `${PACKAGE_ID}::subscription::Subscription`
      },
      options: {
        showContent: true,
        showType: true,
      }
    });

    return subscriptions.data.map(sub => formatSubscriptionData(sub));
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    throw error;
  }
}

/**
 * Execute payment for a subscription
 */
export async function executePayment(
  suiClient: SuiClient,
  wallet: any, // Accept wallet object from dapp-kit
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
    
    // Sign and execute with the wallet
    const result = await wallet.signAndExecuteTransactionBlock({
      transactionBlock: tx,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });
    
    return result;
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
  wallet: any, // Accept wallet object from dapp-kit
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
    
    // Sign and execute with the wallet
    const result = await wallet.signAndExecuteTransactionBlock({
      transactionBlock: tx,
      options: {
        showEffects: true,
      },
    });
    
    return result;
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
  wallet: any, // Accept wallet object from dapp-kit
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
    
    // Sign and execute with the wallet
    const result = await wallet.signAndExecuteTransactionBlock({
      transactionBlock: tx,
      options: {
        showEffects: true,
      },
    });
    
    return result;
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
  wallet: any, // Accept wallet object from dapp-kit
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
    
    // Sign and execute with the wallet
    const result = await wallet.signAndExecuteTransactionBlock({
      transactionBlock: tx,
      options: {
        showEffects: true,
      },
    });
    
    return result;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
}

/**
 * Formats subscription data from chain for UI
 */
export function formatSubscriptionData(rawData: any): SubscriptionData {
  // This will need to be implemented based on your actual data structure
  // For MVP, a simplified version is fine
  return {
    id: rawData.objectId,
    merchantAddress: rawData.content?.fields?.merchant || '',
    amount: rawData.content?.fields?.amount || '0',
    token: 'SUI', // Default to SUI for MVP
    interval: formatInterval(rawData.content?.fields?.interval_secs || 0),
    nextPayment: formatDate(rawData.content?.fields?.next_payment_time || 0),
    status: rawData.content?.fields?.status?.active ? 'active' : 'inactive',
    totalPaid: rawData.content?.fields?.payment_count || '0',
    remainingPayments: 'N/A', // This might need to be calculated or stored on chain
  };
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
  return new Date(timestamp * 1000).toISOString().split('T')[0];
} 