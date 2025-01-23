const affiliatePayoutService = require("../affiliatePayout/affiliatePayout.services.js");

// Controller function to handle creating a new payout
const createAffiliatePayout = async (req, res) => {
	try {
		const payoutData = req.body; // Assuming payout details are sent in the request body
		const createdPayout = await affiliatePayoutService.createAffiliatePayout(payoutData);
		return res.status(201).json({
			message: "Payout request successfully created",
			data: createdPayout,
		});
	} catch (error) {
		return res.status(400).json({
			message: "Failed to create payout request",
			error: error.message,
		});
	}
};

// Controller function to handle getting all payouts
const getAllAffiliatePayouts = async (req, res) => {
	try {
	  const { payouts, totalApprovedAmount } = await affiliatePayoutService.getAllAffiliatePayouts();
  
	  return res.status(200).json({
		message: "All payouts fetched successfully",
		data: payouts,            // Return all payout records
		totalApprovedAmount,      // Return total approved payout amount
	  });
	} catch (error) {
	  return res.status(500).json({
		message: "Failed to fetch payouts",
		error: error.message,
	  });
	}
  };
const getAllAffiliatePayoutsWithEmailHandler = async (req, res) => {
	try {
		const { email } = req.params;
		const payouts = await affiliatePayoutService.getAllAffiliatePayoutsWithEmail(email);
		return res.status(200).json({
			message: "All payouts fetched successfully",
			data: payouts,
		});
	} catch (error) {
		return res.status(500).json({
			message: "Failed to fetch payouts",
			error: error.message,
		});
	}
};

// Controller function to handle updating a payout by ID
const updateAffiliatePayoutById = async (req, res) => {
	try {
		const payoutId = req.params.id; // Get the ID from the request parameters
		const payoutData = req.body; // Get the updated data from the request body
		const updatedPayout = await affiliatePayoutService.updateAffiliatePayoutById(
			payoutId,
			payoutData
		);
		return res.status(200).json({
			message: "Payout updated successfully",
			data: updatedPayout,
		});
	} catch (error) {
		return res.status(400).json({
			message: "Failed to update payout",
			error: error.message,
		});
	}
};

module.exports = {
	createAffiliatePayout,
	getAllAffiliatePayouts,
	updateAffiliatePayoutById,
	getAllAffiliatePayoutsWithEmailHandler,
};
