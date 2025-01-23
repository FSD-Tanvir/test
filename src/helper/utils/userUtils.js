const MUser = require("../../modules/users/users.schema");

const getMt5AccountByNumber = async (mt5AccountNum) => {
	try {
		const accountNumber = mt5AccountNum;

		// Ensure the account number is a valid integer
		const parsedAccountNumber = Number.parseInt(accountNumber);
		if (Number.isNaN(parsedAccountNumber)) {
			throw new Error("Invalid account number provided");
		}

		// Define the aggregation pipeline for fetching the MT5 account by account number
		const pipeline = [
			{ $unwind: "$mt5Accounts" }, // Unwind mt5Accounts array
			{ $match: { "mt5Accounts.account": parsedAccountNumber } }, // Match the specific account number
			{
				$project: {
					email: 1,
					firstName: "$first",
					lastName: "$last",
					"mt5Accounts.account": 1,
					"mt5Accounts.challengeStatus": 1,
					"mt5Accounts.createdAt": 1,
					"mt5Accounts.challengeStage": 1,
					"mt5Accounts.challengeStageData": 1, // Include challengeStageData
				},
			},
		];

		// Execute the aggregation pipeline
		const result = await MUser.aggregate(pipeline);

		if (result.length === 0) {
			return {
				message: "No MT5 account found with the given account number.",
			};
		}

		// Return the first matching document since account numbers are unique
		return result[0];
	} catch (error) {
		throw new Error(`Error fetching MT5 account: ${error.message}`);
	}
};


module.exports = { getMt5AccountByNumber };



