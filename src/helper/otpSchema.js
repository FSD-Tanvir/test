const mongoose = require('mongoose');

// Define the OTP schema
const otpSchema = new mongoose.Schema({
    email: { type: String, required: true },   // Email address to which the OTP is sent
    otp: { type: String, required: true },     // The OTP value
    expiresAt: { type: Date, required: true }, // Expiry date and time of the OTP
});

// Export the OTP model based on the schema
module.exports = mongoose.model('Otp', otpSchema);
