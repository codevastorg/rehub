import { Canister, ic, query, update, nat64, Vec, Result, Err, Ok, text, Record, Variant, StableBTreeMap } from "azle";
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

const UserPayload = Record({
    name: text,
    roles: Vec(text),
});

const Milestone = Record({
    id: text,
    milestoneTime: nat64,
    tokenReward: nat64,
    description: text,
});
const MilestonePayload = Record({
    milestoneTime: nat64,
    tokenReward: nat64,
    description: text,
});

const Reward = Record({
    id: text,
    tokenCost: nat64,
    description: text,
    availability: nat64,
});
const RewardPayload = Record({
    tokenCost: nat64,
    description: text,
    availability: nat64,
});

const Message = Variant({
    NotFound: text,
    InvalidPayload: text,
});

// Initialize your storage
const users = StableBTreeMap(0, text, User);
const milestones = StableBTreeMap(1, text, Milestone);
const rewards = StableBTreeMap(2, text, Reward);


export default Canister({
  addUser: update([UserPayload], Result(User, Message), (userPayload) => {
    const validatePayloadErrors = validateUserPayload(userPayload);
    if (validatePayloadErrors.length) {
      return Err({
        InvalidPayload: `Invalid payload. Errors=[${validatePayloadErrors}]`,
      });
    }
    const newUser = {
      id: uuidv4(),
      tokens: BigInt(0),
      claimedMilestones: [],
      sobrietyDate: ic.time(),
      ...userPayload,
    };
    users.insert(newUser.id, newUser);
    return Ok(newUser);
  }),

  getUser: query([text], Result(User, Message), (id) => {
    if (!isValidUuid(id)) {
      return Err({
        InvalidPayload: `Id="${id}" is not in the valid uuid format.`,
      });
    }
    const user = users.get(id);
    if ("None" in user) {
      return Err({ NotFound: `User with id=${id} not found` });
    }
    return Ok(user.Some);
  }),

  addMilestone: update(
    [MilestonePayload],
    Result(Milestone, Message),
    (milestonePayload) => {
        const validatePayloadErrors = validateMilestonePayload(milestonePayload);
        if (validatePayloadErrors.length) {
          return Err({
            InvalidPayload: `Invalid payload. Errors=[${validatePayloadErrors}]`,
          });
        }
      const id = uuidv4();
      const newMilestone = { ...milestonePayload, id };
      milestones.insert(id, newMilestone);
      return Ok(newMilestone);
    }
  ),
  addReward: update(
    [RewardPayload],
    Result(Reward, Message),
    (rewardPayload) => {
        const validatePayloadErrors = validateRewardPayload(rewardPayload);
        if (validatePayloadErrors.length) {
          return Err({
            InvalidPayload: `Invalid payload. Errors=[${validatePayloadErrors}]`,
          });
        }
      const id = uuidv4();
      const newReward = { ...rewardPayload, id };
      rewards.insert(id, newReward);
      return Ok(newReward);
    }
  ),

  getMilestone: query([text], Result(Milestone, Message), (id) => {
    if (!isValidUuid(id)) {
      return Err({
        InvalidPayload: `Id="${id}" is not in the valid uuid format.`,
      });
    }
    const milestone = milestones.get(id);
    if ("None" in milestone) {
      return Err({ NotFound: `Milestone with id=${id} not found` });
    }
    return Ok(milestone.Some);
  }),
  getReward: query([text], Result(Reward, Message), (id) => {
    if (!isValidUuid(id)) {
      return Err({
        InvalidPayload: `Id="${id}" is not in the valid uuid format.`,
      });
    }
    const reward = rewards.get(id);
    if ("None" in reward) {
      return Err({ NotFound: `Reward with id=${id} not found` });
    }
    return Ok(reward.Some);
  }),

  mintTokens: update([text, nat64], Result(text, Message), (userId, amount) => {
    if (!isValidUuid(userId)) {
      return Err({
        InvalidPayload: `userId="${userId}" is not in the valid uuid format.`,
      });
    }
    const userOpt = users.get(userId);
    if ("None" in userOpt) {
      return Err({ NotFound: `User with id=${userId} not found` });
    }
    let user = userOpt.Some;
    user.tokens += amount; // Assuming tokens is a bigint
    users.insert(userId, user);
    return Ok(`Successfully minted ${amount} tokens for user ${userId}`);
  }),

  transferTokens: update(
    [text, text, nat64],
    Result(text, Message),
    (fromUserId, toUserId, amount) => {
      if (!isValidUuid(fromUserId)) {
        return Err({
          InvalidPayload: `fromUserId="${fromUserId}" is not in the valid uuid format.`,
        });
      }
      if (!isValidUuid(toUserId)) {
        return Err({
          InvalidPayload: `toUserId="${toUserId}" is not in the valid uuid format.`,
        });
      }
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

      return Ok(
        `Successfully transferred ${amount} tokens from ${fromUserId} to ${toUserId}`
      );
    }
  ),

  checkAndRewardMilestones: update(
    [text],
    Result(Vec(text), Message),
    (userId) => {
      if (!isValidUuid(userId)) {
        return Err({
          InvalidPayload: `userId="${userId}" is not in the valid uuid format.`,
        });
      }
      const userOpt = users.get(userId);
      if ("None" in userOpt) {
        return Err({ NotFound: `User with id=${userId} not found` });
      }
      let user = userOpt.Some;
      let rewardedMilestones: string[] = [];

      milestones.values().forEach((milestone) => {
        // checks whether user has been sober for longer than the milestone's required time
        const milestoneReached = ic.time() - user.sobrietyDate > milestone.milestoneTime;
        // Assuming your condition here to check if the milestone is achieved
        if (
          !user.claimedMilestones.includes(
            milestone.id
          ) && milestoneReached
        ) {
          user.tokens += milestone.tokenReward; // Reward the user
          user.claimedMilestones.push(milestone.id); // Mark as claimed
          rewardedMilestones.push(milestone.id); // Keep track of rewarded milestones
        }
      });

      users.insert(userId, user);
      return Ok(rewardedMilestones); // Return the list of rewarded milestones
    }
  ),

  redeemReward: update(
    [text, text],
    Result(text, Message),
    (userId, rewardId) => {
      if (!isValidUuid(userId)) {
        return Err({
          InvalidPayload: `userId="${userId}" is not in the valid uuid format.`,
        });
      }
      if (!isValidUuid(rewardId)) {
        return Err({
          InvalidPayload: `rewardId="${rewardId}" is not in the valid uuid format.`,
        });
      }
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
      if (reward.availability == BigInt(0)) {
        return Err({ InvalidPayload: `Reward is no longer available.` });
      }

      user.tokens -= reward.tokenCost; // Deduct the cost
      reward.availability -= 1; // Reduce reward availability

      users.insert(userId, user);
      rewards.insert(rewardId, reward);

      return Ok(`Reward ${rewardId} successfully redeemed by ${userId}`);
    }
  ),

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




// Helper function that trims the input string and then checks the length
// The string is empty if true is returned, otherwise, string is a valid value
function isInvalidString(str: text): boolean {
    return str.trim().length == 0
  }
  
  // Helper function to ensure the input id meets the format used for ids generated by uuid
  function isValidUuid(id: string): boolean {
    const regexExp = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;
    return regexExp.test(id);
  }
  
  /**
  * Helper function to validate the UserPayload
  */
function validateUserPayload(payload: typeof UserPayload): Vec<string>{
    const errors: Vec<text> = [];
    // @ts-ignore
    if (isInvalidString(payload.name)){
        errors.push(`name='${payload.name}' cannot be empty.`)
    }
    return errors;
  }
  /**
  * Helper function to validate the RewardPayload
  */
function validateRewardPayload(payload: typeof RewardPayload): Vec<string>{
    const errors: Vec<text> = [];
    // @ts-ignore
    if (isInvalidString(payload.description)){
        errors.push(`description='${payload.description}' cannot be empty.`)
    }
    // @ts-ignore
    if (payload.availability == BigInt(0)){
        errors.push(`availability='${payload.availability}' cannot be set to zero.`)
    }
    return errors;
  }
  /**
  * Helper function to validate the MilestonePayload
  */
function validateMilestonePayload(payload: typeof MilestonePayload): Vec<string>{
    const errors: Vec<text> = [];
    // @ts-ignore
    if (isInvalidString(payload.description)){
        errors.push(`description='${payload.description}' cannot be empty.`)
    }
    // @ts-ignore
    if (payload.tokenReward == BigInt(0)){
        errors.push(`tokenReward='${payload.tokenReward}' cannot be set to zero.`)
    }
    // @ts-ignore
    if (payload.milestoneTime == BigInt(0)){
        errors.push(`milestoneTime='${payload.milestoneTime}' cannot be set to zero.`)
    }
    return errors;
  }
