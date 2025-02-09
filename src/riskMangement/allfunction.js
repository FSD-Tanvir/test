const cron = require("node-cron");
const { storeDailyDataController } = require("../modules/breach/breach.controller");
const { sendingFollowUpUnPaidEmail } = require("../modules/orders/orders.services");

const runAllFunctions = () => {
	storeDailyDataController();
	// (async () => {
	// 	console.log("Starting follow-up unpaid email service...");
	// 	await sendingFollowUpUnPaidEmail();

	// 	// Schedule it to run every hour
	// 	setInterval(async () => {
	// 		console.log("Running scheduled follow-up unpaid email service...");
	// 		await sendingFollowUpUnPaidEmail();
	// 	}, 1000 * 60 * 60); // 1 hour in milliseconds
	// })();
};
module.exports = { runAllFunctions };
