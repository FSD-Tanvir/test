const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const affiliateSchema = new Schema({
    first: { type: String },
    last: { type: String },
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
        trim: true,
        default: function () {
            return `${this.first?.[0] || ''}${this.last?.[0] || ''}${Date.now().toString(36)}`.toUpperCase();
        }
    },
    referralLink: {
        type: String,
        trim: true
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
        trim: true,
    },
    percentage: {
        type: Number,
        default: 0,
        min: 0,
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
        default: "approved",
    },
    whatsAppNumber: {
        type: Number,
        trim: true,
        unique: true,
    },
}, {
    timestamps: true
});

// Pre-save hook to generate referralLink with the correct domain
affiliateSchema.pre('save', function (next) {
    this.referralLink = `https://foxx-funded.com/?referralCode=${this.referralCode}`;
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
