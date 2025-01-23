const express = require('express');
const { getRetData, getCorData, redirectToBank, getCallbackResponse, callbackResponse } = require('./zenPayment.controller');
const router = express.Router();


router.get('/ret', getRetData);
router.get('/cor', getCorData);
router.post('/redirectUrl', redirectToBank);
router.post('/payment-callback', callbackResponse);

module.exports = router;