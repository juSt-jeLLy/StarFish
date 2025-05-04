'use client';

import { useCurrentWallet } from '@mysten/dapp-kit';
import ClientProviders from './ClientProviders';
import Link from 'next/link';

function HomeContent() {
  const { currentWallet } = useCurrentWallet();
  const connected = !!currentWallet;

  return (
    <main className="flex-grow">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Recurring Payments on Sui Blockchain
        </h1>
          <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto">
            Enable subscription-based services for your Web3 business with our decentralized recurring payment protocol.
        </p>
          
          {connected ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/create" className="px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg shadow-lg">
            Create Subscription
          </Link>
              <Link href="/subscriptions" className="px-8 py-3 bg-transparent border border-white text-white rounded-lg hover:bg-white hover:text-blue-600 transition-colors font-semibold text-lg">
                Manage Subscriptions
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="#features" className="px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg shadow-lg">
                Learn More
              </Link>
              <button 
                onClick={() => document.querySelector('.connect-button')?.dispatchEvent(new Event('click'))}
                className="px-8 py-3 bg-transparent border border-white text-white rounded-lg hover:bg-white hover:text-blue-600 transition-colors font-semibold text-lg"
              >
                Connect Wallet
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-md">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Flexible Billing Cycles</h3>
            <p className="text-gray-600">
                Set up recurring payments with daily, weekly, monthly, quarterly, or yearly billing intervals to match your business needs.
            </p>
          </div>
            
            <div className="bg-white p-8 rounded-xl shadow-md">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
          </div>
              <h3 className="text-xl font-semibold mb-3">Secure & Transparent</h3>
            <p className="text-gray-600">
                Smart contract powered payments that are verifiable on-chain with full transparency and auditability built-in.
            </p>
          </div>
            
            <div className="bg-white p-8 rounded-xl shadow-md">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
          </div>
              <h3 className="text-xl font-semibold mb-3">Full Subscriber Control</h3>
            <p className="text-gray-600">
                Subscribers can pause, resume, or cancel their subscriptions at any time through a simple and intuitive interface.
            </p>
          </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg mr-4">1</div>
                  <h3 className="text-xl font-semibold">Connect Your Wallet</h3>
                </div>
                <p className="text-gray-600 pl-14">
                  Connect your Sui wallet to get started. Our protocol supports all major Sui wallets.
                </p>
              </div>
              
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg mr-4">2</div>
                  <h3 className="text-xl font-semibold">Create a Subscription</h3>
                </div>
                <p className="text-gray-600 pl-14">
                  Set up your recurring payment by specifying the merchant, amount, and billing interval.
                </p>
              </div>
              
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg mr-4">3</div>
                  <h3 className="text-xl font-semibold">Authorize Payment</h3>
                </div>
                <p className="text-gray-600 pl-14">
                  Confirm the subscription creation transaction in your wallet to authorize future recurring payments.
            </p>
          </div>
              
              <div>
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg mr-4">4</div>
                  <h3 className="text-xl font-semibold">Manage Your Subscriptions</h3>
                </div>
                <p className="text-gray-600 pl-14">
                  View, pause, resume, or cancel your subscriptions at any time through your user dashboard.
            </p>
          </div>
            </div>
            
            <div className="bg-gray-100 p-6 rounded-xl">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h4 className="font-semibold text-lg mb-2">Sample Subscription</h4>
                  <p className="text-gray-500 text-sm">Illustrative example</p>
                </div>
                
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Merchant</p>
                    <p className="font-medium truncate">0x1a2b3c4d5e6f...</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Amount</p>
                      <p className="font-medium">10 SUI</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Interval</p>
                      <p className="font-medium">Monthly</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Next Payment</p>
                      <p className="font-medium">Jun 1, 2023</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Status</p>
                      <p className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-4 flex space-x-2">
                    <button className="w-1/2 py-2 text-center border border-yellow-500 text-yellow-600 rounded-lg text-sm">
                      Pause
                    </button>
                    <button className="w-1/2 py-2 text-center border border-red-500 text-red-600 rounded-lg text-sm">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto">
            Join the future of subscription payments on the Sui blockchain. Create your first recurring payment in minutes.
          </p>
          
          {connected ? (
            <Link href="/create" className="px-8 py-3 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg shadow-lg">
              Create Your First Subscription
            </Link>
          ) : (
            <button 
              onClick={() => document.querySelector('.connect-button')?.dispatchEvent(new Event('click'))}
              className="px-8 py-3 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg shadow-lg"
            >
              Connect Wallet to Start
            </button>
          )}
    </div>
      </section>
    </main>
  );
}

export default function Home() {
  return (
    <ClientProviders>
      <HomeContent />
    </ClientProviders>
  );
}
