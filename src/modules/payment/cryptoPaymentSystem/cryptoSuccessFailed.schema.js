const mongoose = require('mongoose');

const CryptoPaymentNotificationSchema = new mongoose.Schema({
    status: {
        type: String,
        required: true,
    },
    invoice_id: {
        type: String,
        required: true,
        unique: true,
    },
    amount_crypto: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        required: true,
    },
    order_id: {
        type: String,
        required: true,
    },
}, { timestamps: true });

const MCryptoPaymentNotification = mongoose.model('cryptoPaymentStatus', CryptoPaymentNotificationSchema);

module.exports = MCryptoPaymentNotification;
