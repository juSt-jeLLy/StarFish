import { SuiClient } from '@mysten/sui/client';

// Hard-code the package ID directly (updated to the correct ID)
const PACKAGE_ID = '0x437ccdb5c5fe77b78def7443793ce32c449feff41c15d4fe327619f5d1226d2e';

// Log the package ID being used
console.log(`SubscriptionUtils using Package ID: ${PACKAGE_ID}`);

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