const cron = require("node-cron");

// breach.controller.js

const {
	storeDataDaily,
	getUserStoredData,
	getUserStoredDataAll,
	deleteAccountDataByDate,
	fetchAllAccounts,
	deleteAccountById,
} = require("./breach.services");

const storeDailyDataController = () => {
	cron.schedule("5 22 * * *", () => {
		console.log("Cron job triggered");
		storeDataDaily();
	});
};

const getUserStoredDataController = async (req, res) => {
	const { mt5Account } = req.params;

	try {
		const userData = await getUserStoredData(mt5Account);
		return res.status(200).json(userData);
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

const getUserStoredDataControllersAll = async (req, res) => {
	const { mt5Account } = req.params;

	try {
		const userData = await getUserStoredDataAll(mt5Account);
		return res.status(200).json(userData);
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

// Controller to handle deletion of specific account data on a specific date
const deleteAccountDataController = async (req, res) => {
	const { mt5Account } = req.params;
	const { date } = req.query; // Pass date as query parameter

	try {
		const result = await deleteAccountDataByDate(mt5Account, date);
		if (result.modifiedCount > 0) {
			return res.status(200).json({ message: "Data deleted successfully." });
		} else {
			return res.status(404).json({ message: "No matching data found to delete." });
		}
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

const getAllAccounts = async (req, res) => {
	try {
		const accounts = await fetchAllAccounts();
		console.log(accounts);
		res.status(200).json({
			success: true,
			data: accounts,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

const deleteDisableAccountById = async (req, res) => {
	try {
		const { id } = req.params; // Extract ID from request params
		const deletedAccount = await deleteAccountById(id);
		if (!deletedAccount) {
			return res.status(404).json({ message: "Account not found" });
		}
		return res.status(200).json({ message: "Account deleted successfully", data: "No data" });
	} catch (error) {
		return res.status(500).json({ message: "An error occurred", error: error.message });
	}
};

module.exports = {
	storeDailyDataController,
	getUserStoredDataController,
	getUserStoredDataControllersAll,
	deleteAccountDataController,
	getAllAccounts,
	deleteDisableAccountById,
};
