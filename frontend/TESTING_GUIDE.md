# StarFish Subscription Testing Guide

## Overview

The create subscription page has been fixed and now uses the correct contract addresses:

- Package ID: `0x437ccdb5c5fe77b78def7443793ce32c449feff41c15d4fe327619f5d1226d2e`
- Registry ID: `0xc4b12ce21d6175b9cdadc2678dd96cff144c432ac56669de6c619ccb76c0c2b1`

## Testing Instructions

### Prerequisites

1. Make sure you have the Sui Wallet browser extension installed and configured with testnet
2. Ensure you have some testnet SUI tokens (use the Sui faucet if needed)

### Testing Steps

1. Access the create subscription page at:
   ```
   http://localhost:3000/create
   ```

2. Connect your wallet by clicking the "Connect Wallet" button in the top-right of the page

3. Verify the form is pre-filled with test values:
   - Merchant Address: `0x1ccb667c3aabb2b4e6ee4d81f349aaaa977fdc08cdbeed0fb8adadc7aaefe2fa`
   - Payment Amount: `0.1` SUI
   - Payment Interval: `Monthly`
   - Max Number of Payments: `3`

4. Click the "Create Subscription" button

5. Your wallet should prompt you to approve the transaction
   - Check that the contract address in the transaction matches our Package ID
   - Confirm the transaction

6. After confirmation, you should see a success message with:
   - Transaction digest
   - Option to view in Explorer
   - Option to verify the subscription

7. Click "Verify Subscription" to confirm it was created properly

8. Click "Create Another Subscription" to reset the form and try again if needed

### Troubleshooting

If you encounter issues:

1. Check browser console logs (F12) for detailed debugging information
2. Ensure your wallet is connected to testnet
3. Make sure you have sufficient SUI tokens for gas
4. Try refreshing the page if the wallet connection seems stale

### Verification

To verify your subscription was properly created:

1. Navigate to the "My Subscriptions" page at http://localhost:3000/subscriptions
2. Your newly created subscription should appear in the list
3. You can also view it on the Sui Explorer using the transaction link

## Technical Details

- The subscription is created using the `create_subscription` function from the contract
- The Move call uses four parameters: merchant address, amount, interval in seconds, and clock object
- The subscription is created as a shared object, so it's accessible by both merchant and subscriber
- The subscription status starts as active and not paused

If you need to modify testing parameters, edit the defaults in `frontend/app/create/page.tsx`. 