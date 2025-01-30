const mongoose = require("mongoose");
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
	platform: { type: String },
	broker: { type: String, default: null },
	status: {
		type: String,
		enum: ["active", "inActive"],
		default: "active",
	},
	challengeStages: { type: stateSchema, default: null, required: false }, // Using stateSchema here
});

const phase1_Offer_UUID = "1abefa9d-ed32-4c20-8ac6-a063ec4dd3e0";
const phase2_Offer_UUID = "0993bd75-3d53-4584-899e-202db24b75ec";
const funded_Offer_UUID = "dde5740b-c23e-4980-a616-eade125dc7bb";

// Create the Challenge model
const MChallenge = mongoose.model("Challenge", challengeSchema);

module.exports = {
	MChallenge,
	challengeSchema,
};
