# StarFish - Subscription Payment Protocol on Sui Blockchain

StarFish is a decentralized subscription payment protocol built on the Sui blockchain, enabling automated recurring payments between users and service providers. The protocol is currently deployed on Sui Testnet.

![StarFish](https://img.shields.io/badge/StarFish-Subscription%20Protocol-blue)
![Sui](https://img.shields.io/badge/Blockchain-Sui-5FC9F8)
![Status](https://img.shields.io/badge/Status-Testnet-orange)

## 🌟 Features

- **Flexible Subscription Plans**: Create subscriptions with customizable intervals (daily, weekly, monthly, quarterly, yearly)
- **Automated Payments**: Set up recurring payments that execute automatically at defined intervals
- **User Control**: Pause, resume, or cancel subscriptions at any time
- **Merchant Dashboard**: Track and manage subscription revenue streams
- **Secure Transactions**: All payment authorizations are secured by the Sui blockchain

## 🏗️ Architecture

The project consists of two main components:

1. **Smart Contracts (Sui Move)** - Located in `subscription_protocol/`
   - Secure subscription management and payment execution
   - On-chain subscription registry
   - Permission-based payment authorization

2. **Frontend (Next.js)** - Located in `frontend/`
   - User-friendly interface for creating and managing subscriptions
   - Integration with Sui wallets
   - Responsive design for all devices

## 🚀 Deployment Status

- **Network**: Sui Testnet
- **Package ID**: `0x49e2048033e8bde89359214ccbf916dffb68f44e917f0898d72c879a18f595a3`
- **Registry ID**: `0xddda7d8b49a096f046686232b8156e782c820205e195ea794a94c7d33877163c`

## 🔧 Setup Instructions

### Prerequisites

- Node.js v18+
- Sui CLI
- A Sui wallet with testnet SUI tokens

### Frontend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/StarFish.git
   cd StarFish
   ```

2. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

3. Create a `.env.local` file in the frontend directory:
   ```
   NEXT_PUBLIC_NETWORK=testnet
   NEXT_PUBLIC_PACKAGE_ID=0x49e2048033e8bde89359214ccbf916dffb68f44e917f0898d72c879a18f595a3
   NEXT_PUBLIC_REGISTRY_ID=0xddda7d8b49a096f046686232b8156e782c820205e195ea794a94c7d33877163c
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) to view the application

### Smart Contract Development (Optional)

1. Install Sui CLI if you haven't already:
   ```bash
   cargo install --locked --git https://github.com/MystenLabs/sui.git --branch main sui
   ```

2. Build the smart contract:
   ```bash
   cd subscription_protocol
   sui move build
   ```

## 🔍 Usage Guide

### Creating a Subscription

1. Connect your Sui wallet
2. Navigate to "Create Subscription"
3. Enter merchant address, payment amount, and interval
4. Confirm the transaction in your wallet

### Managing Subscriptions

1. Navigate to "My Subscriptions"
2. View all your active subscriptions
3. Use the controls to pause, resume, or cancel any subscription

## 🧪 Testing

To run the frontend tests:
```bash
cd frontend
npm test
```

## 📦 Building for Production

```bash
cd frontend
npm run build
```

## 📄 License

MIT 