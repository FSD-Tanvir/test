const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const WithDrawRequestSchema = new Schema(
    {
        name: { type: String },
        email: {
            type: String,
            required: [true, "Email is required"],
            match: [/^\S+@\S+\.\S+$/, "Email is invalid"],
        },
        accountNumber: { type: Number },
        amount: { type: Number },
        percentage: { type: Number, default: 0 },
        platformSplit: { type: Number, default: 0 },
        traderSplit: { type: Number, default: 0 },
        riskDeduction: { type: Number, default: 0 },
        afterRiskDeduction: { type: Number, default: 0 },
        paymentMethod: { type: String },
        bankName: { type: String },
        bankAccountNumber: { type: Number },
        iban: { type: String },
        bicn: { type: String },
        ustd: { type: String },
        comment: { type: String },
        status: {
            type: String,
            enum: ["approved", "rejected", "pending"],
            default: "pending",
        },
    },
    { timestamps: true }
)



const MWithDrawRequest = mongoose.model("WithDrawRequest", WithDrawRequestSchema);

module.exports = MWithDrawRequest;
