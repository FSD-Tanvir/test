// controllers/affiliate.controller.js
const affiliateService = require("./affiliate.services.js");
const { generateReferralCode, createReferralLink } = require("../../helper/autoGenerator.js");
const sendMail = require("../../helper/couponMailing.js");

const createAffiliate = async (req, res) => {
	const affiliateData = req.body;

	if (!affiliateData.email) {
		return res.status(400).json({ message: "Email is required." });
	}

	const referralCode = generateReferralCode();
	affiliateData.referralCode = referralCode;
	affiliateData.referralLink = createReferralLink(referralCode);

	try {
		const affiliate = await affiliateService.createAffiliate(affiliateData);
		res.status(201).json(affiliate);
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};
const getAffiliateDataHandler = async (req, res) => {
	const { email } = req.params;

	try {
		const affiliate = await affiliateService.getAffiliateData(email);
		res.status(201).json(affiliate);
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};

const getAllAffiliatesHandler = async (req, res) => {
	try {
		const affiliate = await affiliateService.getAllAffiliates();
		res.status(201).json(affiliate);
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};

const updateAffiliateHandler = async (req, res) => {
	try {
		const { id } = req.params;
		const affiliate = await affiliateService.updateAffiliate(id, req.body);
		res.status(201).json(affiliate);
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};

// Click update function to handle referral link click
const clickUpdate = async (req, res) => {
	const { referralCode } = req.params; // Get referralCode from the URL

	try {
		// Find the affiliate by referralCode and update the click count
		const updatedAffiliate = await affiliateService.clickUpdateByReferralCode(referralCode);

		// Log the click update (for debugging)
		console.log(`ReferralCode ${referralCode}: Click count updated to ${updatedAffiliate.click}`);

		// Redirect the user to the main site (or any other destination)
		res.redirect("https://summitstrike.com"); // Replace with your actual destination URL
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};

// Controller to get an affiliate by referral code
const getAffiliate = async (req, res) => {
    const { referralCode } = req.params;
    try {
        const affiliate = await affiliateService.getAffiliateByReferralCode(referralCode);
        res.status(200).json({
            success: true,
            data: affiliate
        });
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
	createAffiliate,
	clickUpdate,
	getAffiliateDataHandler,
	getAllAffiliatesHandler,
	updateAffiliateHandler,
	getAffiliate
};
