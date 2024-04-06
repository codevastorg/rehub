import { Canister, query, update, Principal, nat64, Opt, Vec, Result, Err, Ok, text, Record, Variant, StableBTreeMap } from "azle";
import { v4 as uuidv4 } from "uuid";
import { createSecureUUID } from "./utils"; // Assuming the secure UUID function is in a separate file

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
    InsufficientTokens: text,
    UnauthorizedAccess: text,
});

// Initialize your storage
const users = StableBTreeMap(0, text, User);
const milestones = StableBTreeMap(1, text, Milestone);
const transactions = StableBTreeMap(2, text, Transaction);
const rewards = StableBTreeMap(3, text, Reward);
const activities = StableBTreeMap(4, text, Activity);

// Utility function to check if a user exists
function getUserOrError(userId: string): Result<User, Message> {
    const userOpt = users.get(userId);
    if ("None" in userOpt) {
        return Err({ NotFound: `User with id=${userId} not found` });
    }
    return Ok(userOpt.Some);
}

// Utility function to check if a milestone exists
function getMilestoneOrError(milestoneId: string): Result<Milestone, Message> {
    const milestoneOpt = milestones.get(milestoneId);
    if ("None" in milestoneOpt) {
        return Err({ NotFound: `Milestone with id=${milestoneId} not found` });
    }
    return Ok(milestoneOpt.Some);
}

export default Canister({
    addUser: update([User], Result<User, Message>, (userPayload) => {
        if (!userPayload.name || !userPayload.sobrietyDate) {
            return Err({ InvalidPayload: "Invalid user data" });
        }
        const id = createSecureUUID(); // Use a secure UUID generation method
        const newUser = { ...userPayload, id };
        users.insert(id, newUser);
        return Ok(newUser);
    }),

    getUser: query([text], Result<User, Message>, (id) => {
        return getUserOrError(id);
    }),

    addMilestone: update([Milestone], Result<Milestone, Message>, (milestonePayload) => {
        const id = createSecureUUID();
        const newMilestone = { ...milestonePayload, id };
        milestones.insert(id, newMilestone);
        return Ok(newMilestone);
    }),

    getMilestone: query([text], Result<Milestone, Message>, (id) => {
        return getMilestoneOrError(id);
    }),

    mintTokens: update([text, nat64], Result<string, Message>, (userId, amount) => {
        const userResult = getUserOrError(userId);
        if ("Err" in userResult) {
            return userResult;
        }
        let user = userResult.Ok;
        user.tokens += amount; // Assuming tokens is a bigint
        users.insert(userId, user);
        return Ok(`Successfully minted ${amount} tokens for user ${userId}`);
    }),

    transferTokens: update([text, text, nat64], Result<string, Message>, (fromUserId, toUserId, amount) => {
        if (fromUserId === toUserId) {
            return Err({ InvalidPayload: "Cannot transfer tokens to the same user" });
        }

        const fromUserResult = getUserOrError(fromUserId);
        const toUserResult = getUserOrError(toUserId);

        if ("Err" in fromUserResult || "Err" in toUserResult) {
            return Err({ NotFound: "One or both users not found" });
        }

        let fromUser = fromUserResult.Ok;
        let toUser = toUserResult.Ok;

        if (fromUser.tokens < amount) {
            return Err({ InsufficientTokens: "Insufficient tokens for transfer" });
        }

        fromUser.tokens -= amount;
        toUser.tokens += amount;

        users.insert(fromUserId, fromUser);
        users.insert(toUserId, toUser);

        return Ok(`Successfully transferred ${amount} tokens from ${fromUserId} to ${toUserId}`);
    }),

    addMilestone: update([Milestone], Result<string, Message>, (milestone) => {
        const id = createSecureUUID();
        milestones.insert(id, milestone);
        return Ok(`Milestone ${id} added successfully`);
    }),

    checkAndRewardMilestones: update([text], Result<Vec<string>, Message>, (userId) => {
        const userResult = getUserOrError(userId);
        if ("Err" in userResult) {
            return userResult;
        }
        let user = userResult.Ok;
        let rewardedMilestones: string[] = [];

        // Maintain a separate index or data structure for efficient milestone tracking
        const milestoneIndex: Map<string, Milestone> = new Map();
        const milestoneKeys = milestones.keys();
        milestoneKeys.forEach((milestoneId) => {
            const milestoneOpt = milestones.get(milestoneId);
            if ("Some" in milestoneOpt) {
                milestoneIndex.set(milestoneId, milestoneOpt.Some);
            }
        });

        for (const [milestoneId, milestone] of milestoneIndex.entries()) {
            // Assuming your condition here to check if the milestone is achieved
            if (!user.claimedMilestones.includes(milestoneId) /* && other condition */) {
                user.tokens += milestone.tokenReward; // Reward the user
                user.claimedMilestones.push(milestoneId); // Mark as claimed
                rewardedMilestones.push(milestoneId); // Keep track of rewarded milestones
            }
        }

        users.insert(userId, user);
        return Ok(rewardedMilestones); // Return the list of rewarded milestones
    }),

    redeemReward: update([text, text], Result<string, Message>, (userId, rewardId) => {
        const userResult = getUserOrError(userId);
        const rewardResult = getMilestoneOrError(rewardId);

        if ("Err" in userResult || "Err" in rewardResult) {
            return Err({ NotFound: "User or Reward not found" });
        }

        let user = userResult.Ok;
        let reward = rewardResult.Ok;

        if (user.tokens < reward.tokenCost) {
            return Err({ InsufficientTokens: "Insufficient tokens for redemption" });
        }

        user.tokens -= reward.tokenCost; // Deduct the cost
        reward.availability -= 1; // Reduce reward availability

        users.insert(userId, user);
        rewards.insert(rewardId, reward);

        return Ok(`Reward ${rewardId} successfully redeemed by ${userId}`);
    }),

    // Note: Replace uuidv4() and
