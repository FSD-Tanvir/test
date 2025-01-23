const express = require('express');
const router = express.Router();
const { createVeriffSessionController, handleVeriffWebhook, handleEventWebhook, verifiedUserController } = require('./verification.controller');

router.post('/create-session', createVeriffSessionController);
router.post('/webhook/event', handleEventWebhook);
router.post('/webhook/decision', handleVeriffWebhook);
router.get('/verified-user/:email', verifiedUserController);

module.exports = router;
