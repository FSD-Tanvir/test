const { default: mongoose } = require("mongoose");

const disableAccountSchema = new mongoose.Schema({
	mt5Account: { type: String, required: true, unique: true },
	equity: { type: Number, required: true },
	lossPercentage: { type: Number, required: true },
	asset: { type: Number },
	balance: { type: Number },
	initialBalance: { type: Number },
	message: { type: String, required: true }, // Either "DailyDrawdown" or "MaxTotalLoss"
	date: { type: Date, default: Date.now },
});

const DisableAccount = mongoose.model("DisableAccount", disableAccountSchema);

module.exports = DisableAccount;
