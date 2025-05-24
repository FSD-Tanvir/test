const mongoose = require("mongoose");

const dailyTaskLogSchema = new mongoose.Schema({
	taskName: {
		type: String,
		required: true,
		unique: true,
	},
	lastRunAt: {
		type: Date,
		required: true,
	},
});

module.exports = mongoose.model("DailyTaskLog", dailyTaskLogSchema);
