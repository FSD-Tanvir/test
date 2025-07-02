const { sendEmailSingleRecipient } = require("../../helper/mailing.js");
const {
  disableMailingHTMLTemplate,
} = require("../../helper/utils/disableMailingHTMLTemplate.js");
const { findUserByAccount } = require("../../helper/utils/findUser.js");
const {
  DisableAccount,
  DisableAccountMatchTrader,
} = require("./disableAccounts.schema.js");

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
      throw new Error(
        "MT4Account is required and cannot be null or undefined."
      );
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
      await sendEmailSingleRecipient(
        email,
        "Account Status",
        message,
        DailyHtml
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

module.exports = {
  saveRealTimeLog,
  getDisabledAccount,
};
