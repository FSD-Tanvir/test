const { default: mongoose } = require("mongoose");
const { sendEmailSingleRecipient } = require("../../helper/mailing.js");
const { disableMailingHTMLTemplate } = require("../../helper/utils/disableMailingHTMLTemplate.js");
const { findUserByAccount } = require("../../helper/utils/findUser.js");
const { accountUpdate } = require("../../thirdPartyMt5Api/thirdPartyMt5Api.js");
const MUser = require("../users/users.schema.js");
const { DisableAccount, DisableAccountMatchTrader } = require("./disableAccounts.schema.js");

const saveRealTimeLog = async (
	accountNumber,
	lossPercentage,
	asset,
	balance,
	initialBalance,
	equity,
	message
) => {
	// console.log("line 18", accountNumber, lossPercentage, asset, equity, message)
	try {
		// Validate that accountNumber is not null or undefined
		if (!accountNumber) {
			console.error("Invalid accountNumber:", accountNumber);
			throw new Error("Account is required and cannot be null or undefined.");
		}

		// Check if an entry with the same accountNumber already exists
		let existingLog = await DisableAccount.findOne({
			mt5Account: accountNumber,
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
			lossPercentage: lossPercentage,
			asset: asset,
			balance: balance,
			initialBalance: initialBalance,
			equity: equity,
			message: message,
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
				equity
			);
			await sendEmailSingleRecipient(email, "Account Status", message, MaxHtml);
		} else {
			const DailyHtml = await disableMailingHTMLTemplate(
				accountNumber,
				message,
				lossPercentage,
				asset,
				equity
			);
			await sendEmailSingleRecipient(email, "Account Status", message, DailyHtml);
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
		const [mt5Account, matchTraderAccount] = await Promise.all([
			DisableAccount.findOne({ mt5Account: account }),
			DisableAccountMatchTrader.findOne({ matchTraderAccount: account }),
		]);

		return mt5Account || matchTraderAccount || null;
	} catch (error) {
		console.error("Error in getDisabledAccount:", error.message);
		throw error;
	}
};



const saveDisableLogByManual = async (accountNumber, message) => {
	if (!accountNumber || !message) {
		throw new Error("accountNumber and message are required");
	}

	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		// Check if log already exists
		const exists = await DisableAccount.findOne({ mt5Account: accountNumber }).session(session);
		if (exists) {
			await session.abortTransaction();
			session.endSession();
			return {
				success: false,
				message: "Log already exists for this account number",
			};
		}

		// Find user
		const user = await MUser.findOne({ "mt5Accounts.account": accountNumber }).session(session);
		if (!user) {
			await session.abortTransaction();
			session.endSession();
			return {
				success: false,
				message: "User not found for the provided MT5 account",
			};
		}

		const account = user.mt5Accounts.find((a) => a.account == accountNumber);
		if (!account) {
			await session.abortTransaction();
			session.endSession();
			return {
				success: false,
				message: "MT5 account not found in user's account list",
			};
		}

		// External MT5 group change
		const changeGroupDetails = {
			Group: "demo\\FXbin",
		};
		const changeGroup = await accountUpdate(account.account, changeGroupDetails);




		if (changeGroup !== "OK") {
			await session.abortTransaction();
			session.endSession();
			return {
				success: false,
				message: "Failed to change group in MT5 account",
			};
		}

		account.group = changeGroupDetails.Group;

		// Disable MT5 account
		const userDisableDetails = {
			Rights: "USER_RIGHT_TRADE_DISABLED",
			enabled: true,
		};
		const disableMT5Account = await accountUpdate(account.account, userDisableDetails);
		if (disableMT5Account !== "OK") {
			await session.abortTransaction();
			session.endSession();
			return {
				success: false,
				message: "Failed to disable MT5 trading rights",
			};
		}

		// Save user changes
		await user.save({ session });

		// Save disable log
		const newLog = new DisableAccount({
			mt5Account: accountNumber,
			equity: 0,
			lossPercentage: 0,
			asset: 0,
			balance: 0,
			initialBalance: 0,
			message,
		});
		await newLog.save({ session });

		// Commit transaction
		await session.commitTransaction();
		session.endSession();

		return {
			success: true,
			message: "Log saved and account disabled successfully",
			data: newLog,
		};
	} catch (error) {
		await session.abortTransaction();
		session.endSession();

		return {
			success: false,
			message: `Transaction failed: ${error.message}`,
		};
	}
};
module.exports = {
	saveDisableLogByManual,
};


module.exports = {
	saveRealTimeLog,
	getDisabledAccount,
	saveDisableLogByManual,
};
