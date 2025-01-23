

const express = require('express');
const { createCryptoCloudInvoiceController, CryptoCloudNotificationController } = require('./cryptoCloud.controller');


const router = express.Router();

router.post('/cryptoInvoice/create', createCryptoCloudInvoiceController );

// Route for handling POST requests from CRYPTO BACK notifications
router.post('/postback', CryptoCloudNotificationController);

module.exports = router;
