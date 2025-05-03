module subscription_protocol::payment_executor {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::clock::{Self, Clock};
    use std::vector;
    use subscription_protocol::subscription::{Self, Subscription};
    use subscription_protocol::registry::{Self, Registry};

    // Error codes
    const ENotAuthorized: u64 = 1;
    const EInsufficientBalance: u64 = 2;
    const EPaymentNotDue: u64 = 3;
    
    // Payment executor for handling recurring payments
    struct PaymentExecutor has key {
        id: UID,
        admin: address,
    }
    
    // Capability that allows execution of payments
    struct PaymentExecutorCap has key, store {
        id: UID,
    }
    
    // Create a new payment executor
    fun init(ctx: &mut TxContext) {
        let admin = tx_context::sender(ctx);
        
        let executor = PaymentExecutor {
            id: object::new(ctx),
            admin,
        };
        
        let cap = PaymentExecutorCap {
            id: object::new(ctx)
        };
        
        transfer::share_object(executor);
        transfer::transfer(cap, admin);
    }
    
    // Process payment for a due subscription
    public fun process_payment(
        _cap: &PaymentExecutorCap,
        subscription: &mut Subscription,
        payment: &mut Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Only process if payment is due
        if (subscription::is_payment_due(subscription, clock)) {
            let amount = subscription::get_details(subscription).2;
            
            // Check if payment has enough balance
            if (coin::value(payment) >= amount) {
                let payment_coin = coin::split(payment, amount, ctx);
                subscription::execute_payment(subscription, payment_coin, clock, ctx);
            } else {
                abort EInsufficientBalance
            }
        } else {
            abort EPaymentNotDue
        }
    }
    
    // Process payments in batch for multiple subscriptions
    public fun process_payments_batch(
        _cap: &PaymentExecutorCap,
        registry: &Registry,
        subscriber: address,
        payment: &mut Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Get all subscriptions for the subscriber
        let subscription_ids = registry::get_subscriber_subscriptions(registry, subscriber);
        let subscription_count = vector::length(&subscription_ids);
        
        // If no subscriptions, return early
        if (subscription_count == 0) {
            return
        };
        
        // This is a simplified version; in a real implementation we would:
        // 1. Iterate through each subscription ID
        // 2. Get the subscription object
        // 3. Check if payment is due
        // 4. Execute payment if due
        
        // For this demo, we'll just handle the first subscription that's due
        // In a real implementation, we'd process all due subscriptions in order
        
        // Note: This is just a placeholder. In a real implementation,
        // you would need to retrieve the actual Subscription objects using the IDs
    }
} 