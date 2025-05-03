'use client';

import { useState } from 'react';
import { useCurrentWallet } from '@mysten/dapp-kit';
import ClientProviders from '../ClientProviders';

function CreateSubscriptionContent() {
  const { currentWallet } = useCurrentWallet();
  const connected = !!currentWallet;
  
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
    // This would connect to the Sui contract in a production app
    console.log('Subscription details:', formData);
    // Display success message or redirect
    alert('Subscription created successfully! This is a demo.');
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
        <form onSubmit={handleSubmit} className="space-y-6">
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
                <option value="USDC">USDC</option>
                <option value="USDT">USDT</option>
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
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              Create Subscription
            </button>
          </div>
          
          <div className="text-xs text-gray-500 mt-4">
            <p>
              By creating this subscription, you authorize the merchant to automatically withdraw the specified amount at the defined interval.
              You can cancel this subscription at any time from your dashboard.
            </p>
          </div>
        </form>
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