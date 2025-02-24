const { sendEmailSingleRecipient } = require("../../helper/mailing");
const MWithDrawRequest = require("./withDrawRequests.schema");
const MUser = require("../users/users.schema");
const { userDetails, balanceDepositAndWithdrawal, orderHistories } = require("../../thirdPartyMt5Api/thirdPartyMt5Api");
const { updateLastDailyDataByMt5Account } = require("../breach/breach.services");

// Create a new withdrawal request
const createWithDrawRequestService = async (data) => {
	try {
		// Create a new withdrawal request
		const withdrawRequest = new MWithDrawRequest(data);
		const savedWithDrawRequest = await withdrawRequest.save();
		// Extract relevant data from the request
		const { accountNumber, email, name, amount } = data;
		const htmlTemplate = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #DB8112; border-radius: 10px; background-color: #ffffff; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); text-align: center;">
		<div style="text-align: center; margin-bottom: 15px;">
		  <img src="https://i.ibb.co.com/34qjbqp/Fox-Funded-Logo.png" alt="Company Logo" style="max-width: 120px; height: auto;">
		</div>
		<h2 style="color: #DB8112; text-align: center; margin-bottom: 20px;">Dear ${name},</h2>
		<p style="font-size: 16px; color: #333; text-align: center; margin-bottom: 10px;">
		  Your payout request has been successfully submitted with the following details:
		</p>
		<p style="font-size: 20px; color: #333; font-weight: bold; text-align: center; margin-bottom: 20px;">
		  Account Number: <span style="color: #DB8112; font-style: italic; font-size: 24px; text-decoration: underline dotted; font-weight: normal;">
			${accountNumber}
		  </span>
		</p>
		<p style="font-size: 16px; color: #333; text-align: center; margin-bottom: 10px;">
		  Email: <span style="color: #DB8112; font-weight: bold;">${email}</span>
		</p>
		</p>
		<p style="font-size: 16px; color: #333; margin-bottom: 5px; text-align: center;">
		  <strong>Payout Requested Amount:</strong> <span style="color: #DB8112; font-weight: bold;">${amount}</span>
		</p>
		<div style="text-align: center; margin-bottom: 20px;">
		  <a href="https://foxx-funded.com/sign-in" style="display: inline-block; padding: 12px 25px; background-color: #DB8112; color: #fff; text-decoration: none; border-radius: 5px; font-size: 18px; font-weight: bold;">
			Login to your account and see your payout status
		  </a>
		</div>
		<p style="font-size: 14px; color: #777; margin-top: 20px;">
		  Your Payout request will be Reviewed by admin Within 72 hours business day.
		</p>
		<p style="font-size: 14px; color: #777; margin-top: 20px;">
		  If you have any questions, feel free to
		  <a href="https://foxx-funded.com/contact-us" style="color: #DB8112; text-decoration: none; font-weight: bold;">
			contact our support team
		  </a>.
		</p>
		<div style="margin-top: 20px; text-align: center;">
		  <a href="https://t.me/+2QVq5aChxiBlOWFk" style="margin-right: 10px;">
			<img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUQ9pRZvmScqICRjNBvAHEjIawnL1erY-AcQ&s" alt="Telegram" style="width: 32px; height: 32px;">
		  </a>
		</div>
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

		if (savedWithDrawRequest) {
			await sendEmailSingleRecipient(
				email,
				`Your payout request has been successfully submitted Account-Number: ${accountNumber}`,
				htmlTemplate
			);
		}
		// Return the saved withdrawal request
		return savedWithDrawRequest;
	} catch (error) {
		// Log the error for debugging
		console.error("Error creating withdrawal request:", error);
		throw new Error(error.message);
	}
};

// Fetch a single withdrawal request by accountNumber
const getWithDrawRequestByAccountNumberService = async (accountNumber) => {
	try {
		const withdrawRequest = await MWithDrawRequest.findOne({ accountNumber });
		return withdrawRequest;
	} catch (error) {
		throw new Error(error.message);
	}
};

// Fetch all withdrawal requests
const getAllWithDrawRequestsService = async () => {
	try {
		// Fetch all withdrawal requests
		const withdrawRequests = await MWithDrawRequest.find();

		// Process each withdrawal request to fetch the productName from the User collection
		const enrichedWithdrawRequests = await Promise.all(
			withdrawRequests.map(async (request) => {
				// Find the user by accountNumber
				const user = await MUser.findOne(
					{ "mt5Accounts.account": request.accountNumber },
					{ "mt5Accounts.$": 1 } // Only fetch the matched mt5Account
				);

				// Extract the challengeName from the user's mt5Account data
				const productName =
					user?.mt5Accounts?.[0]?.challengeStageData?.challengeName || "Unknown Product";

				// Add the productName to the withdrawal request data
				return {
					...request._doc, // Spread the withdrawal request data
					productName, // Add the product name
				};
			})
		);

		return enrichedWithdrawRequests;
	} catch (error) {
		throw new Error(error.message);
	}
};

// Fetch all withdrawal requests by email
const getAllWithDrawRequestsByEmailService = async (email) => {
	try {
		const withdrawRequests = await MWithDrawRequest.find({ email });
		return withdrawRequests;
	} catch (error) {
		throw new Error(error.message);
	}
};

const updateWithDrawRequestByIdService = async (id, updateData) => {
	// console.log(updateData);
	try {
		// Find the withdrawal request by _id
		const withdrawRequest = await MWithDrawRequest.findById(id);

		if (!withdrawRequest) {
			throw new Error("Withdrawal request not found.");
		}

		// Check if the status is being updated to "approved" from "pending"
		if (updateData.status === "approved") {
			const currentBalance = updateData.amount;
			// Assuming balanceDepositAndWithdrawal is defined elsewhere
			const accountData = await balanceDepositAndWithdrawal(
				withdrawRequest.accountNumber,
				-currentBalance,
			);

			// Check if accountData is a number
			if (typeof accountData === "number") {
				const userDetail = await userDetails(withdrawRequest.accountNumber); // Fetch user details
				const balance = userDetail.balance;
				await updateLastDailyDataByMt5Account(
					withdrawRequest.accountNumber,
					balance,
					balance,
					balance,
				);

				// Update the withdraw request with the new status
				withdrawRequest.status = "approved"; // Setting status to approved
			} else {
				throw new Error("Failed to update balance.");
			}
		}

		// Update other fields regardless of the status update
		Object.assign(withdrawRequest, updateData);

		// Save the updated withdrawal request back to the database
		const updatedWithDrawRequest = await withdrawRequest.save();

		const { name, email, amount, paymentMethod, comment } =
			updatedWithDrawRequest;
		if (updatedWithDrawRequest.status === "approved") {
			const emailSubject = `Withdrawal Request Approved - Account ${withdrawRequest.accountNumber}`;
			const emailBody = `
                            <p>Dear ${name},</p>
                            <p>Congratulations! We are pleased to inform you that your withdrawal has been approved!</p>
                            <p><strong>Payout details here:</strong></p>
                            <ul>
                                <li><strong>Date Requested:</strong> ${new Date(
				updatedWithDrawRequest.createdAt
			).toUTCString()}</li>
                                <li><strong>MetaTrader Account:</strong> ${withdrawRequest.accountNumber
				}</li>
                                <li><strong>Withdrawn Amount:</strong> $${amount.toFixed(
					2
				)}</li>
                                <li><strong>Status:</strong> Approved</li>
                            </ul>
                            <p>While your trading account is currently disabled, we would appreciate it if you could upload your payout proof on our Discord or any social media, after which your account will be re-enabled for trading.
As a broker-backed prop firm, we’re excited to offer a new feature: you can now directly deposit your SSC payout into our own broker, Haven Capital, instantly. Enjoy the benefits of trading with our broker’s top-tier conditions, designed to enhance your trading experience.
Please note, after your first withdrawal, you may request your next payout as soon as you place your next trade. For more details, please visit your account dashboard.  </p>
                            <br>
                            <p>Please note, after your first withdrawal, you can request your next withdrawal 14 days after your    next trade is placed. To check your trading and withdrawal history, please visit your account dashboard.</p>
                            <p>Thank you for choosing Summit Strike!</p>
                            <p>Best regards,<br>The Summit Strike Team</p>
                        `;
			// Send the approval email
			await sendEmailSingleRecipient(

				email,
				emailSubject,
				"Your withdrawal request has been approved",
				emailBody,
			);
		} else if (updatedWithDrawRequest.status === "rejected") {
			const emailSubject = `Withdrawal Request Rejected - Account ${withdrawRequest.accountNumber}`;
			const emailBody = `
                            <p>Dear ${name},</p>
                            <p>We regret to inform you that your withdrawal request has been rejected due to the following reason:</p>
                            <p><strong>Reason:</strong> ${comment}</p>
                            <p><strong>Withdrawal Details:</strong></p>
                            <ul>
                                <li><strong>Date Requested:</strong> ${new Date(updatedWithDrawRequest.createdAt).toUTCString()}</li>
                                <li><strong>MetaTrader Account:</strong> ${withdrawRequest.accountNumber}</li>
                                <li><strong>Withdrawn Amount:</strong> $${traderSplit.toFixed(2)}</li>
                                <li><strong>Payout Method:</strong> ${paymentMethod}</li>
                                <li><strong>Status:</strong> Rejected</li>
                            </ul>
                            <p>Please correct the issue noted above, and you can either resubmit your withdrawal or continue trading.</p>
                            <p>If you have any questions, feel free to reach out to <a href="mailto:support@summitstrike.com">support@summitstrike.com</a>.</p>
                            <p>Best regards,<br>The Summit Strike Team</p>
                        `;

			// Send the rejection email
			await sendEmailSingleRecipient(
				email,
				emailSubject,
				"Your withdrawal request has been rejected",
				emailBody,
			);
		}

		return updatedWithDrawRequest;
	} catch (error) {
		// Handle errors
		throw new Error(error.message);
	}
};

// Fetch a single withdrawal request by ID

const getWithDrawRequestByIdService = async (id) => {
	try {
		const withdrawRequest = await MWithDrawRequest.findById(id);
		return withdrawRequest;
	} catch (error) {
		console.error("Database query error:", error);
		throw new Error(error.message);
	}
};

// Fetch all withdrawal requests by email and status 'approved'
const getAllApprovedWithDrawRequestsByEmailService = async (email) => {
	try {
		// Fetch only based on email and approved status
		const withdrawRequests = await MWithDrawRequest.find({
			email,
			status: "approved",
		});
		return withdrawRequests;
	} catch (error) {
		throw new Error(error.message);
	}
};
// Fetch all withdrawal requests by email and status 'pending'
const getAllPendingWithDrawRequestsByEmailService = async (email) => {
	try {
		// Fetch only based on email and approved status
		const withdrawRequests = await MWithDrawRequest.find({
			email,
			status: "pending",
		});
		return withdrawRequests;
	} catch (error) {
		throw new Error(error.message);
	}
};

// Fetch all withdrawal requests by email and status 'approved'
const getAllPayoutsWithDrawRequestsByEmailService = async (email, page, limit) => {
	try {
		// Calculate pagination details
		const skip = (page - 1) * limit;

		// Fetch only based on email with pagination and approved status
		const withdrawRequests = await MWithDrawRequest.find({ email })
			.skip(skip)
			.limit(parseInt(limit));

		// Get total number of records for the email to calculate total pages
		const total = await MWithDrawRequest.countDocuments({ email });

		return {
			approvedRequests: withdrawRequests,
			total,
			totalPages: Math.ceil(total / limit),
		};
	} catch (error) {
		throw new Error(error.message);
	}
};

const getOrderHistory = async (account, startDate, endDate) => {

	try {
		const response = await orderHistories(account, startDate, endDate);
		console.log(response);
		return response;

	} catch (error) {
		throw new Error(error.message);
	}
}

const getAllApprovedRequester = async () => {
	try {
		const approvedRequests = await MWithDrawRequest.find({ status: "approved" });
		// Calculate the total amount of approved withdrawal requests
		const totalApprovedAmount = approvedRequests.reduce((total, request) => {
			return total + (request.amount || 0); // Safeguard in case amount is undefined/null
		}, 0);

		return {
			approvedRequests,
			totalLength: approvedRequests.length,
			totalApprovedAmount,
		};
	} catch (error) {
		throw new Error("Error fetching approved withdrawal requests: " + error.message);
	}
};
const getAllPendingRequester = async () => {
	try {
		const pendingRequests = await MWithDrawRequest.find({ status: "pending" });
		const totalPendingAmount = pendingRequests.reduce((total, request) => {
			return total + (request.amount || 0); // Safeguard in case amount is undefined/null
		}, 0);
		return {
			pendingRequests,
			totalLength: pendingRequests.length,
			totalPendingAmount,
		};
	} catch (error) {
		throw new Error("Error fetching pending withdrawal requests: " + error.message);
	}
};

module.exports = {
	createWithDrawRequestService,
	getWithDrawRequestByAccountNumberService,
	getAllWithDrawRequestsService,
	getAllWithDrawRequestsByEmailService,
	updateWithDrawRequestByIdService,
	getWithDrawRequestByIdService,
	getAllApprovedWithDrawRequestsByEmailService,
	getAllPayoutsWithDrawRequestsByEmailService,
	getAllPendingWithDrawRequestsByEmailService,
	getOrderHistory,
	getAllApprovedRequester,
	getAllPendingRequester,
};
