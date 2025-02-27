const { Schema, default: mongoose } = require("mongoose");

const SevenDaysTradingChallengeSchema = new Schema({
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

const SevenDaysTradingChallenge = mongoose.model( "SevenDaysTradingChallenge", SevenDaysTradingChallengeSchema);
module.exports = SevenDaysTradingChallenge