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

const runAllFunctions = () => {
	/* ---------------------------------------------------------------------------------------------- */
	/*                                   //! Store Daily Data                                     */
	/* ---------------------------------------------------------------------------------------------- */
	storeDailyDataController();

	/* ---------------------------------------------------------------------------------------------- */
	/*                                   //! LOT Size Risk                                     */
	/* ---------------------------------------------------------------------------------------------- */
	cron.schedule("30 21 * * *", () => {
		lotSizeRisk();
	});

	cron.schedule("25 23 * * *", () => {
		sendAutomatedLotSizeEmail();
	});

	/* ---------------------------------------------------------------------------------------------- */
	/*                                   //! Stop Loss Risk                                     */
	/* ---------------------------------------------------------------------------------------------- */
	cron.schedule("00 22 * * *", () => {
		stopLossRisk();
	});

	cron.schedule("10 23 * * *", () => {
		sendAutomatedStopLossEmail();
	});

	/* ---------------------------------------------------------------------------------------------- */
	/*                                   //! Two Percent Risk                                      */
	/* ---------------------------------------------------------------------------------------------- */

	cron.schedule("19 0 * * *", () => {
		sendAutomatedTwoPercentEmail();
	});

	/* ---------------------------------------------------------------------------------------------- */
	/*                                   //! Inactive Accounts                                     */
	/* ---------------------------------------------------------------------------------------------- */

	cron.schedule("45 12 * * *", () => {
		checkAndSaveInactiveAccounts();
	});
};
module.exports = { runAllFunctions };
