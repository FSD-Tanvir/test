
const express = require('express');
const { createAffiliateRequester } = require('./becomeAffiliateRequester.controller');
const router = express.Router();


router.post('/requester', createAffiliateRequester);

module.exports = router;
