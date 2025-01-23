const mongoose = require("mongoose");

const DailyDataSchema = new mongoose.Schema(
	{
		mt5Account: { type: Number, required: true },
		asset: { type: Number, required: true },
		initialBalance: { type: Number },
		dailyStartingBalance: { type: Number, required: true },
		dailyStartingEquity: { type: Number, required: true },
		dailyLoss: { type: Number }, // Add fields for drawdown data
		dailyLossLimit: { type: Number },
		dailyLossPercentage: { type: Number },
		totalLoss: { type: Number },
		totalLossLimit: { type: Number },
		totalLossPercentage: { type: Number },
	},
	{ timestamps: true }
);

const StoreDataSchema = new mongoose.Schema(
	{
		dailyData: [DailyDataSchema],
		createdAt: { type: Date, default: Date.now },
	},
	{ timestamps: true }
);

module.exports = mongoose.model("StoreData", StoreDataSchema);
