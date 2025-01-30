const { sendEmailSingleRecipient } = require("../../helper/mailing");
const MAffiliatePayout = require("./affiliatePayout.schema");

// Function to create a new affiliate payout
const createAffiliatePayout = async (payoutData) => {
	try {
		const newPayout = new MAffiliatePayout(payoutData);
		const savedPayout = await newPayout.save();
		return savedPayout;
	} catch (error) {
		throw new Error(error.message);
	}
};

const getAllAffiliatePayouts = async () => {
	try {
		// Fetch only payouts with approved status
		const payouts = await MAffiliatePayout.find({ status: "approved" });

		// Calculate the total approved payout amount
		const totalApprovedAmount = payouts.reduce((sum, payout) => sum + (payout.amount || 0), 0);

		return { payouts, totalApprovedAmount };
	} catch (error) {
		throw new Error(error.message);
	}
};

// Function to update an affiliate payout by ID
const updateAffiliatePayoutById = async (id, payoutData) => {
	try {
		const updatedPayout = await MAffiliatePayout.findByIdAndUpdate(id, payoutData, {
			new: true, // Return the updated document
			runValidators: true, // Ensure the update follows the model validation rules
		});
		if (updatedPayout.status === "approved") {
			const htmlTemplate = `div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #DB8112; border-radius: 10px; background-color: #ffffff; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); text-align: center;">
		<div style="text-align: center; margin-bottom: 15px;">
		  <img src="https://fox-funded-front-end.vercel.app/assets/Fox%20Funded%20Logo-bG-Sd1aL.png" alt="Company Logo" style="max-width: 120px; height: auto;">
		</div>
                    <p>Dear ${updatedPayout.name},</p>
                            <p>Congratulations! We are pleased to inform you that your affiliate payout request has been approved! :)</p>
                            <p><strong>Affiliate payout Details:</strong></p>
                            <ul>
                                <li><strong>Date Requested:</strong> ${new Date(
																	updatedPayout.createdAt
																).toUTCString()}</li>
                                <li><strong>Email Address:</strong> ${updatedPayout.email}</li>
                                <li><strong>Withdrawn Amount:</strong> $${updatedPayout.amount.toFixed(
																	2
																)}</li>
                                <li><strong>Status:</strong> Approved</li>
                            </ul>
                            <div style="text-align: center; margin-bottom: 20px;">
		  <a href="https://foxx-funded.com/login" style="display: inline-block; padding: 12px 25px; background-color: #DB8112; color: #fff; text-decoration: none; border-radius: 5px; font-size: 18px; font-weight: bold;">
			Login to your affiliate account and see your affiliate payout details
		  </a>
		</div>
		<p style="font-size: 14px; color: #777; margin-top: 20px;">
		  If you have any questions, feel free to
		  <a href="https://foxx-funded.com/contact-us" style="color: #DB8112; text-decoration: none; font-weight: bold;">
			contact our support team
		  </a>.
		</p>
		
		 </div>
		 
		   <style>
		@media only screen and (max-width: 600px) {
		  div[style] {
			padding: 10px !important;
		  }
		  h2[style] {
			font-size: 22px !important;
		  }
		  p[style], a[style] {
			font-size: 16px !important;
		  }
		  a[style] {
			padding: 10px 20px !important;
		  }
		}
	  </style>
                        `;
			// Send the approval email
			await sendEmailSingleRecipient(
				updatedPayout.email,
				"Your affiliate payout request has been approved",
				htmlTemplate
			);
		} else if (updatedPayout.status === "rejected") {
			const htmlTemplate = `div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #DB8112; border-radius: 10px; background-color: #ffffff; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); text-align: center;">
		<div style="text-align: center; margin-bottom: 15px;">
		  <img src="https://fox-funded-front-end.vercel.app/assets/Fox%20Funded%20Logo-bG-Sd1aL.png" alt="Company Logo" style="max-width: 120px; height: auto;">
		</div>
                    <p>Dear ${updatedPayout.name},</p>
                            <p>Sorry to inform you that We are pleased to inform you that your affiliate payout request has been rejected! :)</p>
                            <p><strong>Affiliate payout Details:</strong></p>
                            <ul>
                                <li><strong>Date Requested:</strong> ${new Date(
																	updatedPayout.createdAt
																).toUTCString()}</li>
                                <li><strong>Email Address:</strong> ${updatedPayout.email}</li>
                                <li><strong>Withdrawn Amount:</strong> $${updatedPayout.amount.toFixed(
																	2
																)}</li>
                                <li><strong>Status:</strong> Rejected</li>
                            </ul>
                            <div style="text-align: center; margin-bottom: 20px;">
		  <a href="https://foxx-funded.com/login" style="display: inline-block; padding: 12px 25px; background-color: #DB8112; color: #fff; text-decoration: none; border-radius: 5px; font-size: 18px; font-weight: bold;">
			Login to your affiliate account and see your affiliate payout details
		  </a>
		</div>
		<p style="font-size: 14px; color: #777; margin-top: 20px;">
		  If you have any questions, feel free to
		  <a href="https://foxx-funded.com/contact-us" style="color: #DB8112; text-decoration: none; font-weight: bold;">
			contact our support team
		  </a>.
		</p>
		
		 </div>
		 
		   <style>
		@media only screen and (max-width: 600px) {
		  div[style] {
			padding: 10px !important;
		  }
		  h2[style] {
			font-size: 22px !important;
		  }
		  p[style], a[style] {
			font-size: 16px !important;
		  }
		  a[style] {
			padding: 10px 20px !important;
		  }
		}
	  </style>
                        `;

			// Send the rejection email
			await sendEmailSingleRecipient(
				updatedPayout.email,
				"Your affiliate payout request has been rejected",
				htmlTemplate
			);
		}
		if (!updatedPayout) {
			throw new Error("Payout not found");
		}
		return updatedPayout;
	} catch (error) {
		throw new Error(error.message);
	}
};

const getAllAffiliatePayoutsWithEmail = async (email) => {
	try {
		const payouts = await MAffiliatePayout.aggregate([
			{
				$match: {
					email,
					status: "approved",
				},
			},
			{
				$group: {
					_id: null,
					totalAmount: { $sum: "$amount" },
					payouts: { $push: "$$ROOT" },
				},
			},
		]);

		return payouts.length > 0 ? payouts[0] : { totalAmount: 0, payouts: [] };
	} catch (error) {
		throw new Error(error.message);
	}
};

// Service to get all affiliate payouts
const getAllAffiliatePayoutsData = async () => {
	try {
		return await MAffiliatePayout.find();
	} catch (error) {
		throw new Error(error.message);
	}
};

module.exports = {
	createAffiliatePayout,
	getAllAffiliatePayouts,
	updateAffiliatePayoutById,
	getAllAffiliatePayoutsWithEmail,
	getAllAffiliatePayoutsData,
};
