const mongoose = require("mongoose");
const { mt5Constant, matchTraderConstant } = require("../../constants/commonConstants");

const DailyDataSchema = new mongoose.Schema(
	{
		account: { type: Number, required: true },
		platform: {
			type: String,
			enum: [mt5Constant, matchTraderConstant],
			required: true,
		},
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

//! TODO :: Replace StoreData with StoreData2
module.exports = mongoose.model("StoreData2", StoreDataSchema);
