const MUser = require("../../modules/users/users.schema");

const getUsersWithFundedAccounts5kAndChallenge = async () => {
    try {
        // Find users with funded, active accounts and the 5K Standard Challenge
        const users = await MUser.find({
            mt5Accounts: {
                $elemMatch: {
                    challengeStage: "funded",
                    "challengeStageData.challengeName": "5K Standard Challenge",
                    accountStatus: "active" // Check if the account is active
                }
            }
        });

        // Check if any users are found
        if (!users || users.length === 0) {
            return [];
        }

        // Filter out only the mt5Accounts that match the criteria for each user
        const filteredUsers = users.map(user => {
            const filteredAccounts = user.mt5Accounts.filter(account => {
                return account.challengeStage === "funded" &&
                    account.accountStatus === "active" &&
                    account.challengeStageData.challengeName === "5K Standard Challenge";
            });

            // Return user data with filtered accounts
            return {
                ...user.toObject(), // Convert Mongoose document to plain object
                mt5Accounts: filteredAccounts // Only include the filtered mt5Accounts
            };
        });

        return filteredUsers;
    } catch (error) {
        console.error("Error retrieving users:", error);
        throw new Error("Error fetching users with funded, active 5K Standard Challenge accounts.");
    }
};

const getUsersWithFundedAccounts10kAndChallenge = async () => {
    try {
        // Find users with funded, active accounts and the 5K Standard Challenge
        const users = await MUser.find({
            mt5Accounts: {
                $elemMatch: {
                    challengeStage: "funded",
                    "challengeStageData.challengeName": "10K Standard Challenge",
                    accountStatus: "active" // Check if the account is active
                }
            }
        });

        // Check if any users are found
        if (!users || users.length === 0) {
            return [];
        }

        // Filter out only the mt5Accounts that match the criteria for each user
        const filteredUsers = users.map(user => {
            const filteredAccounts = user.mt5Accounts.filter(account => {
                return account.challengeStage === "funded" &&
                    account.accountStatus === "active" &&
                    account.challengeStageData.challengeName === "10K Standard Challenge";
            });

            // Return user data with filtered accounts
            return {
                ...user.toObject(), // Convert Mongoose document to plain object
                mt5Accounts: filteredAccounts // Only include the filtered mt5Accounts
            };
        });

        return filteredUsers;
    } catch (error) {
        console.error("Error retrieving users:", error);
        throw new Error("Error fetching users with funded, active 5K Standard Challenge accounts.");
    }
};
const getUsersWithFundedAccounts25kAndChallenge = async () => {
    try {
        // Find users with funded, active accounts and the 5K Standard Challenge
        const users = await MUser.find({
            mt5Accounts: {
                $elemMatch: {
                    challengeStage: "funded",
                    "challengeStageData.challengeName": "25K Standard Challenge",
                    accountStatus: "active" // Check if the account is active
                }
            }
        });

        // Check if any users are found
        if (!users || users.length === 0) {
            return [];
        }

        // Filter out only the mt5Accounts that match the criteria for each user
        const filteredUsers = users.map(user => {
            const filteredAccounts = user.mt5Accounts.filter(account => {
                return account.challengeStage === "funded" &&
                    account.accountStatus === "active" &&
                    account.challengeStageData.challengeName === "25K Standard Challenge";
            });

            // Return user data with filtered accounts
            return {
                ...user.toObject(), // Convert Mongoose document to plain object
                mt5Accounts: filteredAccounts // Only include the filtered mt5Accounts
            };
        });

        return filteredUsers;
    } catch (error) {
        console.error("Error retrieving users:", error);
        throw new Error("Error fetching users with funded, active 25K Standard Challenge accounts.");
    }
};
const getUsersWithFundedAccounts50kAndChallenge = async () => {
    try {
        // Find users with funded, active accounts and the 5K Standard Challenge
        const users = await MUser.find({
            mt5Accounts: {
                $elemMatch: {
                    challengeStage: "funded",
                    "challengeStageData.challengeName": "50K Standard Challenge",
                    accountStatus: "active" // Check if the account is active
                }
            }
        });

        // Check if any users are found
        if (!users || users.length === 0) {
            return [];
        }

        // Filter out only the mt5Accounts that match the criteria for each user
        const filteredUsers = users.map(user => {
            const filteredAccounts = user.mt5Accounts.filter(account => {
                return account.challengeStage === "funded" &&
                    account.accountStatus === "active" &&
                    account.challengeStageData.challengeName === "50K Standard Challenge";
            });

            // Return user data with filtered accounts
            return {
                ...user.toObject(), // Convert Mongoose document to plain object
                mt5Accounts: filteredAccounts // Only include the filtered mt5Accounts
            };
        });

        return filteredUsers;
    } catch (error) {
        console.error("Error retrieving users:", error);
        throw new Error("Error fetching users with funded, active 50K Standard Challenge accounts.");
    }
};
const getUsersWithFundedAccounts100kAndChallenge = async () => {
    try {
        // Find users with funded, active accounts and the 5K Standard Challenge
        const users = await MUser.find({
            mt5Accounts: {
                $elemMatch: {
                    challengeStage: "funded",
                    "challengeStageData.challengeName": "100K Standard Challenge",
                    accountStatus: "active" // Check if the account is active
                }
            }
        });

        // Check if any users are found
        if (!users || users.length === 0) {
            return [];
        }

        // Filter out only the mt5Accounts that match the criteria for each user
        const filteredUsers = users.map(user => {
            const filteredAccounts = user.mt5Accounts.filter(account => {
                return account.challengeStage === "funded" &&
                    account.accountStatus === "active" &&
                    account.challengeStageData.challengeName === "100K Standard Challenge";
            });

            // Return user data with filtered accounts
            return {
                ...user.toObject(), // Convert Mongoose document to plain object
                mt5Accounts: filteredAccounts // Only include the filtered mt5Accounts
            };
        });

        return filteredUsers;
    } catch (error) {
        console.error("Error retrieving users:", error);
        throw new Error("Error fetching users with funded, active 100K Standard Challenge accounts.");
    }
};
const getUsersWithFundedAccounts200kAndChallenge = async () => {
    try {
        // Find users with funded, active accounts and the 5K Standard Challenge
        const users = await MUser.find({
            mt5Accounts: {
                $elemMatch: {
                    challengeStage: "funded",
                    "challengeStageData.challengeName": "200K Standard Challenge",
                    accountStatus: "active" // Check if the account is active
                }
            }
        });

        // Check if any users are found
        if (!users || users.length === 0) {
            return [];
        }

        // Filter out only the mt5Accounts that match the criteria for each user
        const filteredUsers = users.map(user => {
            const filteredAccounts = user.mt5Accounts.filter(account => {
                return account.challengeStage === "funded" &&
                    account.accountStatus === "active" &&
                    account.challengeStageData.challengeName === "200K Standard Challenge";
            });

            // Return user data with filtered accounts
            return {
                ...user.toObject(), // Convert Mongoose document to plain object
                mt5Accounts: filteredAccounts // Only include the filtered mt5Accounts
            };
        });

        return filteredUsers;
    } catch (error) {
        console.error("Error retrieving users:", error);
        throw new Error("Error fetching users with funded, active 200K Standard Challenge accounts.");
    }
};



module.exports = {
    getUsersWithFundedAccounts5kAndChallenge,
    getUsersWithFundedAccounts10kAndChallenge,
    getUsersWithFundedAccounts25kAndChallenge,
    getUsersWithFundedAccounts50kAndChallenge,
    getUsersWithFundedAccounts100kAndChallenge,
    getUsersWithFundedAccounts200kAndChallenge,

};