import { Canister, query, update, nat64, Opt, Result, Err, Ok, text, Record, Vec, Variant, StableBTreeMap } from "azle";
import { v4 as uuidv4 } from "uuid";

// Define data models
const User = Record({
    id: text,
    name: text,
    sobrietyDate: nat64,
    tokens: nat64,
    claimedMilestones: Vec(text),
    roles: Vec(text),
});

const Milestone = Record({
    id: text,
    durationInDays: nat64,
    tokenReward: nat64,
    description: text,
});

const Transaction = Record({
    id: text,
    fromUserId: Opt(text),
    toUserId: text,
    amount: nat64,
    timestamp: nat64,
});

const Reward = Record({
    id: text,
    tokenCost: nat64,
    description: text,
    availability: nat64,
});

const Activity = Record({
    id: text,
    userId: text,
    validatorId: text,
    description: text,
    dateValidated: nat64,
    tokensAwarded: nat64,
});

const Message = Variant({
    NotFound: text,
    InvalidPayload: text,
});

// Initialize storage
const users = StableBTreeMap(0, text, User);
const milestones = StableBTreeMap(1, text, Milestone);
const transactions = StableBTreeMap(2, text, Transaction);
const rewards = StableBTreeMap(3, text, Reward);
const activities = StableBTreeMap(4, text, Activity);

export default Canister({
    // Add a new user
    addUser: update([User], Result(User, Message), (userPayload) => {
        if (!userPayload.name || !userPayload.sobrietyDate) {
            return Err({ InvalidPayload: "Invalid user data" });
        }
        const id = uuidv4();
        const newUser = { ...userPayload, id };
        users.insert(id, newUser);
        return Ok(newUser);
    }),

    // Get a user by ID
    getUser: query([text], Result(User, Message), (id) => {
        const user = users.get(id);
        return user ? Ok(user) : Err({ NotFound: `User with id=${id} not found` });
    }),

    // Add a milestone
    addMilestone: update([Milestone], Result(Milestone, Message), (milestonePayload) => {
        const id = uuidv4();
        const newMilestone = { ...milestonePayload, id };
        milestones.insert(id, newMilestone);
        return Ok(newMilestone);
    }),

    // Get a milestone by ID
    getMilestone: query([text], Result(Milestone, Message), (id) => {
        const milestone = milestones.get(id);
        return milestone ? Ok(milestone) : Err({ NotFound: `Milestone with id=${id} not found` });
    }),

    // Mint tokens for a user
    mintTokens: update([text, nat64], Result(text, Message), (userId, amount) => {
        const user = users.get(userId);
        if (!user) {
            return Err({ NotFound: `User with id=${userId} not found` });
        }
        user.tokens += amount;
        users.insert(userId, user);
        return Ok(`Successfully minted ${amount} tokens for user ${userId}`);
    }),

    // Transfer tokens from one user to another
    transferTokens: update([text, text, nat64], Result(text, Message), (fromUserId, toUserId, amount) => {
        const fromUser = users.get(fromUserId);
        const toUser = users.get(toUserId);
        if (!fromUser || !toUser) {
            return Err({ NotFound: "One or both users not found" });
        }
        if (fromUser.tokens < amount) {
            return Err({ InvalidPayload: "Insufficient tokens for transfer" });
        }
        fromUser.tokens -= amount;
        toUser.tokens += amount;
        users.insert(fromUserId, fromUser);
        users.insert(toUserId, toUser);
        return Ok(`Successfully transferred ${amount} tokens from ${fromUserId} to ${toUserId}`);
    }),

    // Redeem a reward
    redeemReward: update([text, text], Result(text, Message), (userId, rewardId) => {
        const user = users.get(userId);
        const reward = rewards.get(rewardId);
        if (!user || !reward) {
            return Err({ NotFound: "User or Reward not found" });
        }
        if (user.tokens < reward.tokenCost) {
            return Err({ InvalidPayload: "Insufficient tokens for redemption" });
        }
        user.tokens -= reward.tokenCost;
        reward.availability -= 1;
        users.insert(userId, user);
        rewards.insert(rewardId, reward);
        return Ok(`Reward ${rewardId} successfully redeemed by ${userId}`);
    }),

    // Check and reward milestones for a user
    checkAndRewardMilestones: update([text], Result(Vec(text), Message), (userId) => {
        const user = users.get(userId);
        if (!user) {
            return Err({ NotFound: `User with id=${userId} not found` });
        }
        const rewardedMilestones = [];
        milestones.forEach((milestoneId, milestone) => {
            if (!user.claimedMilestones.includes(milestoneId) /* && other conditions */) {
                user.tokens += milestone.tokenReward;
                user.claimedMilestones.push(milestoneId);
                rewardedMilestones.push(milestoneId);
            }
        });
        users.insert(userId, user);
        return Ok(rewardedMilestones);
    }),
});

// Provide a workaround to make uuid package work with Azle
globalThis.crypto = {
    getRandomValues: () => {
        const array = new Uint8Array(32);
        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }
        return array;
    }
};
