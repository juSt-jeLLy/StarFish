import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-10">
      {/* Hero Section */}
      <section className="text-center py-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
          Recurring Payments on Sui
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
          A decentralized protocol for subscription and recurring payment management on the Sui blockchain.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link 
            href="/create"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            Create Subscription
          </Link>
          <Link 
            href="/subscriptions"
            className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-lg"
          >
            My Subscriptions
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Protocol Features</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold mb-3">Custom Intervals</h3>
            <p className="text-gray-600">
              Set up subscriptions with daily, weekly, monthly or custom intervals.
            </p>
          </div>
          <div className="p-6 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold mb-3">Auto Payments</h3>
            <p className="text-gray-600">
              Payments are automatically processed based on your agreement.
            </p>
          </div>
          <div className="p-6 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold mb-3">User Controls</h3>
            <p className="text-gray-600">
              Subscribers maintain full control with cancellation rights anytime.
            </p>
          </div>
          <div className="p-6 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold mb-3">Merchant Dashboard</h3>
            <p className="text-gray-600">
              Analytics and management tools for subscription providers.
            </p>
          </div>
          <div className="p-6 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold mb-3">Secure Processing</h3>
            <p className="text-gray-600">
              All transactions processed securely on the Sui blockchain.
            </p>
          </div>
          <div className="p-6 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold mb-3">Multi-Token Support</h3>
            <p className="text-gray-600">
              Support for SUI and other tokens on the network.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-50 rounded-xl p-8">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">1</div>
            <h3 className="text-xl font-semibold mb-3">Connect Wallet</h3>
            <p className="text-gray-600">
              Connect your Sui wallet to start using the protocol.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">2</div>
            <h3 className="text-xl font-semibold mb-3">Set Up Subscription</h3>
            <p className="text-gray-600">
              Choose a merchant, amount, interval, and payment token.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">3</div>
            <h3 className="text-xl font-semibold mb-3">Automatic Payments</h3>
            <p className="text-gray-600">
              Protocol automatically processes payments based on your agreement.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
