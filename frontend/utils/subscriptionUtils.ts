import { SuiClient } from '@mysten/sui/client';

// Get package ID from contract service
const PACKAGE_ID = '0x49e2048033e8bde89359214ccbf916dffb68f44e917f0898d72c879a18f595a3';

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