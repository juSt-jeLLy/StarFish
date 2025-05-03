# Sui Recurring Payment Protocol

A subscription-based payment protocol built on the Sui blockchain that enables automatic recurring payments for web3 services.

## Project Overview

The Recurring Payment Protocol solves a critical Web2-to-Web3 gap by enabling subscription-based payments on Sui blockchain. It allows users to authorize recurring payments to service providers without manually executing transactions for each billing cycle.

## Key Features

1. Subscription creation with customizable intervals (weekly, monthly, quarterly, yearly)
2. Auto-payment execution through a permissioned protocol
3. Subscription management dashboard for users
4. Analytics for merchants
5. Pause/resume subscription functionality
6. Trial period options for merchants

## Project Structure

- `/subscription_protocol`: Smart contracts written in Move
  - `/sources`: Contract source code
  - `/tests`: Test files for contracts
- `/frontend`: Web interface for the protocol

## Development Setup

### Prerequisites

- Sui CLI
- Move language toolchain
- Node.js/React for frontend

### Installation

```bash
# Install Sui CLI
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch main sui

# Build the Move package
cd subscription_protocol
sui move build

# Run tests
sui move test
```

## License

MIT 