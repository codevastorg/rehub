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

    // Implement additional methods as needed following the above patterns

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
