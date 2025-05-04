import { useState } from 'react';
import { useCurrentWallet, useSuiClient } from '@mysten/dapp-kit';
import { executePayment } from '../services/contractService';

interface PaymentExecutorProps {
  subscriptionId: string;
  amount: string;
  onSuccess?: (txDigest: string) => void;
  onError?: (error: Error) => void;
}

export default function PaymentExecutor({
  subscriptionId,
  amount,
  onSuccess,
  onError
}: PaymentExecutorProps) {
  const { currentWallet } = useCurrentWallet();
  const suiClient = useSuiClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const handleExecutePayment = async () => {
    if (!currentWallet) {
      setError('Wallet not connected. Please connect your wallet first.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Convert amount string to number
      const amountValue = parseInt(amount);
      
      if (isNaN(amountValue) || amountValue <= 0) {
        throw new Error('Invalid amount specified');
      }
      
      // Execute the payment
      const result = await executePayment(
        suiClient,
        currentWallet,
        subscriptionId,
        amountValue
      );
      
      console.log('Payment execution result:', result);
      setSuccess(`Payment executed successfully! Transaction ID: ${result.digest}`);
      
      if (onSuccess && result.digest) {
        onSuccess(result.digest);
      }
    } catch (err) {
      console.error('Error executing payment:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Failed to execute payment: ${errorMessage}`);
      
      if (onError && err instanceof Error) {
        onError(err);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="mt-4">
      <button
        onClick={handleExecutePayment}
        disabled={isSubmitting}
        className={`px-4 py-2 rounded-md text-sm font-medium ${
          isSubmitting 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
            : 'bg-green-500 text-white hover:bg-green-600'
        }`}
      >
        {isSubmitting ? 'Processing...' : 'Execute Payment'}
      </button>
      
      {error && (
        <div className="mt-2 p-2 text-sm text-red-700 bg-red-100 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mt-2 p-2 text-sm text-green-700 bg-green-100 rounded-md">
          {success}
        </div>
      )}
    </div>
  );
} 