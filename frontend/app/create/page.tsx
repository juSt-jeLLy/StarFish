'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCurrentWallet, useSuiClient } from '@mysten/dapp-kit';
import { useWallet, WALLET_CONNECTION_EVENT } from '../../services/walletContext';
import { createSubscription } from '../../services/contractService';
import { convertIntervalToSeconds } from '../../utils/timeUtils';
import { isSlushWallet } from '../../services/slushWalletAdapter';
import Link from 'next/link';
import { extractSubscriptionId } from '../../utils/subscriptionUtils';
import ClientProviders from '../ClientProviders';

// Contract addresses are defined in contractService.ts
// PACKAGE_ID = '0x437ccdb5c5fe77b78def7443793ce32c449feff41c15d4fe327619f5d1226d2e'
// REGISTRY_ID = '0xc4b12ce21d6175b9cdadc2678dd96cff144c432ac56669de6c619ccb76c0c2b1'

function CreateSubscriptionContent() {
  // Core hooks
  const { currentWallet } = useCurrentWallet();
  const suiClient = useSuiClient();
  const { 
    isConnected, 
    walletAddress, 
    shortAddress, 
    walletName, 
    isSlush: contextIsSlush,
    hasError,
    errorMessage
  } = useWallet();
  
  // Transaction and form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txResult, setTxResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    merchantAddress: '0x1ccb667c3aabb2b4e6ee4d81f349aaaa977fdc08cdbeed0fb8adadc7aaefe2fa',
    amount: '0.1',
    interval: 'monthly',
    token: 'SUI',
    maxPayments: '3',
  });
  
  // Display context wallet errors
  useEffect(() => {
    if (hasError && errorMessage) {
      setError(errorMessage);
    } else {
      // Clear error if wallet is now connected correctly
      if (isConnected && !hasError && error && error.includes('wallet')) {
        setError(null);
      }
    }
  }, [hasError, errorMessage, isConnected, error]);
  
  // Listen for wallet connection events
  useEffect(() => {
    const handleWalletEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Wallet connection event:', customEvent.detail);
      
      if (customEvent.detail.connected) {
        setStatusMessage('Wallet connected');
        // Only clear errors related to wallet connection
        if (error && (error.includes('wallet') || error.includes('connect'))) {
          setError(null);
        }
      } else {
        setStatusMessage('Wallet disconnected');
        setError('Please connect your wallet to create a subscription');
      }
    };
    
    window.addEventListener(WALLET_CONNECTION_EVENT, handleWalletEvent);
    
    return () => {
      window.removeEventListener(WALLET_CONNECTION_EVENT, handleWalletEvent);
    };
  }, [error]);
  
  // Form change handler
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);
  
  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setError(null);
    setTxResult(null);
    setStatusMessage("Processing your subscription request...");
    
    console.group('📝 CreateSubscription.handleSubmit');
    console.log('Starting subscription creation process');
    
    try {
      // Validate wallet connection
      if (!isConnected || !walletAddress) {
        throw new Error('Wallet not connected. Please connect your wallet to continue.');
      }
      
      if (!currentWallet || !currentWallet.accounts || currentWallet.accounts.length === 0) {
        throw new Error('No account found in wallet. Please reconnect your wallet.');
      }
      
      console.log(`Using wallet address: ${walletAddress}`);
      
      // Validate merchant address
      if (!formData.merchantAddress || !formData.merchantAddress.startsWith('0x')) {
        throw new Error('Invalid merchant address. It must start with 0x');
      }
      
      // Validate amount
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount greater than zero');
      }
      
      // Convert amount to MIST (smallest units)
      const amountMist = Math.floor(amount * 1_000_000_000);
      
      // Convert interval to seconds
      const intervalSecs = convertIntervalToSeconds(formData.interval);
      
      // Parse max payments
      const maxPayments = parseInt(formData.maxPayments) || 12;
      
      setStatusMessage("Waiting for wallet approval...");
      console.log(`Creating subscription: ${formData.merchantAddress}, ${amountMist} MIST, ${intervalSecs} seconds, max payments: ${maxPayments}`);
      
      try {
        // Call contract service
      const result = await createSubscription(
        suiClient,
        currentWallet,
        formData.merchantAddress,
        amountMist,
          intervalSecs,
          maxPayments
      );
      
        console.log('Transaction successful:', result);
        setStatusMessage("Transaction confirmed!");
      setTxResult(result);
      
        // Store successful transaction in localStorage
      if (result && result.digest) {
        try {
            const storedTxs = localStorage.getItem('subscriptionTransactions') || '[]';
            const transactions = JSON.parse(storedTxs);
          
          transactions.push({
            digest: result.digest,
              timestamp: new Date().toISOString(),
              merchant: formData.merchantAddress,
              amount: formData.amount,
              interval: formData.interval
          });
          
          localStorage.setItem('subscriptionTransactions', JSON.stringify(transactions));
        } catch (e) {
            console.error('Error saving transaction:', e);
          }
        }
      } catch (txErr: any) {
        console.error('Transaction error:', txErr);
        
        if (txErr.message && txErr.message.includes('insufficient gas budget')) {
          throw new Error('Transaction failed due to gas costs. This can happen when the network is congested. Please try again.');
        } else if (txErr.message && txErr.message.includes('authority signature')) {
          throw new Error('Wallet authentication failed. Please disconnect and reconnect your wallet.');
        } else {
          throw txErr; // Re-throw for the outer catch block to handle
        }
      }
    } catch (err: any) {
      console.error('Error creating subscription:', err);
      
      // Error categorization
      if (err.message && err.message.toLowerCase().includes('user rejected')) {
        setError('Transaction was rejected. Please try again and approve the transaction in your wallet.');
      } else if (contextIsSlush && err.message && (err.message.includes('chain') || err.message.includes('Slush'))) {
        setError(`Slush wallet error: ${err.message}`);
      } else if (err.message && err.message.includes('Execution aborted')) {
        setError(`Contract error: ${err.message}`);
      } else if (err.message && (err.message.includes('not found') || err.message.includes('404'))) {
        setError(`Network error: The contract could not be found. Please ensure you're connected to the testnet.`);
      } else if (err.message && err.message.includes('gas')) {
        setError(`Gas error: ${err.message}. Try again when the network is less congested.`);
      } else {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      }
    } finally {
      setIsSubmitting(false);
      console.groupEnd();
    }
  };
  
  // Helper to verify subscription creation
  const verifySubscription = async (txDigest: string) => {
    if (!txDigest || !suiClient) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      setStatusMessage("Verifying subscription on blockchain...");
      
      console.group('🔍 Verify Subscription');
      console.log(`Transaction digest: ${txDigest}`);
      
      // First attempt - immediate verification
      let subscriptionId = await extractSubscriptionId(suiClient, txDigest);
      
      // If not found on first try, wait 2 seconds and retry (blockchain might need time)
      if (!subscriptionId) {
        console.log('Subscription not found on first attempt, waiting 2 seconds to retry...');
        setStatusMessage("Waiting for blockchain confirmation...");
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        subscriptionId = await extractSubscriptionId(suiClient, txDigest);
      }
      
      // If still not found, try one last time after 3 more seconds
      if (!subscriptionId) {
        console.log('Subscription still not found, waiting 3 more seconds for final attempt...');
        setStatusMessage("Transaction confirmed, but still locating subscription...");
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        subscriptionId = await extractSubscriptionId(suiClient, txDigest);
      }
        
        if (subscriptionId) {
        console.log(`✅ Found subscription ID: ${subscriptionId}`);
          
        // Verify the object exists
            const subscriptionObj = await suiClient.getObject({
              id: subscriptionId,
              options: { showContent: true }
            });
            
            if (subscriptionObj.data?.content) {
          setStatusMessage(`Subscription verified! ID: ${subscriptionId}`);
          console.log('Subscription object content:', subscriptionObj.data?.content);
          
          // Store in localStorage
          const storedSubs = localStorage.getItem('createdSubscriptions') || '[]';
          const subscriptions = JSON.parse(storedSubs);
          
          subscriptions.push({
            id: subscriptionId,
            timestamp: new Date().toISOString(),
            txDigest: txDigest,
            merchant: formData.merchantAddress,
            amount: formData.amount
          });
          
          localStorage.setItem('createdSubscriptions', JSON.stringify(subscriptions));
          console.log('Subscription saved to localStorage');
            } else {
          setError('Subscription object found but has no content. This might be a temporary issue.');
          console.warn('Object found but has no content:', subscriptionObj);
        }
      } else {
        setError('No subscription found in this transaction. The transaction may have succeeded, but we could not locate the subscription object.');
        console.warn('Could not find subscription object in transaction');
        
        // Suggest the user check My Subscriptions page
        setStatusMessage("Try checking the 'My Subscriptions' page to see if it appears there.");
      }
      
      console.groupEnd();
    } catch (error) {
      console.error('Error verifying subscription:', error);
      setError(`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCreateAnother = () => {
    setTxResult(null);
    setError(null);
    setStatusMessage(null);
  };
  
  // Show error if wallet disconnected
  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6">Create Subscription</h1>
          
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            <p className="font-medium">Wallet Not Connected</p>
            <p className="text-sm">Please connect your wallet to create a subscription.</p>
          </div>
          
          <div className="flex justify-center">
            <Link href="/" className="text-blue-500 hover:text-blue-700">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // Show transaction result
  if (txResult) {
  return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6">Subscription Created!</h1>
      
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
            <p className="font-medium">Transaction Successful</p>
            <p className="text-sm">Your subscription has been created successfully.</p>
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Transaction Details</h2>
            <div className="bg-gray-50 p-4 rounded overflow-x-auto">
              <p className="text-sm font-mono mb-2">
                <span className="font-semibold">Digest:</span> {txResult.digest}
              </p>
              <p className="text-sm mb-2">
                <span className="font-semibold">Subscription Amount:</span> {formData.amount} {formData.token}
              </p>
              <p className="text-sm mb-2">
                <span className="font-semibold">Billing Interval:</span> {formData.interval}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Max Payments:</span> {formData.maxPayments}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap space-x-4 justify-center mb-4">
            <a 
              href={`https://suiexplorer.com/txblock/${txResult.digest}?network=testnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded mb-2 inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
              </svg>
                    View in Explorer
            </a>
            
                  <button
              onClick={() => verifySubscription(txResult.digest)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mb-2"
                    disabled={isSubmitting}
                  >
              {isSubmitting ? 'Verifying...' : 'Verify On-chain'}
                  </button>
            
                <button
              onClick={handleCreateAnother}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded mb-2"
                >
              Create Another
                </button>
            
            <Link href="/subscriptions">
              <span className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded inline-block mb-2">
                View My Subscriptions
              </span>
            </Link>
          </div>
          
          {statusMessage && (
            <div className="mt-4 text-center text-sm text-gray-600">
              {statusMessage}
              </div>
          )}
          
                {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Show subscription form
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">Create Subscription</h1>
        
        {walletAddress && (
          <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
            <p className="font-medium">Connected Wallet: {walletName}</p>
            <p className="text-sm">{shortAddress}</p>
                  </div>
                )}
                
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="merchantAddress">
                    Merchant Address
                  </label>
                  <input
                    type="text"
                    id="merchantAddress"
                    name="merchantAddress"
                    value={formData.merchantAddress}
                    onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
            <p className="text-xs text-gray-500 mt-1">
              The 0x address that will receive the subscription payments
            </p>
                </div>
                
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
              <label className="block text-gray-700 mb-2" htmlFor="amount">
                Amount
                    </label>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                step="0.000000001"
                min="0.000000001"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
              <label className="block text-gray-700 mb-2" htmlFor="token">
                      Token
                    </label>
                    <select
                      id="token"
                      name="token"
                      value={formData.token}
                      onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="SUI">SUI</option>
                    </select>
                  </div>
                </div>
                
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
              <label className="block text-gray-700 mb-2" htmlFor="interval">
                Billing Interval
                    </label>
                    <select
                      id="interval"
                      name="interval"
                      value={formData.interval}
                      onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  
                  <div>
              <label className="block text-gray-700 mb-2" htmlFor="maxPayments">
                Max Payments
                    </label>
                    <input
                      type="number"
                      id="maxPayments"
                      name="maxPayments"
                      value={formData.maxPayments}
                      onChange={handleChange}
                min="1"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
              <p className="text-xs text-gray-500 mt-1">
                Maximum number of payments before auto-cancellation
              </p>
                  </div>
                </div>
                
          <div className="flex justify-center">
                  <button
                    type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isSubmitting || !isConnected}
            >
              {isSubmitting ? 'Processing...' : 'Create Subscription'}
                  </button>
                </div>
        </form>
        
        {statusMessage && (
          <div className="mt-4 text-center text-sm text-blue-600">
            {statusMessage}
          </div>
        )}
        
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        </div>
    </div>
  );
}

export default function CreateSubscription() {
  return <CreateSubscriptionContent />;
} 