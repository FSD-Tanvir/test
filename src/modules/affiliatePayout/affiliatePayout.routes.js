// affiliatePayoutRoutes.js
const express = require("express");
const {
	createAffiliatePayout,
	getAllAffiliatePayouts,
	updateAffiliatePayoutById,
	getAllAffiliatePayoutsWithEmailHandler,
	getAllAffiliatePayoutsController
} = require("./affiliatePayout.controller");
const router = express.Router();

// POST request to create a new payout
router.post("/payout", createAffiliatePayout);

// GET request to retrieve all affiliate payouts
router.get('/affiliate-payouts', getAllAffiliatePayoutsController);

// GET request to retrieve all payouts
router.get("/approved/payouts", getAllAffiliatePayouts);

router.get("/all-payouts/:email", getAllAffiliatePayoutsWithEmailHandler);

// PUT request to update a payout by ID
router.put("/payout/:id", updateAffiliatePayoutById);

module.exports = router;
