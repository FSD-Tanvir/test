const MUser = require("../../modules/users/users.schema");

const allAccounts = async () => {
    console.log("Fetching all accounts...");
    try {
        const fundedAccounts = await MUser.aggregate([
            {
                $match: {
                    "mt5Accounts.challengeStageData.challengeType": {
                        $in: ["funded", "oneStep", "twoStep"],
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
                                $and: [
                                    {
                                        $in: [
                                            "$$account.challengeStageData.challengeType",
                                            ["funded", "oneStep", "twoStep"]
                                        ]
                                    },
                                    {
                                        $ne: ["$$account.noNewsTrading", true]
                                    }
                                ]
                            }
                        }
                    },
                },
            },
            { $unwind: "$mt5Accounts" },
            {
                $addFields: {
                    accountString: { $toString: "$mt5Accounts.account" },
                },
            },
            {
                $lookup: {
                    from: "disableaccounts",
                    localField: "accountString",
                    foreignField: "mt5Account",
                    as: "disabledAccount",
                },
            },
            {
                $match: {
                    disabledAccount: { $eq: [] },
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
};

module.exports = { allAccounts };
