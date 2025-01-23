// src/routes/paytiko.routes.js
const express = require('express');
const { startCheckout, controllerPaytikoWebhook } = require('./paytiko.controller');
const router = express.Router();


router.post('/checkout', startCheckout);
router.post('/Webhook', controllerPaytikoWebhook);

module.exports = router;
