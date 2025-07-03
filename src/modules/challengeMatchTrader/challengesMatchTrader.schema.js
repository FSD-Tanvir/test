const mongoose = require("mongoose");
const { matchTraderConstant } = require("../../constants/commonConstants");
const Schema = mongoose.Schema;

// Define the Phase schema
const phaseSchema = new Schema({
	maxDailyDrawdown: Number, // Maximum Daily Loss
	maxDrawdown: Number, // Maximum Overall Loss
	tradingPeriod: String,
	profitTarget: Number,
	minTradingDays: Number,
	drawdownType: String,
	profitSpilt: String,
	payouts: Boolean,
	leverage: { type: Number, default: 100 },
	offerUUID: { type: String },
	stage: { type: String },
});

const stateSchema = new Schema({
	phase1: { type: phaseSchema, default: null, required: false },
	phase2: { type: phaseSchema, default: null, required: false },
	funded: { type: phaseSchema, default: null, required: false },
});

const challengeSchema = new Schema({
	challengeName: { type: String },
	challengeType: String,
	accountSize: Number,
	challengePrice: Number,
	platform: { type: String, default: matchTraderConstant },
	broker: { type: String, default: null },
	status: {
		type: String,
		enum: ["active", "inActive"],
		default: "active",
	},
	challengeStages: { type: stateSchema, default: null, required: false }, // Using stateSchema here
});

// Create the Challenge model
const MChallengeMatchTrader = mongoose.model("ChallengeMatchTrader", challengeSchema);

module.exports = {
	MChallengeMatchTrader,
	challengeSchema,
};
