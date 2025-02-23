const cron = require("node-cron");
const { storeDailyDataController } = require("../modules/breach/breach.controller");
const { lotSizeRisk } = require("../modules/lotSizeRisk/lotSizeRisk.services");

const runAllFunctions = () => {
    storeDailyDataController();

    lotSizeRisk();
};
module.exports = { runAllFunctions };
