const { allUserDetails, accountDetails } = require("../../thirdPartyMt5Api/thirdPartyMt5Api");
const DisableAccount = require("../disableAccounts/disableAccounts.schema");
const StoreDataModel = require("./breach.schema");

const fetchWithTimeout = async (url, options = {}, timeout = 20000, retries = 3) => {
	const controller = new AbortController();
	const id = setTimeout(() => controller.abort(), timeout);

	try {
		const response = await fetch(url, {
			...options,
			signal: controller.signal,
		});
		clearTimeout(id);

		if (!response.ok) {
			throw new Error(`HTTP error! Status: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		clearTimeout(id);

		if (error.name === "AbortError") {
			console.error("Fetch request timed out");
		} else {
			console.error("Fetch error:", error);
		}

		if (retries > 0) {
			console.log(`Retrying... Attempts remaining: ${retries - 1}`);
			return fetchWithTimeout(url, options, timeout, retries - 1);
		} else {
			console.error(
				"All retry attempts failed. Please check the server status or network connection."
			);
			throw error;
		}
	}
};

// Function to store daily data fetched from an external API

const storeDataDaily = async () => {
	try {
		const userDetails = await allUserDetails();
		console.log("👥 Fetched user details:", userDetails);

		const storeData = [];
		for (const userDetail of userDetails) {
			const userRights = userDetail.rights;
			const account = userDetail.login;

			if (typeof userRights === "string" && !userRights.includes("USER_RIGHT_TRADE_DISABLED")) {
				const accountDetail = await accountDetails(account);
				if (accountDetail) {
					const asset =
						accountDetail.balance >= accountDetail.equity
							? accountDetail.balance
							: accountDetail.equity;

					storeData.push({
						mt5Account: accountDetail.login,
						asset: asset,
						dailyStartingBalance: accountDetail.balance,
						dailyStartingEquity: accountDetail.equity,
					});
				}
			}
		}

		await StoreDataModel.create({
			dailyData: storeData,
			createdAt: new Date(),
		});

		console.log("✅ Daily data stored successfully.");
		return true;
	} catch (error) {
		console.error("❌ Error during data store:", error.message);
		return false;
	}
};

// Service to get the latest data for a specific mt5Account
const getUserStoredData = async (mt5Account) => {
	try {
		// Fetch the latest stored document
		const latestStoreData = await StoreDataModel.findOne().sort({
			createdAt: -1,
		});

		if (!latestStoreData) {
			throw new Error("No data found");
		}

		// Filter dailyData to get the relevant mt5Account data
		const userData = latestStoreData.dailyData.find((data) => data.mt5Account == mt5Account);

		if (!userData) {
			throw new Error(`No data found for mt5Account: ${mt5Account}`);
		}

		return userData;
	} catch (error) {
		throw error;
	}
};

const getUserStoredDataAll = async (mt5Account) => {
	try {
		// Fetch all documents for the specified mt5Account
		const allStoreData = await StoreDataModel.find({
			"dailyData.mt5Account": mt5Account,
		});

		if (allStoreData.length === 0) {
			throw new Error(`No data found for mt5Account: ${mt5Account}`);
		}

		// Extract and return all relevant dailyData entries
		const userData = allStoreData.flatMap((store) =>
			store.dailyData.filter((data) => data.mt5Account == mt5Account)
		);

		return userData;
	} catch (error) {
		throw error;
	}
};

// Function to delete data for a specific account on a specific date
const deleteAccountDataByDate = async (mt5Account, specificDate) => {
	try {
		// Parse the specific date to ensure we only match that date
		const date = new Date(specificDate);
		const startOfDay = new Date(date.setUTCHours(0, 0, 0, 0));
		const endOfDay = new Date(date.setUTCHours(23, 59, 59, 999));

		// Find and update the document by pulling the specific data
		const result = await StoreDataModel.updateOne(
			{
				"dailyData.mt5Account": mt5Account,
				createdAt: { $gte: startOfDay, $lte: endOfDay },
			},
			{
				$pull: { dailyData: { mt5Account: mt5Account } },
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
