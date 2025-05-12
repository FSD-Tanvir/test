// twoPercentRisk.schema.js
const mongoose = require("mongoose");



const newsTradingRiskAccountDetails = new mongoose.Schema(
    {
        email: {
            type: String,
            default: '',
        },
        account: {
            type: Number,
            default: null,
        },
        ticket: {
            type: Number,
            default: null,
        },
        openTime: {
            type: Date,
            default: null,
        },
        closeTime: {
            type: Date,
            default: null,
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
        message: {
            type: String,
            default: "",
        },
    }
)

const newsTradingRiskSchema = new mongoose.Schema(
    {
        newsTradingRiskAccountDetails: {
            type: [newsTradingRiskAccountDetails],
        },
        newsDate: {
            type: Date,
            required: true,
        },
        currency: {
            type: String,
            required: true,
        },
        heading: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

const MNewsTradingRisk = mongoose.model("NewsTradingRisk", newsTradingRiskSchema);

module.exports = { MNewsTradingRisk };





