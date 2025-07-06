const { DisableAccount } = require("./disableAccounts.schema.js");
const disableAccountService = require("./disableAccounts.services.js");

const getDisabledAccountHandler = async (req, res) => {
	const { account } = req.params;

	try {
		const disabledAccount = await disableAccountService.getDisabledAccount(account);

		res.status(200).json({
			success: true,
			message: "Disabled account fetched successfully",
			data: disabledAccount,
		});
	} catch (error) {
		console.error(`Error fetching disabled account for ${account}:`, error);
		res.status(500).json({
			success: false,
			message: `Error fetching disabled account for ${account}`,
			error: error.message,
		});
	}
};

// Helper function to get all disabled accounts
const fetchDisabledAccounts = async () => {
	try {
		// Fetch only the mt5Account field from disabled accounts
		const disabledAccounts = await DisableAccount.find({}, "mt5Account");
		return disabledAccounts;
	} catch (error) {
		console.error("Error fetching disabled accounts:", error);
		throw new Error("Failed to fetch disabled accounts");
	}
};

// Controller to get all disabled accounts (for other routes, if needed)
const getAllDisabledAccounts = async (req, res) => {
	try {
		const disabledAccounts = await fetchDisabledAccounts();
		res.status(200).json({
			success: true,
			message: "Disabled accounts fetched successfully",
			data: disabledAccounts,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Error fetching disabled accounts",
			error: error.message,
		});
	}
};


const createManuallyDisabledAccountHandler = async (req, res) => {
	console.log("createManuallyDisabledAccountHandler called");
	try {
		const { accountNumber } = req.query;
		const { message } = req.body;

		const result = await disableAccountService.saveDisableLogByManual(accountNumber, message);

		if (!result.success) {
			return res.status(400).json(result);
		}

		res.status(201).json(result);
	} catch (err) {
		res.status(500).json({ success: false, message: err.message });
	}
}

module.exports = { getDisabledAccountHandler, getAllDisabledAccounts, fetchDisabledAccounts, createManuallyDisabledAccountHandler };
