const mongoose = require("mongoose");

const lotSizeRiskSchema = new mongoose.Schema(
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
        lotSize: {
            type: Number,
            required: true,
        },
        lotSizeLimit: {
            type: Number,
            required: true,
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

module.exports = mongoose.model("LotSizeRisk", lotSizeRiskSchema);
