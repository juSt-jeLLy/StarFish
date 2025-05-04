import { useState, useEffect } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { SubscriptionData, getSubscriptionById } from '../services/contractService';
import PaymentExecutor from './PaymentExecutor';

interface SubscriptionDetailProps {
  subscriptionId: string;
}

export default function SubscriptionDetail({ subscriptionId }: SubscriptionDetailProps) {
  const suiClient = useSuiClient();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  useEffect(() => {
    async function fetchSubscription() {
      if (!subscriptionId) {
        setError('No subscription ID provided');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const data = await getSubscriptionById(suiClient, subscriptionId);
        
        if (data) {
          setSubscription(data);
          setError(null);
        } else {
          setError('Subscription not found');
          setSubscription(null);
        }
      } catch (err) {
        console.error('Error fetching subscription:', err);
        setError(err instanceof Error ? err.message : 'Failed to load subscription details');
        setSubscription(null);
      } finally {
        setLoading(false);
      }
    }
    
    fetchSubscription();
  }, [subscriptionId, suiClient, refreshTrigger]);
  
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  const handlePaymentSuccess = (txDigest: string) => {
    console.log(`Payment successful with transaction digest: ${txDigest}`);
    // Refresh subscription data after successful payment
    setTimeout(() => {
      handleRefresh();
    }, 2000); // Give blockchain time to process
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading subscription details...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
        <p className="text-red-700">{error}</p>
        <button 
          onClick={handleRefresh}
          className="mt-2 text-sm text-blue-600 hover:underline"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  if (!subscription) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-700">No subscription data available.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Subscription Details</h2>
        <button 
          onClick={handleRefresh}
          className="text-sm text-blue-600 hover:underline flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Subscription ID</h3>
            <p className="mt-1 text-sm break-all">{subscription.id}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Status</h3>
            <p className="mt-1">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                subscription.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {subscription.status}
              </span>
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Merchant</h3>
            <p className="mt-1 text-sm truncate">{subscription.merchantAddress}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Amount</h3>
            <p className="mt-1 text-sm">{parseInt(subscription.amount) / 1_000_000_000} {subscription.token}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Interval</h3>
            <p className="mt-1 text-sm capitalize">{subscription.interval}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Next Payment</h3>
            <p className="mt-1 text-sm">{subscription.nextPayment}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Payments Made</h3>
            <p className="mt-1 text-sm">{subscription.totalPaid}</p>
          </div>
        </div>
        
        {subscription.status === 'active' && (
          <div className="mt-6 border-t border-gray-200 pt-4">
            <h3 className="text-base font-medium">Payment Actions</h3>
            <PaymentExecutor 
              subscriptionId={subscription.id} 
              amount={subscription.amount}
              onSuccess={handlePaymentSuccess}
            />
          </div>
        )}
      </div>
    </div>
  );
} 