import { Canister, query, update, Principal, nat64, Opt, Vec, Result, Err, Ok, text, Record, Variant, StableBTreeMap } from "azle";
import { v4 as uuidv4 } from "uuid";

// Define your data models
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

// Initialize your storage
const users = StableBTreeMap(0, text, User);
const milestones = StableBTreeMap(1, text, Milestone);
const transactions = StableBTreeMap(2, text, Transaction);
const rewards = StableBTreeMap(3, text, Reward);
const activities = StableBTreeMap(4, text, Activity);

export default Canister({
    addUser: update([User], Result(User, Message), (userPayload) => {
        if (!userPayload.name || !userPayload.sobrietyDate) {
            return Err({ InvalidPayload: "Invalid user data" });
        }
        const id = uuidv4();
        const newUser = { ...userPayload, id };
        users.insert(id, newUser);
        return Ok(newUser);
    }),

    getUser: query([text], Result(User, Message), (id) => {
        const user = users.get(id);
        if ("None" in user) {
            return Err({ NotFound: `User with id=${id} not found` });
        }
        return Ok(user.Some);
    }),

    addMilestone: update([Milestone], Result(Milestone, Message), (milestonePayload) => {
        const id = uuidv4();
        const newMilestone = { ...milestonePayload, id };
        milestones.insert(id, newMilestone);
        return Ok(newMilestone);
    }),

    getMilestone: query([text], Result(Milestone, Message), (id) => {
        const milestone = milestones.get(id);
        if ("None" in milestone) {
            return Err({ NotFound: `Milestone with id=${id} not found` });
        }
        return Ok(milestone.Some);
    }),

    mintTokens: update([text, nat64], Result(text, Message), (userId, amount) => {
        const userOpt = users.get(userId);
        if ("None" in userOpt) {
            return Err({ NotFound: `User with id=${userId} not found` });
        }
        let user = userOpt.Some;
        user.tokens += amount; // Assuming tokens is a bigint
        users.insert(userId, user);
        return Ok(`Successfully minted ${amount} tokens for user ${userId}`);
    }),

    transferTokens: update([text, text, nat64], Result(text, Message), (fromUserId, toUserId, amount) => {
        const fromUserOpt = users.get(fromUserId);
        const toUserOpt = users.get(toUserId);
        if ("None" in fromUserOpt || "None" in toUserOpt) {
            return Err({ NotFound: `One or both users not found` });
        }
        let fromUser = fromUserOpt.Some;
        let toUser = toUserOpt.Some;
        
        if (fromUser.tokens < amount) {
            return Err({ InvalidPayload: `Insufficient tokens for transfer` });
        }
        
        fromUser.tokens -= amount;
        toUser.tokens += amount;
        
        users.insert(fromUserId, fromUser);
        users.insert(toUserId, toUser);
        
        return Ok(`Successfully transferred ${amount} tokens from ${fromUserId} to ${toUserId}`);
    }),

    checkAndRewardMilestones: update([text], Result(Vec(text), Message), (userId) => {
        const userOpt = users.get(userId);
        if ("None" in userOpt) {
            return Err({ NotFound: `User with id=${userId} not found` });
        }
        let user = userOpt.Some;
        let rewardedMilestones: string[] = [];
    
        // Use the items() or keys() method to retrieve milestones, then iterate
        const milestoneKeys = milestones.keys(); // This retrieves an array of milestone IDs (keys)
        milestoneKeys.forEach((milestoneId) => {
            const milestoneOpt = milestones.get(milestoneId);
            if ("Some" in milestoneOpt) {
                const milestone = milestoneOpt.Some;
                // Assuming your condition here to check if the milestone is achieved
                if (!user.claimedMilestones.includes(milestoneId) /* && other condition */) {
                    user.tokens += milestone.tokenReward; // Reward the user
                    user.claimedMilestones.push(milestoneId); // Mark as claimed
                    rewardedMilestones.push(milestoneId); // Keep track of rewarded milestones
                }
            }
        });
    
        users.insert(userId, user);
        return Ok(rewardedMilestones); // Return the list of rewarded milestones
    }),
    

    redeemReward: update([text, text], Result(text, Message), (userId, rewardId) => {
        const userOpt = users.get(userId);
        const rewardOpt = rewards.get(rewardId);
        if ("None" in userOpt || "None" in rewardOpt) {
            return Err({ NotFound: `User or Reward not found` });
        }
        let user = userOpt.Some;
        let reward = rewardOpt.Some;
        
        if (user.tokens < reward.tokenCost) {
            return Err({ InvalidPayload: `Insufficient tokens for redemption` });
        }
        
        user.tokens -= reward.tokenCost; // Deduct the cost
        reward.availability -= 1; // Reduce reward availability
        
        users.insert(userId, user);
        rewards.insert(rewardId, reward);
        
        return Ok(`Reward ${rewardId} successfully redeemed by ${userId}`);
    }),

    // Note: Replace uuidv4() and adjust types accordingly if necessary.
});

// a workaround to make uuid package work with Azle
globalThis.crypto = {
    // @ts-ignore
    getRandomValues: () => {
        let array = new Uint8Array(32);

        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }

        return array;
    }
};
