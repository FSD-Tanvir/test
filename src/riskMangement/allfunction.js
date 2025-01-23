const cron = require("node-cron");
const { storeDailyDataController } = require("../modules/breach/breach.controller");

const runAllFunctions = () => {
	storeDailyDataController();
};
module.exports = { runAllFunctions };
