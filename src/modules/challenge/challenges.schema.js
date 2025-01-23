const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the Phase schema
const phaseSchema = new Schema({
	maxDailyDrawdown: Number,
	maxDrawdown: Number,
	tradingPeriod: String,
	profitTarget: Number,
	minTradingDays: Number,
	newsTrading: Boolean,
	weekendHolding: Boolean,
	drawdownType: String,
	consistencyRule: Boolean,
	leverage: { type: Number, default: 1 },
	stage: { type: String },
});

// Define the State schema
const stateSchema = new Schema({
	phase1: { type: phaseSchema, default: null, required: false },
	phase2: { type: phaseSchema, default: null, required: false },
	funded: { type: phaseSchema, default: null, required: false },
});

// Define the Challenge schema
const challengeSchema = new Schema({
	challengeName: { type: String },
	challengeType: String,
	accountSize: Number,
	challengePrice: Number,
	platform: { type: String },
	broker: { type: String },
	status: {
		type: String,
		enum: ["active", "inActive"],
		default: "active",
	},
	refundable: Boolean,
	challengeStages: { type: stateSchema, default: null, required: false }, // Using stateSchema here
});

// Create the Challenge model
const MChallenge = mongoose.model("Challenge", challengeSchema);

module.exports = {
	MChallenge,
	challengeSchema,
};

// Post-find middleware to calculate max_daily_loss and max_loss dynamically
// challengeSchema.post("find", function (docs) {
// 	docs.forEach((doc) => {
// 		["state.phase1", "state.phase2", "state.phase3"].forEach((phase) => {
// 			const phaseDoc = doc.get(phase);
// 			if (phaseDoc) {
// 				if (doc.account_size && phaseDoc.max_daily_drawdown) {
// 					phaseDoc.max_daily_loss = doc.account_size * (phaseDoc.max_daily_drawdown / 100);
// 				}
// 				if (doc.account_size && phaseDoc.max_drawdown) {
// 					phaseDoc.max_loss = doc.account_size * (phaseDoc.max_drawdown / 100);
// 				}
// 			}
// 		});
// 	});
// });

// // Post-findOne middleware to calculate max_daily_loss and max_loss dynamically
// challengeSchema.post("findOne", function (doc) {
// 	if (doc) {
// 		["state.phase1", "state.phase2", "state.phase3"].forEach((phase) => {
// 			const phaseDoc = doc.get(phase);
// 			if (phaseDoc) {
// 				if (doc.account_size && phaseDoc.max_daily_drawdown) {
// 					phaseDoc.max_daily_loss = doc.account_size * (phaseDoc.max_daily_drawdown / 100);
// 				}
// 				if (doc.account_size && phaseDoc.max_drawdown) {
// 					phaseDoc.max_loss = doc.account_size * (phaseDoc.max_drawdown / 100);
// 				}
// 			}
// 		});
// 	}
// });
