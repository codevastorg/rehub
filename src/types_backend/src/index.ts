import { Principal, Canister } from 'azle';

// Interface adjustments for compatibility with ICP and Azle
interface User {
    id: Principal;
    name: string;
    sobrietyDate: bigint;
    tokens: bigint;
    claimedMilestones: string[];
    roles: Set<string>; // Adding roles to the user interface
}

interface Milestone {
    id: string;
    durationInDays: bigint; // Consistency in using bigint, if necessary
    tokenReward: bigint;
    description: string;
}

interface Transaction {
    id: string;
    fromUserId: Principal | null; // Adjusted to use Principal, null for minting
    toUserId: Principal;
    amount: bigint; // Use bigint for amounts
    timestamp: bigint; // Use bigint for timestamp
}

interface Reward {
    id: string;
    tokenCost: bigint;
    description: string;
    availability: bigint; // Assuming availability can also be large
}

interface Activity {
    id: string;
    userId: Principal;
    validatorId: Principal; // The Principal ID of the counselor or administrator who validated the activity
    description: string;
    dateValidated: bigint; // Timestamp of when the activity was validated
    tokensAwarded: bigint; // Amount of tokens awarded for the activity
}

interface RewardRedemption {
    userId: Principal;
    rewardId: string;
    redemptionDate: bigint;
}

// Add more interfaces and types as needed...
export default class TokenManager {
    private users: Map<string, User> = new Map(); // Changed to a Map for indexing by Principal
    private totalSupply: bigint = 0n;
    private transactions: Transaction[] = [];
    private milestones: Milestone[] = [];
    private activities: Activity[] = [];
    private rewards: Reward[] = []; // Assume this is populated with available rewards
    private redemptions: RewardRedemption[] = []; // To track reward redemptions

    constructor(initialSupply: bigint) {
        this.totalSupply = initialSupply;
    }

    // Simulated method to add a user
    // In practice, user IDs (Principals) might come from the authentication mechanism
    addUser(name: string, sobrietyStartTimestamp: bigint, initialRoles: string[] = []): User {
        // Basic validation examples
        if (name.trim().length === 0) throw new Error("Name cannot be empty.");
        if (sobrietyStartTimestamp <= 0n) throw new Error("Invalid sobriety start timestamp.");
        // Role validation (ensure only valid roles are assigned)
        const validRoles = ["user", "validator", "admin"]; // Define your valid roles
        for (const role of initialRoles) {
            if (!validRoles.includes(role)) throw new Error(`Invalid role: ${role}`);
        }
        const principalId = this.generateUserId(); // Ensure this method returns a Principal
        const newUser: User = {
            id: this.generateUserId(), // Assume this generates or retrieves a Principal
            name,
            sobrietyDate: sobrietyStartTimestamp,
            tokens: 0n,
            claimedMilestones: [],
            roles: new Set(initialRoles) // Assign initial roles
        };
        this.users.set(principalId.toString(), newUser); // Store user by Principal.toString()
        return newUser;
    }

    // Function to assign a role to a user
    assignRole(userId: Principal, role: string): void {
        const user = this.findUserById(userId);
        if (!user) throw new Error('User not found.');

        user.roles.add(role);
    }

    // Function to check if a user has a specific role
    userHasRole(userId: Principal, role: string): boolean {
        const user = this.findUserById(userId);
        if (!user) {
            throw new Error('User not found.');
        }

        return user.roles.has(role);
    }

    // Mint tokens and add them to a user's account
    mint(userId: Principal, amount: bigint): void {
        const user = this.findUserById(userId);
        if (!user) throw new Error('User not found.');
        if (amount < 0) throw new Error('Amount to mint cannot be negative.');

        user.tokens += amount;
        this.totalSupply += amount;
        this.transactions.push({
            id: this.generateTransactionId(),
            fromUserId: null,
            toUserId: user.id,
            amount,
            timestamp: BigInt(Date.now()) // Convert current timestamp to bigint
        });
    }

    // Transfer tokens from one user to another
    transfer(fromUserId: Principal, toUserId: Principal, amount: bigint): void {
        if (amount <= 0n) throw new Error('Transfer amount must be positive.');
        const fromUser = this.findUserById(fromUserId);
        const toUser = this.findUserById(toUserId);
        if (!fromUser || !toUser) throw new Error('User not found.');
        if (fromUser.tokens < amount) throw new Error('Insufficient token balance.');
        if (amount < 0) throw new Error('Amount to transfer cannot be negative.');

        fromUser.tokens -= amount;
        toUser.tokens += amount;
        this.transactions.push({
            id: this.generateTransactionId(),
            fromUserId,
            toUserId,
            amount,
            timestamp: BigInt(Date.now()) // Adjust as needed for ICP
        });

        // Check and reward milestones for both users involved in the transfer
        this.checkAndRewardMilestones(fromUserId);
        this.checkAndRewardMilestones(toUserId);
    }

    // Method to add milestones
    addMilestone(durationInDays: bigint, tokenReward: bigint, description: string): Milestone {
        const newMilestone: Milestone = {
            id: this.generateMilestoneId(),
            durationInDays,
            tokenReward,
            description
        };
        this.milestones.push(newMilestone);
        return newMilestone;
    }

    // Method to check and reward milestones
    checkAndRewardMilestones(userId: Principal): void {
        const user = this.findUserById(userId);
        if (!user) throw new Error('User not found.');

        const currentTime = BigInt(Date.now());
        const sobrietyDurationDays = (currentTime - user.sobrietyDate) / BigInt(86400000); // Convert milliseconds to days

        this.milestones.forEach(milestone => {
            if (sobrietyDurationDays >= milestone.durationInDays && !user.claimedMilestones.includes(milestone.id)) {
                user.tokens += milestone.tokenReward;
                user.claimedMilestones.push(milestone.id); // Mark this milestone as claimed
                // Record the token transaction
                this.transactions.push({
                    id: this.generateTransactionId(),
                    fromUserId: null, // Minting tokens for milestone
                    toUserId: user.id,
                    amount: milestone.tokenReward,
                    timestamp: currentTime
                });
            }
        });
    }

    // Function to add a new activity validation
    validateActivity(userId: Principal, validatorId: Principal, description: string, tokensAwarded: bigint): Activity {
        if (!this.userHasRole(validatorId, 'validator')) {
            throw new Error('Unauthorized: Only validators can perform this action.');
        }

        const newActivity: Activity = {
            id: this.generateActivityId(),
            userId,
            validatorId,
            description,
            dateValidated: BigInt(Date.now()), // Get current timestamp
            tokensAwarded
        };

        // Add to activities array
        this.activities.push(newActivity);

        // Find the user and mint tokens as rewards
        const user = this.findUserById(userId);
        if (!user) throw new Error('User not found.');
        user.tokens += tokensAwarded; // Assuming mint function logic is here

        return newActivity;
    }

    redeemReward(callerId: Principal, userId: Principal, rewardId: string): void {
        const user = this.findUserById(userId);
        if (!user) throw new Error('User not found.');

        const reward = this.rewards.find(r => r.id === rewardId);
        if (!reward) throw new Error('Reward not found.');

        if (user.tokens < reward.tokenCost) throw new Error('Insufficient tokens for reward redemption.');

        // Ensure the caller has the right to redeem tokens for the specified user
    if (callerId.toString() !== userId.toString()) {
        throw new Error('Unauthorized: You can only redeem rewards for your own account.');
    }

        // Deduct tokens from user balance
        user.tokens -= reward.tokenCost;

        // Record the redemption
        const newRedemption: RewardRedemption = {
            userId,
            rewardId,
            redemptionDate: BigInt(Date.now())
        };
        this.redemptions.push(newRedemption);

        // Optional: Decrease the availability of the redeemed reward
        reward.availability -= 1n;

        // Additional logic for providing the reward to the user
        // This could involve external systems depending on the nature of the reward
    }

    // Helper methods
    private generateUserId(): Principal {
        // This placeholder needs an actual implementation for generating Principal IDs
        // In a real scenario, the Principal is typically provided by the system (e.g., user authentication)
        return Principal.fromText('unique-principal-id-to-replace');
    }

    private generateActivityId(): string {
        return Math.random().toString(36).substr(2, 9);
    }

    // Adjust the findUserById to leverage the Map for constant-time access
    private findUserById(userId: Principal): User | undefined {
        return this.users.get(userId.toString());
    }

    private generateTransactionId(): string {
        return Math.random().toString(36).substr(2, 9);
    }

    private generateMilestoneId(): string {
        return Math.random().toString(36).substr(2, 9);
    }

    // Get the total supply of tokens
    getTotalSupply(): bigint {
        return this.totalSupply;
    }

    // Get a list of all transactions
    getTransactions(): Transaction[] {
        return this.transactions;
    }
}