// twoPercentRisk.schema.js
const mongoose = require("mongoose");

const stopLossRiskSchema = new mongoose.Schema(
	{
		account: {
			type: Number,
			required: true,
		},
		accountSize: {
			type: Number,
			required: true,
		},
		email: {
			type: String,
			required: true,
		},
		ticket: {
			type: Number,
			required: true,
			unique: true,
		},
		stopLoss: {
			type: Number,
			required: true,
		},
		closeTime: {
			type: Date,
			required: true,
		},
		profit: {
			type: Number,
			required: true,
		},
		emailSent: {
			type: Boolean,
			default: false,
		},
		isDisabled: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model("StopLossRisk", stopLossRiskSchema);
