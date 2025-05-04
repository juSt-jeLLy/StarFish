'use client';

import { useState, useEffect } from 'react';
import { useCurrentWallet, useSuiClient } from '@mysten/dapp-kit';
import ClientProviders from '../ClientProviders';
import { createSubscription } from '../../services/contractService';
import { convertIntervalToSeconds } from '../../utils/timeUtils';
import { isSlushWallet } from '../../services/slushWalletAdapter';
import { useWallet } from '../../services/walletContext';
import { isWalletConnected, getStoredWalletAddress } from '../../utils/walletEvents';
import Link from 'next/link';
import { extractSubscriptionId } from '../../utils/subscriptionUtils';

// Constants from contractService.ts
const PACKAGE_ID = '0x49e2048033e8bde89359214ccbf916dffb68f44e917f0898d72c879a18f595a3';
const REGISTRY_ID = '0xddda7d8b49a096f046686232b8156e782c820205e195ea794a94c7d33877163c';

function CreateSubscriptionContent() {
  const { currentWallet } = useCurrentWallet();
  const suiClient = useSuiClient();
  const { isConnected, walletAddress: contextWalletAddress } = useWallet();
  
  // State for client-side rendering
  const [isClient, setIsClient] = useState(false);
  
  // Combined connection state from multiple sources
  const connected = isConnected || !!currentWallet || isWalletConnected();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txResult, setTxResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  
  // Check for Slush wallet
  const [isSlush, setIsSlush] = useState(false);
  
  // Use useEffect to handle client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Detect if using Slush wallet
  useEffect(() => {
    if (currentWallet) {
      const slushDetected = isSlushWallet(currentWallet);
      setIsSlush(slushDetected);
      console.log(slushDetected ? 'Slush wallet detected' : 'Standard wallet detected');
    }
  }, [currentWallet]);
  
  const [formData, setFormData] = useState({
    merchantAddress: '0x1ccb667c3aabb2b4e6ee4d81f349aaaa977fdc08cdbeed0fb8adadc7aaefe2fa',
    amount: '',
    interval: 'monthly',
    token: 'SUI',
    maxPayments: '12',
  });
  
  // Check localStorage for wallet connection on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !currentWallet) {
      const isConnectedInStorage = localStorage.getItem('walletConnected') === 'true';
      
      if (isConnectedInStorage) {
        console.log('Wallet connection detected in localStorage');
      }
    }
  }, [currentWallet]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setError(null);
    setTxResult(null);
    setStatusMessage("Validating form data...");
    
    try {
      if (!currentWallet) {
        throw new Error('You need to connect your wallet first');
      }
      
      if (!currentWallet.accounts || currentWallet.accounts.length === 0) {
        throw new Error('No account found in wallet. Please reconnect your wallet.');
      }
      
      // Validate merchant address
      if (!formData.merchantAddress || !formData.merchantAddress.startsWith('0x')) {
        throw new Error('Invalid merchant address. It must start with 0x');
      }
      
      // Validate amount
      if (!formData.amount || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
        throw new Error('Please enter a valid amount greater than zero');
      }
      
      setStatusMessage("Preparing transaction...");
      console.log('Starting subscription creation with form data:', {
        merchantAddress: formData.merchantAddress,
        amount: formData.amount,
        interval: formData.interval,
        maxPayments: formData.maxPayments
      });
      
      // Convert amount to smallest units (MIST)
      const amountMist = Math.floor(parseFloat(formData.amount) * 1_000_000_000);
      
      // Convert interval to seconds
      const intervalSecs = convertIntervalToSeconds(formData.interval);
      
      console.log(`Creating subscription with amount: ${amountMist} MIST, interval: ${intervalSecs} seconds`);
      console.log(`Using wallet: ${currentWallet.name}, Address: ${currentWallet.accounts[0].address}`);
      console.log('Wallet features:', isSlush ? 'Using Slush wallet' : 'Standard wallet');
      
      setStatusMessage("Waiting for wallet approval...");
      
      // Call the contract service with correct parameters - per our code inspection:
      // merchant_address, amount, interval_secs
      const result = await createSubscription(
        suiClient,
        currentWallet,
        formData.merchantAddress,
        amountMist,
        intervalSecs
      );
      
      setStatusMessage("Transaction confirmed! Processing result...");
      console.log('Transaction result:', result);
      setTxResult(result);
      
      // Store the transaction digest in localStorage for later reference
      if (result && result.digest) {
        try {
          // Get existing transactions or initialize empty array
          const storedTxs = localStorage.getItem('subscriptionTransactions');
          const transactions = storedTxs ? JSON.parse(storedTxs) : [];
          
          // Add new transaction with timestamp
          transactions.push({
            digest: result.digest,
            timestamp: new Date().toISOString()
          });
          
          // Save back to localStorage
          localStorage.setItem('subscriptionTransactions', JSON.stringify(transactions));
          console.log('Transaction digest saved to localStorage');
        } catch (e) {
          console.error('Error saving transaction to localStorage:', e);
        }
      }
      
      // Show success message or redirect
      console.log('Transaction completed:', result);
    } catch (err: any) {
      console.error('Error creating subscription:', err);
      
      // Enhanced error handling with categorization
      if (err.message && err.message.toLowerCase().includes('user rejected')) {
        setError('Transaction was rejected by the wallet. Please try again and approve the transaction.');
      }
      // Enhanced error message for Slush wallet issues
      else if (isSlush && err.message && (
          err.message.includes('chain identifier') || 
          err.message.includes('Slush wallet')
      )) {
        setError(`Slush wallet error: ${err.message}`);
      } 
      // Handle contract errors
      else if (err.message && err.message.includes('Execution aborted')) {
        setError(`Smart contract error: ${err.message}`);
      }
      // Default error message
      else {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Helper function to verify subscription creation
  const verifySubscriptionCreation = async (txDigest: string) => {
    if (!txDigest) return;
    
    try {
      console.log(`Verifying subscription creation for transaction: ${txDigest}`);
      setIsSubmitting(true);
      
      // Use our helper function to extract the subscription ID
      const subscriptionId = await extractSubscriptionId(suiClient, txDigest);
      
      if (subscriptionId) {
        console.log(`Subscription ID: ${subscriptionId}`);
        
        // Check if subscription object exists
        try {
          const subscriptionObj = await suiClient.getObject({
            id: subscriptionId,
            options: { showContent: true }
          });
          
          if (subscriptionObj.data?.content) {
            console.log('Subscription verified - object exists on chain');
            setStatusMessage(`Subscription verified! ID: ${subscriptionId}`);
            
            // Store subscription ID in localStorage
            try {
              const storedSubs = localStorage.getItem('createdSubscriptions');
              const subscriptions = storedSubs ? JSON.parse(storedSubs) : [];
              
              subscriptions.push({
                id: subscriptionId,
                timestamp: new Date().toISOString(),
                txDigest: txDigest
              });
              
              localStorage.setItem('createdSubscriptions', JSON.stringify(subscriptions));
              console.log('Subscription ID saved to localStorage');
            } catch (e) {
              console.error('Error saving subscription to localStorage:', e);
            }
          } else {
            console.log('Subscription object not found or has no content');
            setError('Subscription object not found on the blockchain. There might be an issue with the contract.');
          }
        } catch (objError) {
          console.error('Error fetching subscription object:', objError);
          setError('Failed to verify subscription on the blockchain.');
        }
      } else {
        console.log('No subscription ID found in the transaction');
        setError('No subscription found in the transaction. The subscription may not have been created successfully.');
      }
    } catch (error) {
      console.error('Error verifying subscription:', error);
      setError(`Failed to verify subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Use a consistent container class regardless of connection state
  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6 text-center">Create a Subscription</h1>
      
      {isClient ? (
        !connected ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
            <p className="text-yellow-700 mb-4">Please connect your wallet to create a subscription.</p>
            <p className="text-sm text-gray-600">
              Click the &apos;Connect Wallet&apos; button in the header to continue.
            </p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-8">
            {txResult ? (
              <div className="text-center py-6">
                <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6">
                  <p className="font-bold text-lg mb-2">Subscription Created Successfully!</p>
                  <p>Your subscription has been created on the blockchain.</p>
                </div>
                <p className="mb-4 text-gray-600">Transaction Digest: {txResult.digest}</p>
                <div className="flex flex-col sm:flex-row justify-center gap-3 mb-4">
                  <button
                    onClick={() => {
                      window.open(`https://suiexplorer.com/txblock/${txResult.digest}?network=testnet`, '_blank');
                    }}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    View in Explorer
                  </button>
                  <Link 
                    href="/check-transactions"
                    className="px-6 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-center"
                  >
                    View All Transactions
                  </Link>
                  <button
                    onClick={() => verifySubscriptionCreation(txResult.digest)}
                    disabled={isSubmitting}
                    className={`px-6 py-2 ${isSubmitting ? 'bg-gray-200 text-gray-500' : 'bg-green-50 text-green-700 hover:bg-green-100'} rounded-lg transition-colors`}
                  >
                    {isSubmitting ? 'Verifying...' : 'Verify Subscription'}
                  </button>
                </div>
                <button
                  onClick={() => {
                    setTxResult(null);
                    setFormData({
                      merchantAddress: '0x1ccb667c3aabb2b4e6ee4d81f349aaaa977fdc08cdbeed0fb8adadc7aaefe2fa',
                      amount: '',
                      interval: 'monthly',
                      token: 'SUI',
                      maxPayments: '12',
                    });
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Another Subscription
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                    <p>{error}</p>
                  </div>
                )}
                
                <div>
                  <label htmlFor="merchantAddress" className="block text-sm font-medium text-gray-700 mb-1">
                    Merchant Address
                  </label>
                  <input
                    type="text"
                    id="merchantAddress"
                    name="merchantAddress"
                    value={formData.merchantAddress}
                    onChange={handleChange}
                    required
                    placeholder="Enter merchant's Sui address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Amount
                    </label>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.000001"
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
                      Token
                    </label>
                    <select
                      id="token"
                      name="token"
                      value={formData.token}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="SUI">SUI</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="interval" className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Interval
                    </label>
                    <select
                      id="interval"
                      name="interval"
                      value={formData.interval}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="maxPayments" className="block text-sm font-medium text-gray-700 mb-1">
                      Max Number of Payments
                    </label>
                    <input
                      type="number"
                      id="maxPayments"
                      name="maxPayments"
                      value={formData.maxPayments}
                      onChange={handleChange}
                      required
                      min="1"
                      placeholder="12"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-3 rounded-lg shadow-md ${
                      isSubmitting
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 transition-colors'
                    }`}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {statusMessage || 'Creating Subscription...'}
                      </div>
                    ) : 'Create Subscription'}
                  </button>
                </div>
                
                <div className="text-xs text-gray-500 mt-4">
                  <p>
                    By creating this subscription, you authorize the merchant to automatically withdraw the specified amount at the defined interval.
                    You can cancel this subscription at any time from your dashboard.
                  </p>
                </div>
              </form>
            )}
          </div>
        )
      ) : (
        // Loading state for SSR - this ensures consistent HTML structure
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-8">
          <div className="flex justify-center py-10">
            <div className="animate-pulse">Loading...</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreateSubscription() {
  return (
    <ClientProviders>
      <CreateSubscriptionContent />
    </ClientProviders>
  );
} 