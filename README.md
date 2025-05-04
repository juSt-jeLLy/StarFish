# Sui Recurring Payments Protocol

A subscription-based payment protocol on the Sui blockchain, allowing users to authorize recurring payments to service providers.

## Features

- Create subscriptions with customizable intervals (daily, weekly, monthly, quarterly, yearly)
- Auto-payment execution through permissioned transactions
- Subscription management dashboard for users
- Pause, resume, and cancel subscription functionality

## Architecture

The project consists of two main components:

1. **Smart Contracts (Sui Move)** - Located in `subscription_protocol/`
   - Handles subscription creation, management, and payment execution
   - Secure authorization mechanisms for recurring payments
   - Registry of all active subscriptions

2. **Frontend (Next.js)** - Located in `frontend/`
   - User-friendly interface for creating and managing subscriptions
   - Merchant dashboard for tracking subscriptions
   - Integration with Sui wallet for transaction signing

## Setup Instructions

### Prerequisites

- Node.js v18+
- Rust (stable)
- Sui CLI

### Smart Contract Setup

1. Install Sui CLI if you haven't already:
   ```bash
   cargo install --locked --git https://github.com/MystenLabs/sui.git --branch main sui
   ```

2. Build the smart contract:
   ```bash
   cd subscription_protocol
   sui move build
   ```

### Frontend Setup

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Create a `.env.local` file:
   ```
   PACKAGE_ID=0x...  # This will be filled when you deploy
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

### Deploy Smart Contract

1. Create a `.env` file in the root directory:
   ```
   DEPLOYER_PRIVATE_KEY=your_private_key_base64
   ```

2. Deploy to testnet:
   ```bash
   cd frontend
   npm run deploy:testnet
   ```

3. Deploy to other networks:
   ```bash
   npm run deploy:devnet
   npm run deploy:mainnet
   npm run deploy:local
   ```

## Usage

### Creating a Subscription

1. Connect your wallet using the "Connect Wallet" button
2. Navigate to the "Create Subscription" page
3. Enter the merchant address, payment amount, and interval
4. Confirm the transaction in your wallet

### Managing Subscriptions

1. Navigate to the "My Subscriptions" page
2. View all your active subscriptions
3. Pause, resume, or cancel subscriptions as needed

## License

MIT 