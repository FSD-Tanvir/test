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
        emailCount: {
            type: Number,
            default: 0,
        },
        isDisabled: {
            type: Boolean,
            default: false,
        },
        lastEmailSentAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("StopLossRisk", stopLossRiskSchema);
