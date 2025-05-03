'use client';

import { useState, useEffect } from 'react';
import { useCurrentWallet } from '@mysten/dapp-kit';
import ClientProviders from '../ClientProviders';

// Define subscription type
interface Subscription {
  id: string;
  merchantName: string;
  merchantAddress: string;
  amount: string;
  token: string;
  interval: string;
  nextPayment: string;
  status: string;
  totalPaid: string;
  remainingPayments: number | string;
}

// Mock subscription data for demo purposes
const mockSubscriptions: Subscription[] = [
  {
    id: '1',
    merchantName: 'Premium Service',
    merchantAddress: '0x1234567890abcdef1234567890abcdef12345678',
    amount: '10',
    token: 'SUI',
    interval: 'monthly',
    nextPayment: '2023-07-15',
    status: 'active',
    totalPaid: '20',
    remainingPayments: 10,
  },
  {
    id: '2',
    merchantName: 'Digital Newsletter',
    merchantAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    amount: '5',
    token: 'SUI',
    interval: 'weekly',
    nextPayment: '2023-07-08',
    status: 'active',
    totalPaid: '15',
    remainingPayments: 4,
  },
  {
    id: '3',
    merchantName: 'Cloud Storage',
    merchantAddress: '0x7890abcdef1234567890abcdef1234567890abcd',
    amount: '20',
    token: 'USDC',
    interval: 'monthly',
    nextPayment: '2023-08-01',
    status: 'active',
    totalPaid: '60',
    remainingPayments: 'Unlimited',
  }
];

function MySubscriptionsContent() {
  const { currentWallet } = useCurrentWallet();
  const connected = !!currentWallet;
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would fetch data from the blockchain
    const fetchSubscriptions = async () => {
      // Simulate network delay
      setTimeout(() => {
        setSubscriptions(mockSubscriptions);
        setLoading(false);
      }, 800);
    };

    if (connected) {
      fetchSubscriptions();
    } else {
      setLoading(false);
    }
  }, [connected]);

  const handleCancel = (id: string) => {
    // In a real app, this would call a smart contract function
    setSubscriptions(subscriptions.filter(sub => sub.id !== id));
    alert(`Subscription ${id} cancelled! This is a demo.`);
  };

  if (!connected) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-6">My Subscriptions</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-yellow-700 mb-4">Please connect your wallet to view your subscriptions.</p>
          <p className="text-sm text-gray-600">
            Click the &apos;Connect Wallet&apos; button in the header to continue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6 text-center">My Subscriptions</h1>
      
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-10 text-center max-w-2xl mx-auto">
          <h3 className="text-xl font-semibold mb-3 text-gray-700">No Active Subscriptions</h3>
          <p className="text-gray-600 mb-6">
            You don&apos;t have any active subscription payments set up yet.
          </p>
          <a 
            href="/create"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            Create New Subscription
          </a>
        </div>
      ) : (
        <div className="grid gap-6">
          {subscriptions.map((sub) => (
            <div key={sub.id} className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold">{sub.merchantName}</h3>
                    <p className="text-sm text-gray-500 mt-1 truncate max-w-xs">
                      {sub.merchantAddress}
                    </p>
                  </div>
                  <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full uppercase font-medium">
                    {sub.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div>
                    <p className="text-sm text-gray-500">Payment</p>
                    <p className="font-medium">{sub.amount} {sub.token} {sub.interval}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Next Payment</p>
                    <p className="font-medium">{sub.nextPayment}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Remaining</p>
                    <p className="font-medium">{sub.remainingPayments}</p>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    Total paid: <span className="font-medium">{sub.totalPaid} {sub.token}</span>
                  </p>
                  <button
                    onClick={() => handleCancel(sub.id)}
                    className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Cancel Subscription
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MySubscriptions() {
  return (
    <ClientProviders>
      <MySubscriptionsContent />
    </ClientProviders>
  );
} 