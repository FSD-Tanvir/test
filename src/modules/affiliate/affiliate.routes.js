const express = require("express");
const router = express.Router();
const {
	createAffiliate,
	clickUpdate,
	getAffiliateDataHandler,
	getAllAffiliatesHandler,
	updateAffiliateHandler,
	getAffiliate
} = require("./affiliate.controller.js");

router.post("/create", createAffiliate);
router.get("/", getAllAffiliatesHandler);
router.get("/affiliate-info/:email", getAffiliateDataHandler);
// Route to get affiliate by referral code
router.get('/:referralCode', getAffiliate);
router.get("/ref/:referralCode", clickUpdate);
router.put("/affiliate-update/:id", updateAffiliateHandler);

module.exports = router;
