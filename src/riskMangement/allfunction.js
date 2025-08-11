const { storeDailyDataController } = require("../modules/breach/breach.controller");

const {
	lotSizeRisk,
	sendAutomatedLotSizeEmail,
} = require("../modules/lotSizeRisk/lotSizeRisk.services");
const {
	checkAndSaveInactiveAccounts,
} = require("../modules/sevenDaysTradingChallenge/sevenDaysTradingChallenge.controller");
const {
	stopLossRisk,
	sendAutomatedStopLossEmail,
} = require("../modules/stopLossRisk/stopLossRisk.services");
const cron = require("node-cron");
const {
	sendAutomatedTwoPercentEmail,
} = require("../modules/twoPercentRisk/twoPercentRisk.services");
const { callRefreshMT5BridgeSession } = require("../helper/mt5TokenValidator");

const runAllFunctions = () => {
	/* ---------------------------------------------------------------------------------------------- */
	/*                                   //! Store Daily Data                                     */
	/* ---------------------------------------------------------------------------------------------- */
	storeDailyDataController();

	/* ---------------------------------------------------------------------------------------------- */
	/*                                   //! LOT Size Risk                                     */
	/* ---------------------------------------------------------------------------------------------- */
	cron.schedule("00 16 * * *", () => {
		lotSizeRisk();
	});

	cron.schedule("00 17 * * *", () => {
		sendAutomatedLotSizeEmail();
	});

	cron.schedule("00 19 * * *", () => {
		sendAutomatedLotSizeEmail();
	});

	/* ---------------------------------------------------------------------------------------------- */
	/*                                   //! Stop Loss Risk                                     */
	/* ---------------------------------------------------------------------------------------------- */
	cron.schedule("00 22 * * *", () => {
		stopLossRisk();
	});

	// cron.schedule("30 22 * * *", () => {
	// 	sendAutomatedStopLossEmail();
	// });
	// cron.schedule("00 23 * * *", () => {
	// 	sendAutomatedStopLossEmail();
	// });

	// cron.schedule("00 3 * * *", () => {
	// 	sendAutomatedStopLossEmail();
	// });

	/* ---------------------------------------------------------------------------------------------- */
	/*                                   //! Two Percent Risk                                      */
	/* ---------------------------------------------------------------------------------------------- */

	cron.schedule("19 0 * * *", () => {
		sendAutomatedTwoPercentEmail();
	});

	cron.schedule("19 4 * * *", () => {
		sendAutomatedTwoPercentEmail(); // runs again at 4:19 AM
	});

	/* ---------------------------------------------------------------------------------------------- */
	/*                                   //! Inactive Accounts                                     */
	/* ---------------------------------------------------------------------------------------------- */

	cron.schedule("45 12 * * *", () => {
		checkAndSaveInactiveAccounts();
	});

	/* ---------------------------------------------------------------------------------------------- */
	/*                                   //! Mt5 Token Refresh                                     */
	/* ---------------------------------------------------------------------------------------------- */

	setInterval(() => {
		callRefreshMT5BridgeSession();
	}, 2 * 60 * 60 * 1000);

	callRefreshMT5BridgeSession();
};
module.exports = { runAllFunctions };
