const { default: mongoose } = require("mongoose");
const { mt5Constant } = require("../../constants/commonConstants");

const disableAccountSchema = new mongoose.Schema({
	account: { type: String, required: true, unique: true },
	platform: { type: String, default: mt5Constant },
	equity: { type: Number, required: true },
	lossPercentage: { type: Number, required: true },
	asset: { type: Number },
	balance: { type: Number },
	initialBalance: { type: Number },
	message: { type: String, required: true }, // Either "DailyDrawdown" or "MaxTotalLoss"
	date: { type: Date, default: Date.now },
});

//! TODO :: Replace DisableAccount with DisableAccount2
const DisableAccount = mongoose.model("DisableAccount2", disableAccountSchema);

module.exports = DisableAccount;
