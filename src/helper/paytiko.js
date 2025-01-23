const crypto = require('crypto');
const config = require('../config/config');
const merchantSecret = config.paytiko_api_secret;
const generateSignature = (email, timestamp) => {
    return crypto.createHash('sha256').update(`${email};${timestamp};${merchantSecret}`).digest('hex');
};


const generateSignatureForPaytikoWebhook = (orderId) => {
    console.log("orderId", orderId);
  return crypto.createHash('sha256').update(`${merchantSecret}:${orderId}`).digest('hex');
};


module.exports = { generateSignature, generateSignatureForPaytikoWebhook};
