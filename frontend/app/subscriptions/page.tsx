'use client';

import { useState, useEffect } from 'react';
import { useCurrentWallet, useSuiClient } from '@mysten/dapp-kit';
import ClientProviders from '../ClientProviders';
import { getSubscriptionsForSubscriber, pauseSubscription, resumeSubscription, cancelSubscription, SubscriptionData } from '../../services/contractService';
import { formatIntervalFromSeconds, formatDateFromTimestamp } from '../../utils/timeUtils';

// We'll use the wallet adapter instead of a mock keypair
// The wallet adapter will handle signing through the connected wallet

function SubscriptionsContent() {
  const { currentWallet } = useCurrentWallet();
  const suiClient = useSuiClient();
  const connected = !!currentWallet;
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Fetch subscriptions
  useEffect(() => {
    async function fetchSubscriptions() {
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
        const fetchedSubscriptions = await getSubscriptionsForSubscriber(
          suiClient,
          currentWallet.accounts[0].address
        );
        setSubscriptions(fetchedSubscriptions);
      } catch (err) {
        console.error('Error fetching subscriptions:', err);
        setError('Failed to load your subscriptions. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchSubscriptions();
  }, [currentWallet, connected, suiClient]);

  // Reload data when wallet connects
  useEffect(() => {
    if (connected && currentWallet?.accounts?.length > 0) {
      setLoading(true);
      setError(null);
    }
  }, [connected, currentWallet]);

  const handlePauseSubscription = async (subscriptionId: string) => {
    if (!connected || !currentWallet) return;
    
    if (!currentWallet.accounts || currentWallet.accounts.length === 0) {
      setError('No account found in wallet. Please reconnect your wallet.');
      return;
    }
    
    try {
      setActionInProgress(subscriptionId);
      
      // Get a temporary signed transaction from the wallet
      const tx = await pauseSubscription(
        suiClient,
        currentWallet, // Use currentWallet instead of mockKeypair
        subscriptionId
      );
      
      // Update subscription status in UI
      setSubscriptions(prev => 
        prev.map(sub => 
          sub.id === subscriptionId 
            ? { ...sub, status: 'inactive' } 
            : sub
        )
      );
    } catch (err) {
      console.error('Error pausing subscription:', err);
      setError('Failed to pause subscription. Please try again.');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleResumeSubscription = async (subscriptionId: string) => {
    if (!connected || !currentWallet) return;
    
    try {
      setActionInProgress(subscriptionId);
      
      await resumeSubscription(
        suiClient,
        currentWallet, // Use currentWallet instead of mockKeypair
        subscriptionId
      );
      
      // Update subscription status in UI
      setSubscriptions(prev => 
        prev.map(sub => 
          sub.id === subscriptionId 
            ? { ...sub, status: 'active' } 
            : sub
        )
      );
    } catch (err) {
      console.error('Error resuming subscription:', err);
      setError('Failed to resume subscription. Please try again.');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!connected || !currentWallet) return;
    
    try {
      setActionInProgress(subscriptionId);
      
      await cancelSubscription(
        suiClient,
        currentWallet, // Use currentWallet instead of mockKeypair
        subscriptionId
      );
      
      // Remove subscription from UI
      setSubscriptions(prev => prev.filter(sub => sub.id !== subscriptionId));
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      setError('Failed to cancel subscription. Please try again.');
    } finally {
      setActionInProgress(null);
    }
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
          <p>Loading your subscriptions...</p>
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-10 text-center">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">No Active Subscriptions</h2>
          <p className="text-gray-600 mb-6">You don&apos;t have any active subscriptions yet.</p>
          <a 
            href="/create" 
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create a New Subscription
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {subscriptions.map((subscription) => (
            <div 
              key={subscription.id} 
              className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 truncate max-w-[200px]">
                      {subscription.merchantAddress}
                    </h3>
                    <p className="text-sm text-gray-500">Merchant</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm ${
                    subscription.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {subscription.status === 'active' ? 'Active' : 'Paused'}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="font-medium">
                      {parseInt(subscription.amount) / 1_000_000_000} {subscription.token}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Interval</p>
                    <p className="font-medium capitalize">{subscription.interval}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Next Payment</p>
                    <p className="font-medium">{subscription.nextPayment}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Paid</p>
                    <p className="font-medium">{subscription.totalPaid} payments</p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {subscription.status === 'active' ? (
                    <button 
                      onClick={() => handlePauseSubscription(subscription.id)}
                      disabled={actionInProgress === subscription.id}
                      className={`flex-1 py-2 border border-yellow-500 text-yellow-600 rounded-lg hover:bg-yellow-50 transition-colors ${
                        actionInProgress === subscription.id ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {actionInProgress === subscription.id ? 'Processing...' : 'Pause'}
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleResumeSubscription(subscription.id)}
                      disabled={actionInProgress === subscription.id}
                      className={`flex-1 py-2 border border-green-500 text-green-600 rounded-lg hover:bg-green-50 transition-colors ${
                        actionInProgress === subscription.id ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {actionInProgress === subscription.id ? 'Processing...' : 'Resume'}
                    </button>
                  )}
                  <button 
                    onClick={() => handleCancelSubscription(subscription.id)}
                    disabled={actionInProgress === subscription.id}
                    className={`flex-1 py-2 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition-colors ${
                      actionInProgress === subscription.id ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {actionInProgress === subscription.id ? 'Processing...' : 'Cancel'}
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

export default function Subscriptions() {
  return (
    <ClientProviders>
      <SubscriptionsContent />
    </ClientProviders>
  );
} 