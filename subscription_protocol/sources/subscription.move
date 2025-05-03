module subscription_protocol::subscription {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::clock::{Self, Clock};
    
    // Error codes
    const ENotAuthorized: u64 = 1;
    const EInactiveSubscription: u64 = 2;
    const EInsufficientPayment: u64 = 3;
    const ENoPaymentDue: u64 = 4;
    
    // Define subscription status
    struct SubscriptionStatus has drop, copy {
        active: bool,
        paused: bool,
        trial: bool,
    }
    
    // Define subscription object
    struct Subscription has key, store {
        id: UID,
        merchant: address,
        subscriber: address,
        amount: u64,
        interval_secs: u64,
        next_payment_time: u64,
        created_at: u64,
        status: SubscriptionStatus,
        last_payment_time: u64,
        payment_count: u64,
    }
    
    // Create a new subscription
    public fun create_subscription(
        merchant: address,
        amount: u64,
        interval_secs: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let subscriber = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock) / 1000;
        
        let status = SubscriptionStatus {
            active: true,
            paused: false,
            trial: false,
        };
        
        let subscription = Subscription {
            id: object::new(ctx),
            merchant,
            subscriber,
            amount,
            interval_secs,
            next_payment_time: current_time + interval_secs,
            created_at: current_time,
            status,
            last_payment_time: 0,
            payment_count: 0,
        };
        
        transfer::share_object(subscription);
    }
    
    // Execute payment for a subscription
    public fun execute_payment(
        subscription: &mut Subscription,
        payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Verify sender is subscriber
        assert!(tx_context::sender(ctx) == subscription.subscriber, ENotAuthorized);
        
        // Verify subscription is active
        assert!(is_active(subscription), EInactiveSubscription);
        
        // Verify payment is due
        assert!(is_payment_due(subscription, clock), ENoPaymentDue);
        
        // Verify payment amount
        assert!(coin::value(&payment) >= subscription.amount, EInsufficientPayment);
        
        // Send payment to merchant
        transfer::public_transfer(payment, subscription.merchant);
        
        // Update subscription state
        let current_time = clock::timestamp_ms(clock) / 1000;
        subscription.last_payment_time = current_time;
        subscription.next_payment_time = current_time + subscription.interval_secs;
        subscription.payment_count = subscription.payment_count + 1;
    }
    
    // Pause subscription
    public fun pause_subscription(subscription: &mut Subscription, ctx: &TxContext) {
        assert!(tx_context::sender(ctx) == subscription.subscriber, ENotAuthorized);
        subscription.status.paused = true;
    }
    
    // Resume subscription
    public fun resume_subscription(subscription: &mut Subscription, ctx: &TxContext) {
        assert!(tx_context::sender(ctx) == subscription.subscriber, ENotAuthorized);
        subscription.status.paused = false;
    }
    
    // Cancel subscription
    public fun cancel_subscription(subscription: &mut Subscription, ctx: &TxContext) {
        let sender = tx_context::sender(ctx);
        assert!(sender == subscription.subscriber || sender == subscription.merchant, ENotAuthorized);
        subscription.status.active = false;
    }
    
    // Enable trial period
    public fun enable_trial(subscription: &mut Subscription, ctx: &TxContext) {
        assert!(tx_context::sender(ctx) == subscription.merchant, ENotAuthorized);
        subscription.status.trial = true;
    }
    
    // Disable trial period
    public fun disable_trial(subscription: &mut Subscription, ctx: &TxContext) {
        assert!(tx_context::sender(ctx) == subscription.merchant, ENotAuthorized);
        subscription.status.trial = false;
    }
    
    // Get the merchant of a subscription
    public fun get_merchant(subscription: &Subscription): address {
        subscription.merchant
    }
    
    // Get the subscriber of a subscription
    public fun get_subscriber(subscription: &Subscription): address {
        subscription.subscriber
    }
    
    // Get subscription details
    public fun get_details(subscription: &Subscription): (address, address, u64, u64, u64, bool, bool) {
        (
            subscription.merchant,
            subscription.subscriber,
            subscription.amount,
            subscription.interval_secs,
            subscription.next_payment_time,
            subscription.status.active,
            subscription.status.paused
        )
    }
    
    // Check if a subscription is active and not paused
    public fun is_active(subscription: &Subscription): bool {
        subscription.status.active && !subscription.status.paused
    }
    
    // Check if a payment is due
    public fun is_payment_due(subscription: &Subscription, clock: &Clock): bool {
        let current_time = clock::timestamp_ms(clock) / 1000;
        current_time >= subscription.next_payment_time && is_active(subscription)
    }
    
    // Get payment history details
    public fun get_payment_history(subscription: &Subscription): (u64, u64) {
        (subscription.payment_count, subscription.last_payment_time)
    }
} 