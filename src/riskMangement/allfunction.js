const { storeDailyDataController } = require("../modules/breach/breach.controller");
const {
    consistencyBreak,
    sendAutomatedConsistencyBreakEmail,
} = require("../modules/consistencyBreak/consistencyBreak.services");
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
    storeDailyDataController();

    // Schedule lotSizeRisk to run daily at 21:30
    cron.schedule("30 21 * * *", () => {
        lotSizeRisk();
    });

    // Schedule stopLossRisk to run daily at 22:00
    cron.schedule("00 22 * * *", () => {
        stopLossRisk();
    });

    // Schedule consistencyBreak to run 30 minutes after stopLossRisk
    cron.schedule("30 22 * * *", () => {
        consistencyBreak();
    });

    // Schedule checkAndSaveInactiveAccounts to run daily at 12:45
    cron.schedule("45 12 * * *", () => {
        checkAndSaveInactiveAccounts();
    });

    // Schedule sendAutomatedConsistencyBreakEmail to run daily at 22:50
    cron.schedule("50 22 * * *", () => {
        sendAutomatedConsistencyBreakEmail();
    });

    // Schedule sendAutomatedStopLossEmail to run every 6 hours
    cron.schedule("0 */6 * * *", () => {
        sendAutomatedStopLossEmail();
    });

    // Schedule lotSizeRisk to run daily at 23:25
    cron.schedule("25 23 * * *", () => {
        sendAutomatedLotSizeEmail();
    });

    // Schedule sendAutomatedTwoPercentEmail to run daily at 00:19
    cron.schedule("19 0 * * *", () => {
        sendAutomatedTwoPercentEmail();
    });
};
module.exports = { runAllFunctions };
