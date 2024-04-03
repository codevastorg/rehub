// lib.rs

use ic_cdk::export::candid::{CandidType, Deserialize};
use std::collections::HashMap;

// Define the data structures
#[derive(CandidType, Deserialize, Debug, Default)]
struct User {
    id: String,
    tokens: u64,
    milestones: Vec<Milestone>,
    redeemed_rewards: Vec<Reward>,
}

#[derive(CandidType, Deserialize, Debug, Default)]
struct Milestone {
    name: String,
    description: String,
    criteria: String, // Detailed criteria for how to achieve the milestone.
    achieved: bool,
}

#[derive(CandidType, Deserialize, Debug, Default)]
struct Reward {
    name: String,
    token_cost: u64,
    description: String,
}

// Define the smart contract state
#[derive(Default)]
struct RehabContractState {
    users: HashMap<String, User>,
    rewards_catalog: Vec<Reward>,
}

impl RehabContractState {
    // Add functions for handling users, tokens, milestones, and rewards here.
}

// Declare the global state
thread_local! {
    static STATE: RehabContractState = Default::default();
}

// Additional smart contract methods will go here...
