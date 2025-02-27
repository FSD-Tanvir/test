const { Schema, default: mongoose } = require("mongoose");

const sevenDaysTradingChallengeSchema = new Schema({
    email: { type: String, required: true },
    account: { type: Number, required: true },
    lastOpenTime: { type: Date },
    countdown: { type: Number, default: 0 },
    emailSent: {
        type: Boolean,
        default: false,
    },
    isDisabled: {
        type: Boolean,
        default: false,
    },
    
},{ timestamps: true });

module.exports = mongoose.model("SevenDaysTradingChallenge", sevenDaysTradingChallengeSchema);