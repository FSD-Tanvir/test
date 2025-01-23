const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const affiliateSchema = new Schema({
    fullName: { type: String },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        match: [/.+\@.+\..+/, 'Please fill a valid email address']
    },
    tier: { type: String, default: 'Tier 1' },
    referralCode: {
        type: String,
        unique: true,
        trim: true
    },
    referralLink: {
        type: String,
        trim: true
    },
    click: {
        type: Number,
        default: 0,
        min: 0
    },
    lead: {
        numberLead: {
            type: Number,
            default: 0,
            min: 0
        },
        leadCollectionMail: [{
            type: String,
            trim: true,
            lowercase: true,
            match: [/.+\@.+\..+/, 'Please fill a valid email address']
        }]
    },
    totalNumberOfSales: {
        type: Number,
        default: 0,
        min: 0
    },
    totalSalesAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    couponName: {
        type: String,
        required: true,
        trim: true,
    },
    percentage: {
        type: Number,
        default: 0,
        min: 0, // Ensure percentage is within a valid range
    },
    commissionsAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    commissionsPercentage: {
        type: Number,
        default: 5
    },
    status: {
        type: String,
        enum: ["approved", "rejected", "pending"],
        default: "pending",
    },
}, {
    timestamps: true
});

// Pre-save hook to generate referralLink with the correct domain
affiliateSchema.pre('save', function (next) {
    // Automatically set referralLink using referralCode and your base domain
    this.referralLink = `https://summitstrike.com/?referralCode=${this.referralCode}`;

    // Commission calculation logic (as in your original code)
    if (this.totalNumberOfSales >= 1 && this.totalNumberOfSales <= 100 && this.commissionsPercentage <= 5) {
        this.commissionsAmount = (this.totalSalesAmount * this.commissionsPercentage) / 100;
    } else if (this.totalNumberOfSales >= 101 && this.totalNumberOfSales <= 200 && this.commissionsPercentage <= 10) {
        this.commissionsAmount = (this.totalSalesAmount * this.commissionsPercentage) / 100;
    } else {
        this.commissionsAmount = (this.totalSalesAmount * this.commissionsPercentage) / 100;
    }

    next();
});

const MAffiliate = mongoose.model('Affiliate', affiliateSchema);
module.exports = MAffiliate;
