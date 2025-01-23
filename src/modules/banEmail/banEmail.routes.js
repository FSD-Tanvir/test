const express = require('express');
const { banEmailController,getAllBannedEmailsController } = require('./banEmail.controller');
const router = express.Router();


// POST route to ban an email
router.post('/', banEmailController);

// GET route to retrieve all banned emails
router.get('/all-banned-emails', getAllBannedEmailsController);

module.exports = router;