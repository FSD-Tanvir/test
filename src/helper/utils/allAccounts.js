const MUser = require("../../modules/users/users.schema");

const allAccounts = async () => {
    console.log("Fetching all accounts...");
    try {
        const fundedAccounts = await MUser.aggregate([
            {
                $match: {
                    "mt5Accounts.challengeStageData.challengeType": {
                        $in: ["funded", "oneStep", "twoStep"], // Match funded, oneStep, or twoStep accounts
                    }
                }
            },
            {
                $project: {
                    email: 1,
                    mt5Accounts: {
                        $filter: {
                            input: "$mt5Accounts",
                            as: "account",
                            cond: {
                                $in: ["$$account.challengeStageData.challengeType", ["funded", "oneStep", "twoStep"]], // Filter for funded, oneStep, or twoStep accounts
                            }
                        },
                    },
                },
            },
            { $unwind: "$mt5Accounts" }, // Unwind to get individual accounts
            {
                $addFields: {
                    accountString: { $toString: "$mt5Accounts.account" }, // Convert `Number` to `String`
                },
            },
            {
                $lookup: {
                    from: "disableaccounts", // Collection name of the DisableAccount model
                    localField: "accountString", // Converted account number as a string
                    foreignField: "mt5Account", // Field in DisableAccount
                    as: "disabledAccount", // Store matching documents in this array
                },
            },
            {
                $match: {
                    disabledAccount: { $eq: [] }, // Keep only accounts not in DisableAccount
                },
            },
            {
                $replaceRoot: {
                    newRoot: {
                        email: "$email",
                        account: "$mt5Accounts.account",
                    },
                },
            },
        ]);
        console.log("Fetched accounts:", fundedAccounts);
        return fundedAccounts;
    } catch (error) {
        console.error("Error fetching accounts:", error);
        return [];
    }
}

module.exports = { allAccounts };