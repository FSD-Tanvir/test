const MUser = require("../users/users.schema");

;

// Function to fetch active accounts
const getActiveAccounts = async () => {
    try {
        // Perform the aggregation pipeline
        const activeAccounts = await MUser.aggregate([
            {
                // Project only the email and filtered mt5Accounts (active accounts)
                $project: {
                    email: 1,
                    mt5Accounts: {
                        $filter: {
                            input: "$mt5Accounts",
                            as: "account",
                            cond: { $eq: ["$$account.accountStatus", "active"] },
                        },
                    },
                },
            },
            {
                // Unwind the mt5Accounts array while preserving documents with empty arrays
                $unwind: {
                    path: "$mt5Accounts",
                    preserveNullAndEmptyArrays: false, // Set to false to exclude empty arrays
                },
            },
            {
                // Convert the account number to a string for lookup
                $addFields: {
                    accountString: { $toString: "$mt5Accounts.account" },
                },
            },
            {
                // Lookup to find if the account is disabled
                $lookup: {
                    from: "disableaccounts", // Collection to join
                    localField: "accountString", // Field from the input documents
                    foreignField: "mt5Account", // Field from the "disableaccounts" collection
                    as: "disabledAccount", // Output array field
                },
            },
            {
                // Match only accounts that are not disabled
                $match: {
                    disabledAccount: { $size: 0 }, // Ensure disabledAccount array is empty
                },
            },
            {
                // Reshape the output to include only email and account
                $replaceRoot: {
                    newRoot: {
                        email: "$email",
                        account: "$mt5Accounts.account",
                    },
                },
            },
        ]);

        return activeAccounts;
    } catch (error) {
        // Handle any errors that occur during the aggregation
        console.error("Error fetching active accounts:", error);
        throw error; // Re-throw the error for the caller to handle
    }
};

module.exports = { getActiveAccounts };