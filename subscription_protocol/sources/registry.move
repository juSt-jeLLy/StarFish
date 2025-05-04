module subscription_protocol::registry {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::table::{Self, Table};
    use std::vector;
    use subscription_protocol::subscription::{Self, Subscription};

    // Error codes
    const ENotAuthorized: u64 = 1;
    const ESubscriptionAlreadyRegistered: u64 = 2;
    const ESubscriptionNotFound: u64 = 3;
    
    // Registry to track all subscriptions for merchants and subscribers
    struct Registry has key {
        id: UID,
        admin: address,
        merchant_subscriptions: Table<address, vector<ID>>,
        subscriber_subscriptions: Table<address, vector<ID>>
    }
    
    // Capability to manage the registry
    struct AdminCap has key, store {
        id: UID,
    }
    
    // Create a new registry
    fun init(ctx: &mut TxContext) {
        let admin = tx_context::sender(ctx);
        
        let registry = Registry {
            id: object::new(ctx),
            admin,
            merchant_subscriptions: table::new(ctx),
            subscriber_subscriptions: table::new(ctx)
        };
        
        let admin_cap = AdminCap {
            id: object::new(ctx),
        };
        
        // Share registry as a shared object
        transfer::share_object(registry);
        
        // Send admin cap to transaction sender
        transfer::transfer(admin_cap, admin);
    }
    
    // Register a subscription
    public fun register_subscription(
        registry: &mut Registry, 
        subscription: &Subscription,
        _ctx: &mut TxContext
    ) {
        let subscriber = subscription::get_subscriber(subscription);
        let merchant = subscription::get_merchant(subscription);
        let subscription_id = object::id(subscription);
        
        // Create merchant entry if it doesn't exist
        if (!table::contains(&registry.merchant_subscriptions, merchant)) {
            table::add(&mut registry.merchant_subscriptions, merchant, vector::empty<ID>());
        };
        
        // Create subscriber entry if it doesn't exist
        if (!table::contains(&registry.subscriber_subscriptions, subscriber)) {
            table::add(&mut registry.subscriber_subscriptions, subscriber, vector::empty<ID>());
        };
        
        // Add subscription to merchant's list
        let merchant_subs = table::borrow_mut(&mut registry.merchant_subscriptions, merchant);
        if (!vector::contains(merchant_subs, &subscription_id)) {
            vector::push_back(merchant_subs, subscription_id);
        };
        
        // Add subscription to subscriber's list
        let subscriber_subs = table::borrow_mut(&mut registry.subscriber_subscriptions, subscriber);
        if (!vector::contains(subscriber_subs, &subscription_id)) {
            vector::push_back(subscriber_subs, subscription_id);
        };
    }
    
    // Unregister a subscription
    public fun unregister_subscription(
        registry: &mut Registry, 
        subscription: &Subscription,
        _ctx: &mut TxContext
    ) {
        let subscriber = subscription::get_subscriber(subscription);
        let merchant = subscription::get_merchant(subscription);
        let subscription_id = object::id(subscription);
        
        // Remove from merchant's list if it exists
        if (table::contains(&registry.merchant_subscriptions, merchant)) {
            let merchant_subs = table::borrow_mut(&mut registry.merchant_subscriptions, merchant);
            let (found, index) = vector::index_of(merchant_subs, &subscription_id);
            if (found) {
                vector::remove(merchant_subs, index);
            };
        };
        
        // Remove from subscriber's list if it exists
        if (table::contains(&registry.subscriber_subscriptions, subscriber)) {
            let subscriber_subs = table::borrow_mut(&mut registry.subscriber_subscriptions, subscriber);
            let (found, index) = vector::index_of(subscriber_subs, &subscription_id);
            if (found) {
                vector::remove(subscriber_subs, index);
            };
        };
    }
    
    // Get all subscription IDs for a merchant
    public fun get_merchant_subscriptions(
        registry: &Registry, 
        merchant: address
    ): vector<ID> {
        if (!table::contains(&registry.merchant_subscriptions, merchant)) {
            return vector::empty<ID>()
        };
        
        *table::borrow(&registry.merchant_subscriptions, merchant)
    }
    
    // Get all subscription IDs for a subscriber
    public fun get_subscriber_subscriptions(
        registry: &Registry, 
        subscriber: address
    ): vector<ID> {
        if (!table::contains(&registry.subscriber_subscriptions, subscriber)) {
            return vector::empty<ID>()
        };
        
        *table::borrow(&registry.subscriber_subscriptions, subscriber)
    }
} 