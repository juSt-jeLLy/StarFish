module subscription_protocol::registry {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::table::{Self, Table};
    use sui::vec_set::{Self, VecSet};
    use sui::dynamic_object_field as dof;
    use sui::vector;
    use subscription_protocol::subscription::{Self, Subscription};

    // Error codes
    const ENotAuthorized: u64 = 1;
    const ESubscriptionAlreadyRegistered: u64 = 2;
    const ESubscriptionNotFound: u64 = 3;
    
    // Registry to track all subscriptions for merchants and subscribers
    struct Registry has key {
        id: UID,
        admin: address,
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
        ctx: &mut TxContext
    ) {
        let subscriber = subscription::get_subscriber(subscription);
        let merchant = subscription::get_merchant(subscription);
        let subscription_id = object::id(subscription);
        
        // Create merchant set if it doesn't exist
        if (!dof::exists_(&registry.id, merchant)) {
            dof::add(&mut registry.id, merchant, vec_set::empty<ID>());
        };
        
        // Create subscriber set if it doesn't exist
        if (!dof::exists_(&registry.id, subscriber)) {
            dof::add(&mut registry.id, subscriber, vec_set::empty<ID>());
        };
        
        // Add subscription to merchant's set
        let merchant_subs: &mut VecSet<ID> = dof::borrow_mut(&mut registry.id, merchant);
        if (!vec_set::contains(merchant_subs, &subscription_id)) {
            vec_set::insert(merchant_subs, subscription_id);
        };
        
        // Add subscription to subscriber's set
        let subscriber_subs: &mut VecSet<ID> = dof::borrow_mut(&mut registry.id, subscriber);
        if (!vec_set::contains(subscriber_subs, &subscription_id)) {
            vec_set::insert(subscriber_subs, subscription_id);
        };
    }
    
    // Unregister a subscription
    public fun unregister_subscription(
        registry: &mut Registry, 
        subscription: &Subscription,
        ctx: &mut TxContext
    ) {
        let subscriber = subscription::get_subscriber(subscription);
        let merchant = subscription::get_merchant(subscription);
        let subscription_id = object::id(subscription);
        
        // Remove from merchant's set if it exists
        if (dof::exists_(&registry.id, merchant)) {
            let merchant_subs: &mut VecSet<ID> = dof::borrow_mut(&mut registry.id, merchant);
            if (vec_set::contains(merchant_subs, &subscription_id)) {
                vec_set::remove(merchant_subs, &subscription_id);
            };
        };
        
        // Remove from subscriber's set if it exists
        if (dof::exists_(&registry.id, subscriber)) {
            let subscriber_subs: &mut VecSet<ID> = dof::borrow_mut(&mut registry.id, subscriber);
            if (vec_set::contains(subscriber_subs, &subscription_id)) {
                vec_set::remove(subscriber_subs, &subscription_id);
            };
        };
    }
    
    // Get all subscription IDs for a merchant
    public fun get_merchant_subscriptions(
        registry: &Registry, 
        merchant: address
    ): vector<ID> {
        if (!dof::exists_(&registry.id, merchant)) {
            return vector::empty<ID>()
        };
        
        let merchant_subs: &VecSet<ID> = dof::borrow(&registry.id, merchant);
        vec_set::into_keys(*merchant_subs)
    }
    
    // Get all subscription IDs for a subscriber
    public fun get_subscriber_subscriptions(
        registry: &Registry, 
        subscriber: address
    ): vector<ID> {
        if (!dof::exists_(&registry.id, subscriber)) {
            return vector::empty<ID>()
        };
        
        let subscriber_subs: &VecSet<ID> = dof::borrow(&registry.id, subscriber);
        vec_set::into_keys(*subscriber_subs)
    }
} 