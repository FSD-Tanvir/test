const express = require("express");
const router = express.Router();
const {
	createAffiliate,
	getAffiliateDataHandler,
	getAllAffiliatesHandler,
	updateAffiliateHandler,
	getAffiliate,
	getAllAffiliatesApprovedHandler,
	getAffiliateById
} = require("./affiliate.controller.js");

// Route to handle POST requests for creating an affiliate
router.post("/create", createAffiliate);

// Route to handle GET requests for all affiliates
router.get("/", getAllAffiliatesHandler);

router.get("/approved", getAllAffiliatesApprovedHandler);

// Route to handle GET requests for affiliate info
router.get("/affiliate-info/:email", getAffiliateDataHandler);

// Route to get affiliate by referral code
router.get('/:referralCode', getAffiliate);

router.get("/affiliate/:id", getAffiliateById);

// Route to handle PUT requests for updating an affiliate
router.put("/affiliate-update/:id", updateAffiliateHandler);

module.exports = router;
