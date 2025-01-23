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

// Function to get all affiliate payouts
const getAllAffiliatePayouts = async () => {
	try {
	  // Fetch all payouts
	  const payouts = await MAffiliatePayout.find();
  
	  // Calculate the total approved payout amount
	  const totalApprovedAmount = payouts
		.filter((payout) => payout.status === "approved")
		.reduce((sum, payout) => sum + (payout.amount || 0), 0);
  
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
			const emailSubject = `Withdrawal Request Approved - Account ${updatedPayout.email}`;
			const emailBody = `
                            <p>Dear ${updatedPayout.name},</p>
                            <p>Congratulations! We are pleased to inform you that your withdrawal request has been received! :)</p>
                            <p><strong>Withdrawal Details:</strong></p>
                            <ul>
                                <li><strong>Date Requested:</strong> ${new Date(
																	updatedPayout.createdAt
																).toUTCString()}</li>
                                <li><strong>MetaTrader Account:</strong> ${updatedPayout.email}</li>
                                <li><strong>Withdrawn Amount:</strong> $${updatedPayout.amount.toFixed(
																	2
																)}</li>
                                <li><strong>Status:</strong> Approved</li>
                            </ul>
                            <p>Your trading account is still disabled, please upload your payout proof in the payout section of discord and your account will be enabled back for trading.  </p>
                            <br>
                            <p>Please note, after your first withdrawal, you can request your next withdrawal 14 days after your    next trade is placed. To check your trading and withdrawal history, please visit your account dashboard.</p>
                            <p>Thank you for choosing Summit Strike!</p>
                            <p>Best regards,<br>The Summit Strike Team</p>
                        `;
			// Send the approval email
			await sendEmailSingleRecipient(
				updatedPayout.email,
				emailSubject,
				"Your affiliate withdrawal request has been approved",
				emailBody
			);
		} else if (updatedPayout.status === "rejected") {
			const emailSubject = `Withdrawal Request Rejected - Account ${updatedPayout.email}`;
			const emailBody = `
                            <p>Dear ${updatedPayout.name},</p>
                            <p>We regret to inform you that your affiliate withdrawal request has been rejected due to the following reason:</p>
                            <p><strong>Reason:</strong> ${updatedPayout.comment}</p>
                            <p><strong>Withdrawal Details:</strong></p>
                            <ul>
                                <li><strong>Date Requested:</strong> ${new Date(
																	updatedPayout.createdAt
																).toUTCString()}</li>
                                <li><strong>Withdrawn Amount:</strong> $${updatedPayout.amount.toFixed(
																	2
																)}</li>
                                <li><strong>Payout Method:</strong> ${
																	updatedPayout.paymentMethod
																}</li>
                                <li><strong>Status:</strong> Rejected</li>
                            </ul>
                            <p>Please correct the issue noted above, and you can either resubmit your affiliate withdrawal .</p>
                            <p>If you have any questions, feel free to reach out to <a href="mailto:support@summitstrike.com">support@summitstrike.com</a>.</p>
                            <p>Best regards,<br>The Summit Strike Team</p>
                        `;

			// Send the rejection email
			await sendEmailSingleRecipient(
				updatedPayout.email,
				emailSubject,
				"Your affiliate withdrawal request has been rejected",
				emailBody
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
					_id: null, // We are not grouping by any field, just aggregating
					totalAmount: { $sum: "$amount" },
					payouts: { $push: "$$ROOT" }, // Push all documents into an array
				},
			},
		]);

		return payouts.length > 0 ? payouts[0] : { totalAmount: 0, payouts: [] };
	} catch (error) {
		throw new Error(error.message);
	}
};

module.exports = {
	createAffiliatePayout,
	getAllAffiliatePayouts,
	updateAffiliatePayoutById,
	getAllAffiliatePayoutsWithEmail,
};
