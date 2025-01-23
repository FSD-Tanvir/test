const crypto = require('crypto');

const createReferralLink = (referralCode) => {
  const domain = 'https://yourdomain.com';
  return `${domain}/?referralCode=${referralCode}`;
};



const generateReferralCode = () => {
  return crypto.randomBytes(4).toString('hex'); 
};


module.exports = {
    createReferralLink,
    generateReferralCode
}