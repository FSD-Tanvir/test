const { storeDailyDataController } = require("../modules/breach/breach.controller");
const { checkAndSaveInactiveAccounts } = require("../modules/sevenDaysTradingChallenge/sevenDaysTradingChallenge.controller");


const runAllFunctions = () => {
    storeDailyDataController();
    cron.schedule("0 0 * * *", async () => {
        console.log("Running daily inactive account check...");
        await checkAndSaveInactiveAccounts();
    });
};
module.exports = { runAllFunctions };

