const cron = require("node-cron");
const { storeDailyDataController } = require("../modules/breach/breach.controller");
const { sendingFollowUpUnPaidEmail } = require("../modules/orders/orders.services");

const runAllFunctions = () => {
	storeDailyDataController();

	// (async () => {
	// 	console.log("Starting follow-up unpaid email service...");
	// 	await sendingFollowUpUnPaidEmail();

	// Schedule it to run every hour using node-cron
	// 	cron.schedule("0 * * * *", async () => {
	// 		console.log("Running scheduled follow-up unpaid email service...");
	// 		await sendingFollowUpUnPaidEmail();
	// 	});
	// })();
};
module.exports = { runAllFunctions };
