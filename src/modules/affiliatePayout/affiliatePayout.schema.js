const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const affiliatePayoutSchema = new Schema(
    {
        name: { type: String },
        email: {
            type: String,
            required: [true, "Email is required"],
            match: [/^\S+@\S+\.\S+$/, "Email is invalid"],
        },
        amount: { type: Number },
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



// Create mongoose model for 'User' collection using UserSchema
const MAffiliatePayout = mongoose.model("AffiliatePayout", affiliatePayoutSchema);

module.exports = MAffiliatePayout;