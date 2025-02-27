const MUser = require("../users/users.schema");

;

// Function to fetch active accounts
const getActiveAccounts = async () => {
    try {
        const activeAccounts = await MUser.aggregate([
            { $unwind: "$mt5Accounts" },
            { $match: { "mt5Accounts.accountStatus": "active" } },
            {
                $project: {
                    _id: 0,
                    accountNumber: "$mt5Accounts.account",
                    email: "$email",
                    challengeStage: "$mt5Accounts.challengeStage",
                },
            },
        ]);
        return activeAccounts;
    } catch (error) {
        console.error("Error fetching active accounts:", error);
        throw error;
    }
};

module.exports = { getActiveAccounts };