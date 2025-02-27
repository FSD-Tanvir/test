const { storeDailyDataController } = require("../modules/breach/breach.controller");
const { consistencyBreak } = require("../modules/consistencyBreak/consistencyBreak.services");
const { lotSizeRisk } = require("../modules/lotSizeRisk/lotSizeRisk.services");
const { checkAndSaveInactiveAccounts } = require("../modules/sevenDaysTradingChallenge/sevenDaysTradingChallenge.controller");
const { stopLossRisk } = require("../modules/stopLossRisk/stopLossRisk.services");
const cron = require("node-cron");

const runAllFunctions = () => {
    storeDailyDataController();

    // Schedule lotSizeRisk to run daily at 21:30
    cron.schedule("30 21 * * *", () => {
        lotSizeRisk();
    });

    // Schedule stopLossRisk to run at a specific time (e.g., 22:00)
    cron.schedule("00 22 * * *", () => {
        stopLossRisk();
    });

    // Schedule consistencyBreak to run 30 minutes after stopLossRisk (e.g., 22:30)
    cron.schedule("30 22 * * *", () => {
        consistencyBreak();
    });

    cron.schedule("36 15 * * *", () => {
        checkAndSaveInactiveAccounts()
    });

    
};
module.exports = { runAllFunctions };

