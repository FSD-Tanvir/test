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
    
    emailCount: {
        type: Number,
        default: 0, // Track the number of emails sent
    },
 isDisabled: {
        type: Boolean,
        default: false,
    },
    
},{ timestamps: true });

const SevenDaysTradingChallenge = mongoose.model( "SevenDaysTradingChallenge", SevenDaysTradingChallengeSchema);
module.exports = SevenDaysTradingChallenge