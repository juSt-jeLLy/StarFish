'use client';

import { useState } from 'react';
import { useCurrentWallet, useSuiClient, useWallets } from '@mysten/dapp-kit';
import ClientProviders from '../ClientProviders';
import { createSubscription } from '../../services/contractService';
import { convertIntervalToSeconds } from '../../utils/timeUtils';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { fromHEX } from '@mysten/sui.js/utils';

function CreateSubscriptionContent() {
  const { currentWallet } = useCurrentWallet();
  const suiClient = useSuiClient();
  const { signAndExecuteTransactionBlock } = useWallets();
  const connected = !!currentWallet;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txResult, setTxResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    merchantAddress: '',
    amount: '',
    interval: 'monthly',
    token: 'SUI',
    maxPayments: '12',
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setError(null);
    setTxResult(null);
    
    if (!currentWallet || !connected || !signAndExecuteTransactionBlock) {
      setError('You need to connect your wallet first');
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Convert amount to smallest units (MIST)
      const amountMist = Math.floor(parseFloat(formData.amount) * 1_000_000_000);
      
      // Convert interval to seconds
      const intervalSecs = convertIntervalToSeconds(formData.interval);
      
      // Use the connected wallet instead of a mock keypair
      // Call contract service
      const result = await createSubscription(
        suiClient,
        { signAndExecuteTransactionBlock }, // Pass the signAndExecuteTransactionBlock function
        formData.merchantAddress,
        amountMist,
        intervalSecs
      );
      
      setTxResult(result);
      
      // Show success message or redirect
      console.log('Transaction completed:', result);
    } catch (err) {
      console.error('Error creating subscription:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!connected) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-6">Create a Subscription</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-yellow-700 mb-4">Please connect your wallet to create a subscription.</p>
          <p className="text-sm text-gray-600">
            Click the &apos;Connect Wallet&apos; button in the header to continue.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6 text-center">Create a Subscription</h1>
      
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-8">
        {txResult ? (
          <div className="text-center py-6">
            <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6">
              <p className="font-bold text-lg mb-2">Subscription Created Successfully!</p>
              <p>Your subscription has been created on the blockchain.</p>
            </div>
            <p className="mb-4 text-gray-600">Transaction Digest: {txResult.digest}</p>
            <button
              onClick={() => {
                setTxResult(null);
                setFormData({
                  merchantAddress: '',
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
                {isSubmitting ? 'Creating Subscription...' : 'Create Subscription'}
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