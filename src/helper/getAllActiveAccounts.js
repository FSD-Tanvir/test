const MUser = require("../modules/users/users.schema");

// Return all active accounts
const getAllActiveAccounts = async () => {
	const activeAccounts = await MUser.aggregate([
		{
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
				foreignField: "account",
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
					accountStatus: "$mt5Accounts.accountStatus",
					accountSize: "$mt5Accounts.challengeStageData.accountSize",
				},
			},
		},
	]);

	return activeAccounts;
};

// Returns all active funded accounts including Instant funding
const getAllActiveFundedAccounts = async () => {
	const activeAccounts = await MUser.aggregate([
		{
			$project: {
				email: 1,
				mt5Accounts: {
					$filter: {
						input: "$mt5Accounts",
						as: "account",
						cond: {
							$and: [
								{ $eq: ["$$account.accountStatus", "active"] },
								{ $eq: ["$$account.challengeStage", "funded"] },
							],
						},
					},
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
				foreignField: "account",
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
					accountStatus: "$mt5Accounts.accountStatus",
					challengeStage: "$mt5Accounts.challengeStage",
					accountSize: "$mt5Accounts.challengeStageData.accountSize",
				},
			},
		},
	]);
	return activeAccounts;
};

// Returns all active  Instant funding accounts
const getAllActiveInstantFundedAccounts = async () => {
	const activeAccounts = await MUser.aggregate([
		{
			$match: {
				"mt5Accounts.challengeStageData.challengeType": "funded", // Filter users with at least one funded account
			},
		},
		{
			$project: {
				email: 1,
				mt5Accounts: {
					$filter: {
						input: "$mt5Accounts",
						as: "account",
						cond: {
							$eq: ["$$account.challengeStageData.challengeType", "funded"], // Ensure type is funded
						},
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
				foreignField: "account", // Field in DisableAccount
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
					accountStatus: "$mt5Accounts.accountStatus",
					challengeStage: "$mt5Accounts.challengeStage",
					accountSize: "$mt5Accounts.challengeStageData.accountSize",
				},
			},
		},
	]);

	return activeAccounts;
};

// Return all active accounts
const getAllActiveMatchTraderAccounts = async () => {
	const activeAccounts = await MUser.aggregate([
		{
			$project: {
				email: 1,
				matchTraderAccounts: {
					$filter: {
						input: "$matchTraderAccounts",
						as: "account",
						cond: { $eq: ["$$account.accountStatus", "active"] },
					},
				},
			},
		},
		{ $unwind: "$matchTraderAccounts" },
		{
			$addFields: {
				accountString: { $toString: "$matchTraderAccounts.account" },
			},
		},
		{
			$lookup: {
				from: "disableaccounts",
				// from: "disableaccount2, // model name
				localField: "accountString",
				foreignField: "account",
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
					account: "$matchTraderAccounts.account",
					accountStatus: "$matchTraderAccounts.accountStatus",
					accountSize: "$matchTraderAccounts.challengeStageData.accountSize",
				},
			},
		},
	]);

	return activeAccounts;
};

// Returns all active funded accounts including Instant funding
const getAllActiveFundedMatchTraderAccounts = async () => {
	const activeAccounts = await MUser.aggregate([
		{
			$project: {
				email: 1,
				matchTraderAccounts: {
					$filter: {
						input: "$matchTraderAccounts",
						as: "account",
						cond: {
							$and: [
								{ $eq: ["$$account.accountStatus", "active"] },
								{ $eq: ["$$account.challengeStage", "funded"] },
							],
						},
					},
				},
			},
		},
		{ $unwind: "$matchTraderAccounts" },
		{
			$addFields: {
				accountString: { $toString: "$matchTraderAccounts.account" },
			},
		},
		{
			$lookup: {
				from: "disableaccounts",
				localField: "accountString",
				foreignField: "account",
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
					account: "$matchTraderAccounts.account",
					accountStatus: "$matchTraderAccounts.accountStatus",
					challengeStage: "$matchTraderAccounts.challengeStage",
					accountSize: "$matchTraderAccounts.challengeStageData.accountSize",
				},
			},
		},
	]);
	return activeAccounts;
};

// Returns all active  Instant funding accounts
const getAllActiveInstantFundedMatchTraderAccounts = async () => {
	const activeAccounts = await MUser.aggregate([
		{
			$match: {
				"matchTraderAccounts.challengeStageData.challengeType": "funded", // Filter users with at least one funded account
			},
		},
		{
			$project: {
				email: 1,
				matchTraderAccounts: {
					$filter: {
						input: "$matchTraderAccounts",
						as: "account",
						cond: {
							$eq: ["$$account.challengeStageData.challengeType", "funded"], // Ensure type is funded
						},
					},
				},
			},
		},
		{ $unwind: "$matchTraderAccounts" }, // Unwind to get individual accounts
		{
			$addFields: {
				accountString: { $toString: "$matchTraderAccounts.account" }, // Convert `Number` to `String`
			},
		},
		{
			$lookup: {
				from: "disableaccounts", // Collection name of the DisableAccount model
				localField: "accountString", // Converted account number as a string
				foreignField: "account", // Field in DisableAccount
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
					account: "$matchTraderAccounts.account",
					accountStatus: "$matchTraderAccounts.accountStatus",
					challengeStage: "$matchTraderAccounts.challengeStage",
					accountSize: "$matchTraderAccounts.challengeStageData.accountSize",
				},
			},
		},
	]);

	return activeAccounts;
};

module.exports = {
	getAllActiveAccounts,
	getAllActiveFundedAccounts,
	getAllActiveInstantFundedAccounts,
	getAllActiveMatchTraderAccounts,
	getAllActiveFundedMatchTraderAccounts,
	getAllActiveInstantFundedMatchTraderAccounts,
};
