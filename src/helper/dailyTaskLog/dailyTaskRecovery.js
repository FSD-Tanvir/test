// recoverMissedDailyTask.js

const { storeDataDaily } = require("../../modules/breach/breach.services");
const DailyTaskLog = require("./dailyTaskLog.schema");
const MAX_RECOVERY_RETRIES = 3;

/**
 * @param {string} taskName - Unique name of the task (e.g., "storeDataDaily"). Used as a key in the DailyTaskLog collection.
 * @param {function} taskFunction - The async function that should be run if the task was missed.
 * @param {object} options - Configuration for the recovery logic.
 * @param {number} options.hour - Scheduled hour of task execution (24-hour format).
 * @param {number} options.minute - Scheduled minute of task execution.
 * @param {number} [options.graceMinutes=15] - Time window in minutes after the scheduled time during which the task is still considered valid.
 *
 * @returns {Promise<void>}
 */

const recoverMissedDailyTask = async (
	taskName,
	taskFunction,
	{ hour, minute, graceMinutes = 15 }
) => {
	try {
		const now = new Date();

		// Define the scheduled time for today
		const windowStart = new Date();
		windowStart.setHours(hour, minute, 0, 0);

		const windowEnd = new Date(windowStart.getTime() + graceMinutes * 60 * 1000);

		// If it's still within the grace period, do not run the task
		if (now < windowEnd) {
			// console.log(`[${taskName}] ⏳ Waiting for grace window to complete...`);
			return true;
		}

		// Find the last time the task ran
		const log = await DailyTaskLog.findOne({ taskName });

		// If no log or last run was before today’s window, trigger the task
		if (!log || log.lastRunAt < windowStart) {
			console.warn(`[${taskName}] ⚠️ Missed daily run detected. Running recovery...`);

			const result = await taskFunction();

			// If the task function explicitly returns false, treat it as failure
			if (result === false) {
				console.error(`[${taskName}] ❌ Task execution failed.`);
				return false;
			}

			await DailyTaskLog.findOneAndUpdate(
				{ taskName },
				{ lastRunAt: new Date() },
				{ upsert: true }
			);

			console.log(`[${taskName}] ✅ Task recovery run successful.`);
			return true;
		} else {
			console.log(`[${taskName}] ✅ Task already ran successfully within grace period.`);
			return true;
		}
	} catch (err) {
		console.error(`[${taskName}] ❌ Error during recovery check:`, err.message);
		return false;
	}
};

/**
 * Attempt to run recovery task up to 3 times if it fails.
 */
const runStoreDataRecovery = async (retry = 0) => {
	const result = await recoverMissedDailyTask("storeDataDaily", storeDataDaily, {
		hour: 22,
		minute: 5,
		graceMinutes: 15,
	});

	if (!result && retry + 1 < MAX_RECOVERY_RETRIES) {
		console.log(`🔁 Retrying recovery... (${retry + 2}/${MAX_RECOVERY_RETRIES})`);
		await runStoreDataRecovery(retry + 1);
	} else if (!result) {
		console.log("🚫 Recovery failed after maximum attempts.");
	}
};

module.exports = {
	recoverMissedDailyTask,
	runStoreDataRecovery,
};
