'use client';

import { useState, useEffect } from 'react';
import { useCurrentWallet } from '@mysten/dapp-kit';
import ClientProviders from '../ClientProviders';

// Define types
interface Stats {
  totalSubscribers: number;
  activeSubscribers: number;
  cancelledSubscribers: number;
  totalRevenue: string;
  monthlyRevenue: string;
  averageSubscriptionValue: string;
  retentionRate: string;
  averageSubscriptionLength: string;
  currency: string;
}

interface Payment {
  id: string;
  subscriber: string;
  amount: string;
  token: string;
  date: string;
  status: string;
}

// Mock data for demo
const mockStats: Stats = {
  totalSubscribers: 128,
  activeSubscribers: 112,
  cancelledSubscribers: 16,
  totalRevenue: '1,280.00',
  monthlyRevenue: '320.00',
  averageSubscriptionValue: '10.00',
  retentionRate: '87%',
  averageSubscriptionLength: '4.2 months',
  currency: 'SUI',
};

const mockRecentPayments: Payment[] = [
  { id: 'p1', subscriber: '0x123...abc', amount: '10.00', token: 'SUI', date: '2023-07-01', status: 'Successful' },
  { id: 'p2', subscriber: '0x456...def', amount: '15.00', token: 'SUI', date: '2023-07-01', status: 'Successful' },
  { id: 'p3', subscriber: '0x789...ghi', amount: '5.00', token: 'SUI', date: '2023-07-02', status: 'Successful' },
  { id: 'p4', subscriber: '0xabc...123', amount: '20.00', token: 'USDC', date: '2023-07-02', status: 'Failed' },
  { id: 'p5', subscriber: '0xdef...456', amount: '10.00', token: 'SUI', date: '2023-07-03', status: 'Successful' },
];

function MerchantDashboardContent() {
  const { currentWallet } = useCurrentWallet();
  const connected = !!currentWallet;
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);

  useEffect(() => {
    // In a real app, this would fetch data from the blockchain
    const fetchMerchantData = async () => {
      // Simulate network delay
      setTimeout(() => {
        setStats(mockStats);
        setRecentPayments(mockRecentPayments);
        setLoading(false);
      }, 800);
    };

    if (connected) {
      fetchMerchantData();
    } else {
      setLoading(false);
    }
  }, [connected]);

  if (!connected) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-6">Merchant Dashboard</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-yellow-700 mb-4">Please connect your wallet to view your merchant dashboard.</p>
          <p className="text-sm text-gray-600">
            Click the &apos;Connect Wallet&apos; button in the header to continue.
          </p>
        </div>
      </div>
    );
  }

  // Loading spinner or no data message if stats are not loaded
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6 text-center">Merchant Dashboard</h1>
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // If not loading but stats are still null, show an error
  if (!stats) {
    return (
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6 text-center">Merchant Dashboard</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto text-center">
          <p className="text-red-700 mb-4">There was an error loading your dashboard data.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6 text-center">Merchant Dashboard</h1>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-500 text-sm">Total Subscribers</h3>
          <p className="text-3xl font-semibold mt-2">{stats.totalSubscribers}</p>
          <div className="flex items-center mt-2">
            <span className="text-green-500 text-sm">+8%</span>
            <span className="text-gray-400 text-xs ml-2">vs last month</span>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-500 text-sm">Active Subscribers</h3>
          <p className="text-3xl font-semibold mt-2">{stats.activeSubscribers}</p>
          <div className="flex items-center mt-2">
            <span className="text-gray-400 text-xs">Retention: {stats.retentionRate}</span>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-500 text-sm">Monthly Revenue</h3>
          <p className="text-3xl font-semibold mt-2">{stats.monthlyRevenue} {stats.currency}</p>
          <div className="flex items-center mt-2">
            <span className="text-green-500 text-sm">+12%</span>
            <span className="text-gray-400 text-xs ml-2">vs last month</span>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-500 text-sm">Avg. Subscription Value</h3>
          <p className="text-3xl font-semibold mt-2">{stats.averageSubscriptionValue} {stats.currency}</p>
          <div className="flex items-center mt-2">
            <span className="text-gray-400 text-xs">Length: {stats.averageSubscriptionLength}</span>
          </div>
        </div>
      </div>
      
      {/* Recent Payments */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Recent Payments</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscriber</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentPayments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.subscriber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.amount} {payment.token}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      payment.status === 'Successful' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-center">
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md">
          Export Payment History
        </button>
        <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md">
          Manage Subscription Plans
        </button>
        <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          Account Settings
        </button>
      </div>
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