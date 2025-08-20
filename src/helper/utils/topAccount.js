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
                    "challengeStageData.challengeName": "Foxx Funded 10k oneStep",
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
                    account.challengeStageData.challengeName === "Foxx Funded 10k oneStep";
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
        throw new Error("Error fetching users with funded, active Foxx Funded 10k oneStep accounts.");
    }
};
const getUsersWithFundedAccounts25kAndChallenge = async () => {
    try {
        // Find users with funded, active accounts and the 5K Standard Challenge
        const users = await MUser.find({
            mt5Accounts: {
                $elemMatch: {
                    challengeStage: "funded",
                    "challengeStageData.challengeName": "Foxx Funded 25k oneStep",
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
                    account.challengeStageData.challengeName === "Foxx Funded 25k oneStep";
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
        throw new Error("Error fetching users with funded, active Foxx Funded 25k oneStep accounts.");
    }
};
const getUsersWithFundedAccounts50kAndChallenge = async () => {
    try {
        // Find users with funded, active accounts and the 5K Standard Challenge
        const users = await MUser.find({
            mt5Accounts: {
                $elemMatch: {
                    challengeStage: "funded",
                    "challengeStageData.challengeName": "Foxx Funded 50k oneStep",
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
                    account.challengeStageData.challengeName === "Foxx Funded 50k oneStep";
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
        throw new Error("Error fetching users with funded, active Foxx Funded 50k oneStep accounts.");
    }
};
const getUsersWithFundedAccounts100kAndChallenge = async () => {
    try {
        // Find users with funded, active accounts and the 5K Standard Challenge
        const users = await MUser.find({
            mt5Accounts: {
                $elemMatch: {
                    challengeStage: "funded",
                    "challengeStageData.challengeName": "Foxx Funded 100k oneStep",
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
                    account.challengeStageData.challengeName === "Foxx Funded 100k oneStep";
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
        throw new Error("Error fetching users with funded, active Foxx Funded 100k oneStep accounts.");
    }
};
const getUsersWithFundedAccounts200kAndChallenge = async () => {
    try {
        // Find users with funded, active accounts and the 5K Standard Challenge
        const users = await MUser.find({
            mt5Accounts: {
                $elemMatch: {
                    challengeStage: "funded",
                    "challengeStageData.challengeName": "Foxx Funded 200k oneStep",
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
                    account.challengeStageData.challengeName === "Foxx Funded 200k oneStep";
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
        throw new Error("Error fetching users with funded, active Foxx Funded 200k oneStep accounts.");
    }
};
const getUsersWithFundedAccounts300kAndChallenge = async () => {
    try {
        // Find users with funded, active accounts and the 5K Standard Challenge
        const users = await MUser.find({
            mt5Accounts: {
                $elemMatch: {
                    challengeStage: "funded",
                    "challengeStageData.challengeName": "Foxx Funded 300k oneStep",
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
                    account.challengeStageData.challengeName === "Foxx Funded 300k oneStep";
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
        throw new Error("Error fetching users with funded, active Foxx Funded 300k oneStep accounts.");
    }
};

// utility functions to get top accounts for two step challenges

const getUsersWithFundedAccounts10kAndChallengeTwoStep = async () => {
    try {
        // Find users with funded, active accounts and the 5K Standard Challenge
        const users = await MUser.find({
            mt5Accounts: {
                $elemMatch: {
                    challengeStage: "funded",
                    "challengeStageData.challengeName": "Foxx Funded 10k twoStep",
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
                    account.challengeStageData.challengeName === "Foxx Funded 10k twoStep";
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
        throw new Error("Error fetching users with funded, active Foxx Funded 10k twoStep accounts.");
    }
};


const getUsersWithFundedAccounts25kAndChallengeTwoStep = async () => {
    try {
        // Find users with funded, active accounts and the 5K Standard Challenge
        const users = await MUser.find({
            mt5Accounts: {
                $elemMatch: {
                    challengeStage: "funded",
                    "challengeStageData.challengeName": "Foxx Funded 25k twoStep",
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
                    account.challengeStageData.challengeName === "Foxx Funded 25k twoStep";
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
        throw new Error("Error fetching users with funded, active Foxx Funded 25k twoStep accounts.");
    }
};
const getUsersWithFundedAccounts50kAndChallengeTwoStep = async () => {
    try {
        // Find users with funded, active accounts and the 5K Standard Challenge
        const users = await MUser.find({
            mt5Accounts: {
                $elemMatch: {
                    challengeStage: "funded",
                    "challengeStageData.challengeName": "Foxx Funded 50k twoStep",
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
                    account.challengeStageData.challengeName === "Foxx Funded 50k twoStep";
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
        throw new Error("Error fetching users with funded, active Foxx Funded 50k twoStep accounts.");
    }
};
const getUsersWithFundedAccounts100kAndChallengeTwoStep = async () => {
    try {
        // Find users with funded, active accounts and the 5K Standard Challenge
        const users = await MUser.find({
            mt5Accounts: {
                $elemMatch: {
                    challengeStage: "funded",
                    "challengeStageData.challengeName": "Foxx Funded 100k twoStep",
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
                    account.challengeStageData.challengeName === "Foxx Funded 100k twoStep";
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
        throw new Error("Error fetching users with funded, active Foxx Funded 100k twoStep accounts.");
    }
};
const getUsersWithFundedAccounts200kAndChallengeTwoStep = async () => {
    try {
        // Find users with funded, active accounts and the 5K Standard Challenge
        const users = await MUser.find({
            mt5Accounts: {
                $elemMatch: {
                    challengeStage: "funded",
                    "challengeStageData.challengeName": "Foxx Funded 200k twoStep",
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
                    account.challengeStageData.challengeName === "Foxx Funded 200k twoStep";
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
        throw new Error("Error fetching users with funded, active Foxx Funded 200k twoStep accounts.");
    }
};
const getUsersWithFundedAccounts300kAndChallengeTwoStep = async () => {
    try {
        // Find users with funded, active accounts and the 5K Standard Challenge
        const users = await MUser.find({
            mt5Accounts: {
                $elemMatch: {
                    challengeStage: "funded",
                    "challengeStageData.challengeName": "Foxx Funded 300k twoStep",
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
                    account.challengeStageData.challengeName === "Foxx Funded 300k twoStep";
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
        throw new Error("Error fetching users with funded, active Foxx Funded 300k twoStep accounts.");
    }
};
const getUsersWithFundedAccounts10kAndChallengeInstantFundIng = async () => {
    try {
        // Find users with funded, active accounts and the 5K Standard Challenge
        const users = await MUser.find({
            mt5Accounts: {
                $elemMatch: {
                    challengeStage: "funded",
                    "challengeStageData.challengeName": "Foxx Funded 10k Instant Funding",
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
                    account.challengeStageData.challengeName === "Foxx Funded 10k Instant Funding";
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
        throw new Error("Error fetching users with funded, active Foxx Funded 10k Instant Funding accounts.");
    }
};


const getUsersWithFundedAccounts25kAndChallengeInstantFundIng = async () => {
    try {
        // Find users with funded, active accounts and the 5K Standard Challenge
        const users = await MUser.find({
            mt5Accounts: {
                $elemMatch: {
                    challengeStage: "funded",
                    "challengeStageData.challengeName": "Foxx Funded 25k Instant Funding",
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
                    account.challengeStageData.challengeName === "Foxx Funded 25k Instant Funding";
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
        throw new Error("Error fetching users with funded, active Foxx Funded 25k Instant Funding accounts.");
    }
};
const getUsersWithFundedAccounts50kAndChallengeInstantFundIng = async () => {
    try {
        // Find users with funded, active accounts and the 5K Standard Challenge
        const users = await MUser.find({
            mt5Accounts: {
                $elemMatch: {
                    challengeStage: "funded",
                    "challengeStageData.challengeName": "Foxx Funded 50k Instant Funding",
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
                    account.challengeStageData.challengeName === "Foxx Funded 50k Instant Funding";
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
        throw new Error("Error fetching users with funded, active Foxx Funded 50k Instant Funding accounts.");
    }
};
const getUsersWithFundedAccounts100kAndChallengeInstantFundIng = async () => {
    try {
        // Find users with funded, active accounts and the 5K Standard Challenge
        const users = await MUser.find({
            mt5Accounts: {
                $elemMatch: {
                    challengeStage: "funded",
                    "challengeStageData.challengeName": "Foxx Funded 100k Instant Funding",
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
                    account.challengeStageData.challengeName === "Foxx Funded 100k Instant Funding";
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
        throw new Error("Error fetching users with funded, active Foxx Funded 100k Instant Funding accounts.");
    }
};

const getUsersWithFundedAccounts5kAndChallengeInstantFundIng = async () => {
    try {
        // Find users with funded, active accounts and the 5K Standard Challenge
        const users = await MUser.find({
            mt5Accounts: {
                $elemMatch: {
                    challengeStage: "funded",
                    "challengeStageData.challengeName": "Foxx Funded 5k Instant Funding",
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
                    account.challengeStageData.challengeName === "Foxx Funded 5k Instant Funding";
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
        throw new Error("Error fetching users with funded, active Foxx Funded 5k Instant Funding accounts.");
    }
};

module.exports = {
    getUsersWithFundedAccounts5kAndChallenge,
    getUsersWithFundedAccounts10kAndChallenge,
    getUsersWithFundedAccounts25kAndChallenge,
    getUsersWithFundedAccounts50kAndChallenge,
    getUsersWithFundedAccounts100kAndChallenge,
    getUsersWithFundedAccounts200kAndChallenge,
    getUsersWithFundedAccounts300kAndChallenge,
    getUsersWithFundedAccounts10kAndChallengeTwoStep,
    getUsersWithFundedAccounts25kAndChallengeTwoStep,
    getUsersWithFundedAccounts50kAndChallengeTwoStep,
    getUsersWithFundedAccounts100kAndChallengeTwoStep,
    getUsersWithFundedAccounts200kAndChallengeTwoStep,
    getUsersWithFundedAccounts300kAndChallengeTwoStep,
    getUsersWithFundedAccounts5kAndChallengeInstantFundIng,
    getUsersWithFundedAccounts10kAndChallengeInstantFundIng,
    getUsersWithFundedAccounts25kAndChallengeInstantFundIng,
    getUsersWithFundedAccounts50kAndChallengeInstantFundIng,
    getUsersWithFundedAccounts100kAndChallengeInstantFundIng

};