const { sendEmailSingleRecipient } = require("../../helper/mailing.js");
const {
	disableMailingHTMLTemplate,
} = require("../../helper/utils/disableMailingHTMLTemplate.js");
const { findUserByAccount } = require("../../helper/utils/findUser.js");
const DisableAccount = require("./disableAccounts.schema.js");

const saveRealTimeLog = async (
	accountNumber,
	lossPercentage,
	asset,
	balance,
	initialBalance,
	equity,
	message,
) => {
	// console.log("line 18", accountNumber, lossPercentage, asset, equity, message)
	try {
		// Validate that accountNumber is not null or undefined
		if (!accountNumber) {
			console.error("Invalid accountNumber:", accountNumber);
			throw new Error(
				"MT4Account is required and cannot be null or undefined.",
			);
		}

		// Check if an entry with the same MT4Account already exists
		// biome-ignore lint/style/useConst: <explanation>
		let existingLog = await DisableAccount.findOne({
			MT4Account: accountNumber,
		});

		if (existingLog) {
			return {
				success: false,
				message: "Log entry with this MT4Account already exists",
			};
		}

		// Create a new log entry if not already existing
		const newLog = new DisableAccount({
			mt5Account: accountNumber,
			lossPercentage: lossPercentage, // Ensure correct value here
			asset: asset,
			balance: balance,
			initialBalance: initialBalance, // Ensure correct value here
			equity: equity, // Ensure correct value here
			message: message, // Ensure correct value here
		});

		// Save the new log entry to the database
		await newLog.save();

		/*🧲🧲🧲🧲Account bridge or disable informing by mail start point*/

		const userFromOwn = await findUserByAccount(accountNumber);
		const { email } = userFromOwn;
		if (message === "MaxTotalLoss") {
			const MaxHtml = await disableMailingHTMLTemplate(
				accountNumber,
				message,
				lossPercentage,
				initialBalance,
				equity,
			);
			await sendEmailSingleRecipient(email, "Account Status", message, MaxHtml);
		} else {
			const DailyHtml = await disableMailingHTMLTemplate(
				accountNumber,
				message,
				lossPercentage,
				asset,
				equity,
			);
			await sendEmailSingleRecipient(
				email,
				"Account Status",
				message,
				DailyHtml,
			);
		}

		/*🧲🧲🧲🧲Account bridge or disable informing by mail end point*/

		return { success: true, message: "Log entry saved successfully" };
	} catch (error) {
		// console.error("Error saving real-time log entry:", error.message);
		return {
			success: false,
			message: `Failed to save log entry: ${error.message}`,
		};
	}
};

const getDisabledAccount = async (account) => {
	try {
		const disabledAccount = await DisableAccount.findOne({
			mt5Account: account,
		});

		if (!disabledAccount) {
			return null;
		}

		return disabledAccount;
	} catch (error) {
		console.log(error);
	}
};



module.exports = {
	saveRealTimeLog,
	getDisabledAccount,
};
