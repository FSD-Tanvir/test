const MBecomeAffiliateRequester = require("./becomeAffiliateRequester.schema");


const createRequester = async (data) => {
    const newRequester = new MBecomeAffiliateRequester(data);
    return await newRequester.save();
};

module.exports = { createRequester };
