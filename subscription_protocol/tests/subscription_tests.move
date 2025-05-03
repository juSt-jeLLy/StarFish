#[test_only]
module subscription_protocol::subscription_tests {
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::clock::{Self, Clock};
    use sui::test_utils::create_one_time_witness;
    use subscription_protocol::subscription::{Self, Subscription};
    
    // Test addresses
    const MERCHANT: address = @0xCAFE;
    const SUBSCRIBER: address = @0xFACE;
    
    // Test subscription creation
    #[test]
    fun test_create_subscription() {
        // Create test scenario
        let scenario = ts::begin(SUBSCRIBER);
        
        // Create a clock for testing
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));
        
        // Step 1: Create a subscription
        ts::next_tx(&mut scenario, SUBSCRIBER);
        {
            subscription::create_subscription(
                MERCHANT,
                1000000, // 1 SUI
                86400,   // 1 day in seconds
                &clock,
                ts::ctx(&mut scenario)
            );
        };
        
        // Step 2: Verify the subscription was created correctly
        ts::next_tx(&mut scenario, SUBSCRIBER);
        {
            let subscription = ts::take_shared<Subscription>(&scenario);
            
            let (merchant, subscriber, amount, interval_secs, _, active, paused) = 
                subscription::get_details(&subscription);
                
            assert!(merchant == MERCHANT, 0);
            assert!(subscriber == SUBSCRIBER, 0);
            assert!(amount == 1000000, 0);
            assert!(interval_secs == 86400, 0);
            assert!(active == true, 0);
            assert!(paused == false, 0);
            
            ts::return_shared(subscription);
        };
        
        // Clean up
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }
    
    // Test payment execution
    #[test]
    fun test_execute_payment() {
        // Create test scenario
        let scenario = ts::begin(SUBSCRIBER);
        
        // Create a clock for testing
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000);
        
        // Step 1: Create a subscription
        ts::next_tx(&mut scenario, SUBSCRIBER);
        {
            subscription::create_subscription(
                MERCHANT,
                1000000, // 1 SUI
                86400,   // 1 day in seconds
                &clock,
                ts::ctx(&mut scenario)
            );
        };
        
        // Step 2: Advance time and make a payment
        ts::next_tx(&mut scenario, SUBSCRIBER);
        {
            // Advance the clock
            clock::increment_for_testing(&mut clock, 86401); // 1 day + 1 second
            
            // Create a coin for payment
            let coin = coin::mint_for_testing<SUI>(1000000, ts::ctx(&mut scenario));
            
            // Take the subscription
            let subscription = ts::take_shared<Subscription>(&scenario);
            
            // Execute payment
            subscription::execute_payment(&mut subscription, coin, &clock, ts::ctx(&mut scenario));
            
            // Verify next payment time was updated
            let (_, _, _, _, next_payment_time, _, _) = subscription::get_details(&subscription);
            assert!(next_payment_time == 1000 + 86401 + 86400, 0); // initial + advance + interval
            
            ts::return_shared(subscription);
        };
        
        // Clean up
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }
    
    // Test pause/resume subscription
    #[test]
    fun test_pause_resume() {
        // Create test scenario
        let scenario = ts::begin(SUBSCRIBER);
        
        // Create a clock for testing
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));
        
        // Step 1: Create a subscription
        ts::next_tx(&mut scenario, SUBSCRIBER);
        {
            subscription::create_subscription(
                MERCHANT,
                1000000, // 1 SUI
                86400,   // 1 day in seconds
                &clock,
                ts::ctx(&mut scenario)
            );
        };
        
        // Step 2: Pause the subscription
        ts::next_tx(&mut scenario, SUBSCRIBER);
        {
            let subscription = ts::take_shared<Subscription>(&scenario);
            
            subscription::pause_subscription(&mut subscription, ts::ctx(&mut scenario));
            
            // Verify subscription is paused
            let (_, _, _, _, _, active, paused) = subscription::get_details(&subscription);
            assert!(active == true, 0);
            assert!(paused == true, 0);
            
            ts::return_shared(subscription);
        };
        
        // Step 3: Resume the subscription
        ts::next_tx(&mut scenario, SUBSCRIBER);
        {
            let subscription = ts::take_shared<Subscription>(&scenario);
            
            subscription::resume_subscription(&mut subscription, ts::ctx(&mut scenario));
            
            // Verify subscription is resumed
            let (_, _, _, _, _, active, paused) = subscription::get_details(&subscription);
            assert!(active == true, 0);
            assert!(paused == false, 0);
            
            ts::return_shared(subscription);
        };
        
        // Clean up
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }
} 