'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ClientProviders from '../../ClientProviders';
import SubscriptionDetail from '../../../components/SubscriptionDetail';
import Link from 'next/link';

function SubscriptionDetailContent() {
  const params = useParams();
  const subscriptionId = params.id as string;
  
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Subscription Details</h1>
        <div className="flex space-x-4">
          <Link
            href="/merchant"
            className="text-sm text-blue-600 hover:underline flex items-center"
          >
            ← Back to Merchant Dashboard
          </Link>
        </div>
      </div>
      
      <SubscriptionDetail subscriptionId={subscriptionId} />
    </div>
  );
}

export default function SubscriptionDetailPage() {
  return (
    <ClientProviders>
      <SubscriptionDetailContent />
    </ClientProviders>
  );
} 