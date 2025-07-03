const { allUserDetails, accountDetails } = require("../../thirdPartyMt5Api/thirdPartyMt5Api");
const {
	DisableAccount,
	DisableAccountMatchTrader,
} = require("../disableAccounts/disableAccounts.schema");
const { StoreData, StoreDataMatchTrader } = require("./breach.schema");

// Function to store daily data fetched from an external API

const storeDataDaily = async (retryCount = 0) => {
	try {
		const mt5Users = await allUserDetails();

		console.log(`👥 MT5 Users: ${mt5Users.length}`);

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
						mt5Account: accountDetail.login,
						asset: asset,
						dailyStartingBalance: accountDetail.balance,
						dailyStartingEquity: accountDetail.equity,
					});
				}
			}
		}

		// ✅ Store the combined data
		await StoreData.create({
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
		const [latestStoreDataMT5, latestStoreDataMatchTrader] = await Promise.all([
			StoreData.findOne().sort({ createdAt: -1 }),
			StoreDataMatchTrader.findOne().sort({ createdAt: -1 }),
		]);

		const mt5Data = latestStoreDataMT5?.dailyData?.find((data) => data.mt5Account == account);

		if (mt5Data) {
			return mt5Data;
		}

		const matchTraderData = latestStoreDataMatchTrader?.dailyData?.find(
			(data) => data.matchTraderAccount == account
		);

		if (matchTraderData) {
			return matchTraderData;
		}

		throw new Error(`No data found for account: ${account}`);
	} catch (error) {
		console.error("Error in getUserStoredData:", error.message);
		throw error;
	}
};

const getUserStoredDataAll = async (account) => {
	try {
		// Fetch all documents for the specified account
		const allStoreData = await StoreData.find({
			"dailyData.mt5Account": account,
		});

		if (allStoreData.length === 0) {
			throw new Error(`No data found for account: ${account}`);
		}

		// Extract and return all relevant dailyData entries
		const userData = allStoreData.flatMap((store) =>
			store.dailyData.filter((data) => data.mt5Account == account)
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
		const result = await StoreData.updateOne(
			{
				"dailyData.mt5Account": account,
				createdAt: { $gte: startOfDay, $lte: endOfDay },
			},
			{
				$pull: { dailyData: { mt5Account: account } },
			}
		);

		return result;
	} catch (error) {
		throw new Error(`Error deleting account data: ${error.message}`);
	}
};

const updateLastDailyDataByMt5Account = async (account, newBalance, newAsset, newEquity) => {
	try {
		// Find the latest document and update the dailyStartingBalance for the given mt5Account
		const updatedData = await StoreData.findOneAndUpdate(
			{ "dailyData.mt5Account": account }, // Match mt5Account in dailyData
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
		const [accounts, matchTraderAccounts] = await Promise.all([
			DisableAccount.find({}),
			DisableAccountMatchTrader.find({}),
		]);

		const allAccounts = [...accounts, ...matchTraderAccounts];
		return allAccounts;
	} catch (error) {
		throw new Error("Error fetching account data: " + error.message);
	}
};

const deleteAccountById = async (id) => {
	try {
		// Try deleting from DisableAccount (MT5)
		let deletedAccount = await DisableAccount.findByIdAndDelete(id);
		if (deletedAccount) {
			return deletedAccount;
		}

		// If not found in DisableAccount, try MatchTrader collection
		deletedAccount = await DisableAccountMatchTrader.findByIdAndDelete(id);
		if (deletedAccount) {
			return deletedAccount;
		}

		// Not found in either collection
		return null;
	} catch (error) {
		throw new Error(error.message);
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
