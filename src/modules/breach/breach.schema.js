const mongoose = require("mongoose");

const DailyDataSchema = new mongoose.Schema(
	{
		mt5Account: { type: Number },
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
const DailyDataSchemaMatchTrader = new mongoose.Schema(
	{
		matchTraderAccount: { type: Number },
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

const StoreDataSchemaMT5 = new mongoose.Schema(
	{
		dailyData: [DailyDataSchema],
		createdAt: { type: Date, default: Date.now },
	},
	{ timestamps: true }
);

const StoreDataSchemaMatchTrader = new mongoose.Schema(
	{
		dailyData: [DailyDataSchemaMatchTrader],
		createdAt: { type: Date, default: Date.now },
	},
	{ timestamps: true }
);

// Models
const StoreData = mongoose.model("StoreData", StoreDataSchemaMT5);
const StoreDataMatchTrader = mongoose.model("StoreDataMatchTrader", StoreDataSchemaMatchTrader);

// ✅ Correct export
module.exports = {
	StoreData,
	StoreDataMatchTrader,
};
