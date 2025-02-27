// twoPercentRisk.schema.js
const mongoose = require("mongoose");

const twoPercentRiskSchema = new mongoose.Schema(
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
        date: {
            type: Date,
            required: true,
        },
        openTime: {
            type: Date,
            required: true,
        },
        profit: {
            type: Number,
            required: true,
        },
        ticket: {
            type: Number,
            required: true,
            unique: true,
        },
        emailSent: {
            type: Boolean,
            default: false,
        },
        emailCount: {
            type: Number,
            default: 0, // Track the number of emails sent
        },
        isDisabled: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("TwoPercentRisk", twoPercentRiskSchema);
