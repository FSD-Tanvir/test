const mongoose = require("mongoose");

const consistencyBreakSchema = new mongoose.Schema(
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
		profit: {
			type: Number,
			required: true,
		},
		profitPercentage: {
			type: Number,
			required: true,
		},
		profitDifference: {
			type: Number,
			required: true,
		},
        profitLimit: {
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

module.exports = mongoose.model("ConsistencyBreak", consistencyBreakSchema);
