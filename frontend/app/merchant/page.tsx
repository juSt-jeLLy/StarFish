'use client';

import { useState, useEffect } from 'react';
import { useCurrentWallet, useSuiClient } from '@mysten/dapp-kit';
import ClientProviders from '../ClientProviders';
import { SubscriptionData } from '../../services/contractService';
import { formatIntervalFromSeconds } from '../../utils/timeUtils';
import Link from 'next/link';

// Mock function to get merchant subscriptions - would be implemented using real data
async function getMerchantSubscriptions(merchantAddress: string, suiClient: any): Promise<SubscriptionData[]> {
  try {
    console.log(`Fetching subscriptions for merchant: ${merchantAddress}`);
    
    // First, try to get any stored subscription IDs from localStorage
    let storedSubscriptions: string[] = [];
    try {
      const stored = localStorage.getItem('createdSubscriptions');
      if (stored) {
        const parsedStored = JSON.parse(stored);
        storedSubscriptions = parsedStored.map((sub: any) => sub.id);
        console.log(`Found ${storedSubscriptions.length} stored subscription IDs:`, storedSubscriptions);
      }
    } catch (e) {
      console.error('Error reading stored subscriptions:', e);
    }
    
    // If we have stored IDs, try to fetch them directly
    if (storedSubscriptions.length > 0) {
      console.log('Attempting to fetch stored subscriptions by ID');
      
      const subscriptionPromises = storedSubscriptions.map(async (id) => {
        try {
          const subscription = await suiClient.getObject({
            id,
            options: {
              showContent: true,
              showType: true,
            }
          });
          
          if (subscription.data?.content) {
            // Format the subscription data
            const content = subscription.data.content as any;
            const fields = content.fields;
            
            if (fields.merchant === merchantAddress) {
              return {
                id,
                merchantAddress: fields.merchant,
                amount: fields.amount.toString(),
                token: 'SUI',
                interval: formatIntervalFromSeconds(parseInt(fields.interval_secs)),
                nextPayment: new Date(parseInt(fields.next_payment_time) * 1000).toLocaleDateString(),
                status: fields.status.active ? 'active' : 'inactive',
                totalPaid: fields.payment_count.toString(),
                remainingPayments: 'N/A',
              };
            }
          }
          return null;
        } catch (err) {
          console.error(`Error fetching subscription ${id}:`, err);
          return null;
        }
      });
      
      const results = await Promise.all(subscriptionPromises);
      const validSubscriptions = results.filter(sub => sub !== null) as SubscriptionData[];
      
      if (validSubscriptions.length > 0) {
        console.log(`Found ${validSubscriptions.length} valid subscriptions for merchant`);
        return validSubscriptions;
      }
    }
    
    // If no stored subscriptions or none were valid, fall back to mock data
    console.log('No valid subscriptions found, returning mock data');
  return [
    {
      id: '0x1234',
      merchantAddress,
      amount: '10000000000', // 10 SUI
      token: 'SUI',
      interval: 'monthly',
      nextPayment: '2023-07-15',
      status: 'active',
      totalPaid: '3',
      remainingPayments: 'N/A',
    },
    {
      id: '0x5678',
      merchantAddress,
      amount: '5000000000', // 5 SUI
      token: 'SUI',
      interval: 'weekly',
      nextPayment: '2023-07-08',
      status: 'active',
      totalPaid: '8',
      remainingPayments: 'N/A',
    },
];
  } catch (err) {
    console.error('Error in getMerchantSubscriptions:', err);
    // Return mock data on error
    return [
      {
        id: '0x1234 (mock data - error fetching real data)',
        merchantAddress,
        amount: '10000000000',
        token: 'SUI',
        interval: 'monthly',
        nextPayment: '2023-07-15',
        status: 'active',
        totalPaid: '3',
        remainingPayments: 'N/A',
      }
    ];
  }
}

function MerchantDashboardContent() {
  const { currentWallet } = useCurrentWallet();
  const suiClient = useSuiClient();
  const connected = !!currentWallet;
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    activeSubscriptions: 0,
    totalRevenue: 0,
    averageSubscriptionValue: 0,
    thisMonthRevenue: 0,
  });

  useEffect(() => {
    async function fetchData() {
      if (!connected || !currentWallet) {
        setLoading(false);
        return;
      }
      
      if (!currentWallet.accounts || currentWallet.accounts.length === 0) {
        setError('No account found in wallet. Please reconnect your wallet.');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const address = currentWallet.accounts[0].address;
        const fetchedSubscriptions = await getMerchantSubscriptions(address, suiClient);
        setSubscriptions(fetchedSubscriptions);
        
        // Calculate stats
        const active = fetchedSubscriptions.filter(s => s.status === 'active').length;
        const totalRevenue = fetchedSubscriptions.reduce(
          (sum, sub) => sum + (parseInt(sub.amount) * parseInt(sub.totalPaid)), 0
        );
        const avgValue = active > 0 
          ? fetchedSubscriptions
              .filter(s => s.status === 'active')
              .reduce((sum, sub) => sum + parseInt(sub.amount), 0) / active
          : 0;
        
        // In a real app, this would filter by date
        const thisMonthRevenue = totalRevenue * 0.4; // Mock calculation
        
        setStats({
          activeSubscriptions: active,
          totalRevenue,
          averageSubscriptionValue: avgValue,
          thisMonthRevenue,
        });
      } catch (err) {
        console.error('Error fetching merchant data:', err);
        setError('Failed to load your merchant dashboard. Please try again.');
      } finally {
      setLoading(false);
    }
    }

    fetchData();
  }, [currentWallet, suiClient, connected]);
  
  // Reload data when wallet connects
  useEffect(() => {
    if (connected && currentWallet?.accounts?.length > 0) {
      setLoading(true);
      setError(null);
    }
  }, [connected, currentWallet]);

  if (!connected) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-6">Merchant Dashboard</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-yellow-700 mb-4">Please connect your wallet to access your merchant dashboard.</p>
          <p className="text-sm text-gray-600">
            Click the &apos;Connect Wallet&apos; button in the header to continue.
          </p>
        </div>
      </div>
    );
  }

    return (
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6 text-center">Merchant Dashboard</h1>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          <p>{error}</p>
          <button 
            className="text-sm underline mt-2"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p>Loading merchant data...</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Active Subscriptions</h3>
              <p className="text-3xl font-bold">{stats.activeSubscriptions}</p>
        </div>
        
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Total Revenue</h3>
              <p className="text-3xl font-bold">{(stats.totalRevenue / 1_000_000_000).toFixed(2)} SUI</p>
        </div>
        
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Avg. Subscription Value</h3>
              <p className="text-3xl font-bold">{(stats.averageSubscriptionValue / 1_000_000_000).toFixed(2)} SUI</p>
        </div>
        
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-1">This Month</h3>
              <p className="text-3xl font-bold">{(stats.thisMonthRevenue / 1_000_000_000).toFixed(2)} SUI</p>
            </div>
          </div>
          
          {/* Subscriptions Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-semibold">Active Subscriptions</h2>
      </div>
      
            {subscriptions.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No active subscriptions found.
              </div>
            ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
              <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subscriber
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Interval
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Next Payment
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Paid
                      </th>
              </tr>
            </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {subscriptions.map((subscription) => (
                      <tr key={subscription.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="truncate max-w-[150px]">
                            <Link href={`/subscription/${subscription.id}`} className="text-blue-600 hover:underline">
                            {subscription.id}
                            </Link>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {parseInt(subscription.amount) / 1_000_000_000} {subscription.token}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                          {subscription.interval}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {subscription.nextPayment}
                        </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            subscription.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                    }`}>
                            {subscription.status}
                    </span>
                  </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {subscription.totalPaid} payments
                        </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
            )}
      </div>
        </>
      )}
    </div>
  );
}

export default function MerchantDashboard() {
  return (
    <ClientProviders>
      <MerchantDashboardContent />
    </ClientProviders>
  );
} 