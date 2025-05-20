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
    console.group('🔍 Extracting subscription ID');
    console.log(`Transaction digest: ${txDigest}`);
    console.log(`Using Package ID: ${PACKAGE_ID}`);
    
    // Get transaction details
    console.log('Fetching transaction details...');
    const txData = await suiClient.getTransactionBlock({
      digest: txDigest,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      }
    });
    
    console.log('Transaction data received');
    
    // First check: Look for created objects matching our subscription type
    const createdObjects = txData.objectChanges?.filter(change => 
      change.type === 'created' && 
      change.objectType.includes(`${PACKAGE_ID}::subscription::Subscription`)
    ) || [];
    
    if (createdObjects.length > 0) {
      const createdObject = createdObjects[0] as any;
      console.log(`✅ Found subscription object: ${createdObject.objectId}`);
      console.groupEnd();
      return createdObject.objectId;
    }
    
    console.log('No subscription object found in created objects, checking transferred objects...');
    
    // Second check: Look in transferred objects (sometimes shared objects appear here)
    const transferredObjects = txData.objectChanges?.filter(change => 
      change.type === 'transferred' && 
      change.objectType?.includes(`${PACKAGE_ID}::subscription::Subscription`)
    ) || [];
    
    if (transferredObjects.length > 0) {
      const transferredObject = transferredObjects[0] as any;
      console.log(`✅ Found subscription in transferred objects: ${transferredObject.objectId}`);
      console.groupEnd();
      return transferredObject.objectId;
    }
    
    // Third check: Look at shared objects
    const sharedObjects = txData.objectChanges?.filter(change => 
      change.type === 'published' || 
      (change.type === 'mutated' && change.objectType?.includes(`${PACKAGE_ID}::subscription::Subscription`))
    ) || [];
    
    if (sharedObjects.length > 0) {
      const sharedObject = sharedObjects[0] as any;
      console.log(`✅ Found subscription in shared objects: ${sharedObject.objectId}`);
      console.groupEnd();
      return sharedObject.objectId;
    }
    
    // Fourth check: Look in events
    if (txData.events && txData.events.length > 0) {
      const subscriptionEvents = txData.events.filter(event => 
        event.type?.includes(`${PACKAGE_ID}::subscription`)
      );
      
      if (subscriptionEvents.length > 0) {
        console.log('Found subscription related events:', subscriptionEvents);
        
        // Try to extract object ID from event data
        for (const event of subscriptionEvents) {
          if (event.parsedJson && typeof event.parsedJson === 'object') {
            // Use typeguard and safer property access
            const parsedJson = event.parsedJson as Record<string, any>;
            if (parsedJson.subscription_id) {
              console.log(`✅ Found subscription ID in event: ${parsedJson.subscription_id}`);
              console.groupEnd();
              return parsedJson.subscription_id;
            }
          }
        }
      }
    }
    
    console.log('⚠️ No subscription object found in transaction');
    console.groupEnd();
    return null;
  } catch (error) {
    console.error('❌ Error extracting subscription ID:', error);
    console.groupEnd();
    return null;
  }
} 