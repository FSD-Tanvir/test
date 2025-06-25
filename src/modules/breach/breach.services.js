const { mt5Constant, matchTraderConstant } = require("../../constants/commonConstants");
const { getAllActiveMatchTraderAccounts } = require("../../helper/getAllActiveAccounts");
const {
	getSingleTradingAccount,
} = require("../../thirdPartyMatchTraderApi/thirdPartyMatchTraderApi");
const { allUserDetails, accountDetails } = require("../../thirdPartyMt5Api/thirdPartyMt5Api");
const DisableAccount = require("../disableAccounts/disableAccounts.schema");
const StoreDataModel = require("./breach.schema");

// Function to store daily data fetched from an external API

const storeDataDaily = async (retryCount = 0) => {
	try {
		const mt5Users = await allUserDetails();
		const matchTraderUsers = await getAllActiveMatchTraderAccounts();

		console.log(`👥 MT5 Users: ${mt5Users.length}, Match Trader Users: ${matchTraderUsers.length}`);

		const storeData = [];

		// ✅ MT5 Accounts
		for (const userDetail of mt5Users) {
			const userRights = userDetail.rights;
			const account = userDetail.login;

			if (typeof userRights === "string" && !userRights.includes("USER_RIGHT_TRADE_DISABLED")) {
				const accountDetail = await accountDetails(account);

				if (accountDetail) {
					const asset = Math.max(accountDetail.balance, accountDetail.equity);

					storeData.push({
						account: accountDetail.login,
						platform: mt5Constant,
						asset: asset,
						dailyStartingBalance: accountDetail.balance,
						dailyStartingEquity: accountDetail.equity,
					});
				}
			}
		}

		// ✅ Match Trader Accounts
		for (const userDetail of matchTraderUsers) {
			const account = userDetail.account;
			const accountDetail = await getSingleTradingAccount(account);

			if (accountDetail) {
				const balance = accountDetail.financeInfo?.balance;
				const equity = accountDetail.financeInfo?.equity;

				const asset = Math.max(balance, equity);

				storeData.push({
					account: account,
					platform: matchTraderConstant,
					asset: asset,
					dailyStartingBalance: balance,
					dailyStartingEquity: equity,
				});
			}
		}

		// ✅ Store the combined data
		await StoreDataModel.create({
			dailyData: storeData,
			createdAt: new Date(),
		});

		console.log("✅ Daily data stored successfully.");
	} catch (error) {
		console.error(`❌ Error storing data (attempt ${retryCount + 1}/3):`, error);

		if (retryCount < 3) {
			console.log(`🔁 Retrying in 30 minutes (attempt ${retryCount + 2}/3)...`);
			setTimeout(() => storeDataDaily(retryCount + 1), 30 * 60 * 1000); // Retry after 30 min
		} else {
			console.error("⛔ Maximum retry attempts reached. Giving up.");
		}
	}
};

// Service to get the latest data for a specific mt5Account
const getUserStoredData = async (account) => {
	try {
		// Fetch the latest stored document
		const latestStoreData = await StoreDataModel.findOne().sort({
			createdAt: -1,
		});

		if (!latestStoreData) {
			throw new Error("No data found");
		}

		// Filter dailyData to get the relevant account data
		const userData = latestStoreData.dailyData.find((data) => data.account == account);

		if (!userData) {
			throw new Error(`No data found for account: ${account}`);
		}

		return userData;
	} catch (error) {
		throw error;
	}
};

const getUserStoredDataAll = async (account) => {
	try {
		// Fetch all documents for the specified account
		const allStoreData = await StoreDataModel.find({
			"dailyData.account": account,
		});

		if (allStoreData.length === 0) {
			throw new Error(`No data found for account: ${account}`);
		}

		// Extract and return all relevant dailyData entries
		const userData = allStoreData.flatMap((store) =>
			store.dailyData.filter((data) => data.account == account)
		);

		return userData;
	} catch (error) {
		throw error;
	}
};

// Function to delete data for a specific account on a specific date
const deleteAccountDataByDate = async (account, specificDate) => {
	try {
		// Parse the specific date to ensure we only match that date
		const date = new Date(specificDate);
		const startOfDay = new Date(date.setUTCHours(0, 0, 0, 0));
		const endOfDay = new Date(date.setUTCHours(23, 59, 59, 999));

		// Find and update the document by pulling the specific data
		const result = await StoreDataModel.updateOne(
			{
				"dailyData.account": account,
				createdAt: { $gte: startOfDay, $lte: endOfDay },
			},
			{
				$pull: { dailyData: { account: account } },
			}
		);

		return result;
	} catch (error) {
		throw new Error(`Error deleting account data: ${error.message}`);
	}
};

const updateLastDailyDataByMt5Account = async (mt5Account, newBalance, newAsset, newEquity) => {
	try {
		// Find the latest document and update the dailyStartingBalance for the given mt5Account
		const updatedData = await StoreDataModel.findOneAndUpdate(
			{ "dailyData.mt5Account": mt5Account }, // Match mt5Account in dailyData
			{
				$set: {
					"dailyData.$.dailyStartingBalance": newBalance, // Update dailyStartingBalance
					"dailyData.$.asset": newAsset, // Update asset
					"dailyData.$.dailyStartingEquity": newEquity, // Update dailyStartingEquity
				},
			},
			{
				sort: { createdAt: -1 }, // Sort to get the most recent document
				new: true, // Return the updated document
			}
		);

		if (!updatedData) {
			throw new Error("No data found for the specified mt5Account.");
		}

		// console.log("Last store data updated successfully", updatedData);
		return updatedData;
	} catch (error) {
		console.error("Error updating last store data:", error.message);
		throw new Error(error.message);
	}
};

const fetchAllAccounts = async () => {
	try {
		const accounts = await DisableAccount.find({});
		console.log(accounts);
		return accounts;
	} catch (error) {
		throw new Error("Error fetching account data: " + error.message);
	}
};

const deleteAccountById = async (id) => {
	try {
		// Find and delete the record by ID
		const deletedAccount = await DisableAccount.findByIdAndDelete(id);
		return deletedAccount;
	} catch (error) {
		throw new Error(error.message); // Pass error up to the controller
	}
};
module.exports = {
	storeDataDaily,
	getUserStoredData,
	getUserStoredDataAll,
	deleteAccountDataByDate,
	updateLastDailyDataByMt5Account,
	fetchAllAccounts,
	deleteAccountById,
};
