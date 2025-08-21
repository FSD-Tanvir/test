
const mongoose = require("mongoose");

const newsTradingRiskSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        country: { type: String, required: true },
        date: { type: Date, required: true },
        impact: {
            type: String,
            enum: ["Low", "Medium", "High"],
            required: true,
        },
        forecast: { type: String, default: "" },
        previous: { type: String, default: "" },
    },
    { timestamps: true }
);

const MNewsTradingRisk = mongoose.model("NewsTradingRisk", newsTradingRiskSchema);

module.exports = { MNewsTradingRisk };





