const { default: mongoose } = require("mongoose");

// Schema for MT5
const disableAccountMT5Schema = new mongoose.Schema({
	mt5Account: { type: String, required: true, unique: true },
	equity: { type: Number, required: true },
	lossPercentage: { type: Number, required: true },
	asset: { type: Number },
	balance: { type: Number },
	initialBalance: { type: Number },
	message: { type: String, required: true }, // "DailyDrawdown" or "MaxTotalLoss"
	date: { type: Date, default: Date.now },
});

// Schema for MatchTrader
const disableAccountMatchTraderSchema = new mongoose.Schema({
	matchTraderAccount: { type: String, required: true, unique: true },
	equity: { type: Number, required: true },
	lossPercentage: { type: Number, required: true },
	asset: { type: Number },
	balance: { type: Number },
	initialBalance: { type: Number },
	message: { type: String, required: true }, // "DailyDrawdown" or "MaxTotalLoss"
	date: { type: Date, default: Date.now },
});

// Models
const DisableAccount = mongoose.model("DisableAccount", disableAccountMT5Schema);
const DisableAccountMatchTrader = mongoose.model(
	"DisableAccountMatchTrader",
	disableAccountMatchTraderSchema
);

module.exports = {
	DisableAccount,
	DisableAccountMatchTrader,
};
