const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const becomeAffiliateRequesterSchema = new Schema({
    fullName: { type: String },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        match: [/.+\@.+\..+/, 'Please fill a valid email address']
    },
    whatsAppNumber: {
        type: String,
        trim: true,
        unique: true,
        required: true,
    },
}, {
    timestamps: true
});


const MBecomeAffiliateRequester = mongoose.model('BecomeAffiliateRequester', becomeAffiliateRequesterSchema);
module.exports = MBecomeAffiliateRequester;
