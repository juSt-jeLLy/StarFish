'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CheckTransactions() {
  const [transactions, setTransactions] = useState<{ digest: string, timestamp: string }[]>([]);
  const [selectedTx, setSelectedTx] = useState<string | null>(null);
  const [txDetails, setTxDetails] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load transaction digests from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Get stored transactions
        const storedTxs = localStorage.getItem('subscriptionTransactions');
        if (storedTxs) {
          setTransactions(JSON.parse(storedTxs));
        }
      } catch (e) {
        console.error('Error loading transactions from local storage:', e);
      }
    }
  }, []);

  // Function to check a transaction on the blockchain
  const checkTransaction = async (digest: string) => {
    setLoading(true);
    setTxDetails(null);
    setError(null);
    setSelectedTx(digest);

    try {
      // Use the SUI API to get transaction details
      const response = await fetch(`https://fullnode.testnet.sui.io/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'sui_getTransactionBlock',
          params: [
            digest,
            {
              showInput: true,
              showEffects: true,
              showEvents: true,
              showObjectChanges: true,
            }
          ]
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        setError(`Error: ${data.error.message || 'Unknown error'}`);
      } else {
        setTxDetails(data.result);
      }
    } catch (err: any) {
      setError(`Failed to fetch transaction details: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to add a sample transaction (for testing)
  const addSampleTransaction = () => {
    const newTx = {
      digest: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
      timestamp: new Date().toISOString()
    };
    
    const updatedTxs = [...transactions, newTx];
    setTransactions(updatedTxs);
    
    // Save to localStorage
    localStorage.setItem('subscriptionTransactions', JSON.stringify(updatedTxs));
  };

  // Function to clear all transactions
  const clearTransactions = () => {
    setTransactions([]);
    localStorage.removeItem('subscriptionTransactions');
    setSelectedTx(null);
    setTxDetails(null);
  };

  // Function to manually add a transaction
  const handleManualAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem('txDigest') as HTMLInputElement;
    const digest = input.value.trim();
    
    if (digest && digest.startsWith('0x')) {
      const newTx = {
        digest,
        timestamp: new Date().toISOString()
      };
      
      const updatedTxs = [...transactions, newTx];
      setTransactions(updatedTxs);
      
      // Save to localStorage
      localStorage.setItem('subscriptionTransactions', JSON.stringify(updatedTxs));
      
      // Reset form
      input.value = '';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Transaction Checker</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - Transaction list */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Recent Transactions</h2>
            <div className="space-x-2">
              <button 
                onClick={addSampleTransaction}
                className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
              >
                + Sample
              </button>
              <button 
                onClick={clearTransactions}
                className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs"
              >
                Clear All
              </button>
            </div>
          </div>

          <form onSubmit={handleManualAdd} className="mb-4">
            <div className="flex space-x-2">
              <input
                type="text"
                name="txDigest"
                placeholder="Enter transaction digest (0x...)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm"
              >
                Add
              </button>
            </div>
          </form>
          
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No transactions found.</p>
              <p className="text-sm mt-2">Transactions will appear here when you create subscriptions.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {transactions.map((tx) => (
                <div 
                  key={tx.digest}
                  className={`p-3 rounded-lg cursor-pointer text-sm ${
                    selectedTx === tx.digest 
                      ? 'bg-blue-100 border border-blue-300' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => checkTransaction(tx.digest)}
                >
                  <div className="font-mono truncate">{tx.digest}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(tx.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-6">
            <Link 
              href="/create"
              className="block w-full text-center py-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200"
            >
              Create New Subscription
            </Link>
          </div>
        </div>
        
        {/* Right column - Transaction details */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Transaction Details</h2>
          
          {!selectedTx ? (
            <div className="text-center py-12 text-gray-500">
              <p>Select a transaction to view details</p>
            </div>
          ) : loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading transaction details...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-lg text-red-700">
              <p>{error}</p>
            </div>
          ) : txDetails ? (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Transaction Information</h3>
                <p className="text-sm"><span className="font-semibold">Digest:</span> {selectedTx}</p>
                <p className="text-sm"><span className="font-semibold">Sender:</span> {txDetails.transaction?.data?.sender || 'Unknown'}</p>
                <p className="text-sm"><span className="font-semibold">Status:</span> {txDetails.effects?.status?.status || 'Unknown'}</p>
                {txDetails.effects?.status?.error && (
                  <p className="text-sm text-red-600"><span className="font-semibold">Error:</span> {txDetails.effects.status.error}</p>
                )}
              </div>
              
              {/* Display events */}
              {txDetails.events && txDetails.events.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-bold mb-2">Events</h3>
                  <div className="space-y-2">
                    {txDetails.events.map((event: any, index: number) => (
                      <div key={index} className="text-sm p-2 bg-white rounded border border-gray-200">
                        <p className="font-mono text-xs truncate">{event.type}</p>
                        {event.parsedJson && (
                          <pre className="mt-2 text-xs overflow-x-auto p-2 bg-gray-50 rounded">
                            {JSON.stringify(event.parsedJson, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Display created objects */}
              {txDetails.objectChanges && txDetails.objectChanges.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-bold mb-2">Objects Created/Modified</h3>
                  <div className="space-y-2">
                    {txDetails.objectChanges
                      .filter((change: any) => change.type === 'created' || change.type === 'mutated')
                      .map((obj: any, index: number) => (
                        <div key={index} className="text-sm p-2 bg-white rounded border border-gray-200">
                          <p><span className="font-semibold">{obj.type}:</span> {obj.objectId}</p>
                          <p className="text-xs text-gray-500">{obj.objectType}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              
              {/* Raw JSON View Button */}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-blue-600">View Raw JSON</summary>
                <pre className="mt-2 text-xs bg-gray-50 p-4 rounded overflow-x-auto max-h-[300px] overflow-y-auto">
                  {JSON.stringify(txDetails, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No transaction details available</p>
            </div>
          )}
          
          {selectedTx && (
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  window.open(`https://suiexplorer.com/txblock/${selectedTx}?network=testnet`, '_blank');
                }}
                className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200"
              >
                View in Explorer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 