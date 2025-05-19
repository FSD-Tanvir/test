// withdrawRequestController.js

// const { getUniqueTradingDays } = require("../../helper/utils/dateUtils");
const { getUniqueTradingDays } = require("../../helper/utils/payoutDateItilis");
const { accountDetails } = require("../../thirdPartyMt5Api/thirdPartyMt5Api");
const MWithDrawRequest = require("./withDrawRequests.schema");
const {
	createWithDrawRequestService,
	getWithDrawRequestByAccountNumberService,
	getAllWithDrawRequestsService,
	updateWithDrawRequestByIdService,
	getWithDrawRequestByIdService,
	getAllApprovedWithDrawRequestsByEmailService,
	getAllPayoutsWithDrawRequestsByEmailService,
	getAllPendingWithDrawRequestsByEmailService,
	// getOrderHistory,
	getAllApprovedRequester,
	getAllPendingRequester,
	getOrderHistory,
} = require("./withDrawRequests.services");

// Handle POST request to create a new withdrawal request
const createWithDrawRequest = async (req, res) => {
	console.log(req.body);
	try {
		const {
			email,
			accountNumber,
			amount,
			paymentMethod,
			bankName,
			bankAccountNumber,
			iban,
			bicn,
			ustd,
			comment,
		} = req.body;

		// Validate required fields
		if (!email || !amount || !paymentMethod || !accountNumber) {
			return res.status(400).json({
				message:
					"Email, amount, payment method, and account number are required.",
			});
		}

		// Call service to create the request
		const newWithDrawRequest = await createWithDrawRequestService(req.body);

		// Check if the request was created successfully
		if (newWithDrawRequest && newWithDrawRequest._id) {
			const id = newWithDrawRequest._id;
			const updatedData = newWithDrawRequest;
			const updatedWithdrawRequest = await updateWithDrawRequestByIdService(
				id,
				updatedData,
			);
			// console.log(updatedWithdrawRequest);

			return res.status(201).json({
				data: updatedWithdrawRequest,
			});
		} else {
			return res
				.status(400)
				.json({ message: "Failed to create withdrawal request." });
		}
	} catch (error) {
		res.status(500).json({
			message: "Error creating withdrawal request",
			error: error.message,
		});
	}
};

// Handle GET request to fetch a single withdrawal request by accountNumber
const getWithDrawRequestByAccountNumber = async (req, res) => {
	try {
		const { accountNumber } = req.params;

		// Check if accountNumber is provided
		if (!accountNumber) {
			return res.status(400).json({ message: "Account number is required." });
		}

		// Call service to get the request
		const withdrawRequest =
			await getWithDrawRequestByAccountNumberService(accountNumber);

		if (!withdrawRequest) {
			return res.status(404).json({ message: "Withdrawal request not found." });
		}

		res.status(200).json({
			message: "Withdrawal request fetched successfully",
			data: withdrawRequest,
		});
	} catch (error) {
		res.status(500).json({
			message: "Error fetching withdrawal request",
			error: error.message,
		});
	}
};

// Handle GET request to fetch all withdrawal requests
const getAllWithDrawRequests = async (req, res) => {
	try {
		// Call the service to get all enriched withdrawal requests
		const withdrawRequests = await getAllWithDrawRequestsService();

		if (!withdrawRequests.length) {
			return res.status(404).json({ message: "No withdrawal requests found." });
		}

		res.status(200).json({
			message: "All withdrawal requests fetched successfully",
			data: withdrawRequests,
		});
	} catch (error) {
		res.status(500).json({
			message: "Error fetching withdrawal requests",
			error: error.message,
		});
	}
};




// Handle PATCH/PUT request to update a withdrawal request by _id
const updateWithDrawRequestById = async (req, res) => {
	try {
		const { id } = req.params;
		const updateData = req.body;

		// Validate if the _id is provided
		if (!id) {
			return res.status(400).json({ message: "ID is required." });
		}

		// Call service to update the request
		const updatedWithDrawRequest = await updateWithDrawRequestByIdService(
			id,
			updateData,
		);

		if (!updatedWithDrawRequest) {
			return res.status(404).json({ message: "Withdrawal request not found." });
		}

		res.status(200).json({
			message: "Withdrawal request updated successfully",
			data: updatedWithDrawRequest,
		});
	} catch (error) {
		res.status(500).json({
			message: "Error updating withdrawal request",
			error: error.message,
		});
	}
};

// Handle GET request to fetch a single withdrawal request by ID
const getWithDrawRequestById = async (req, res) => {
	try {
		const { id } = req.params;

		// Check if ID is provided
		if (!id) {
			return res.status(400).json({ message: "ID is required." });
		}

		// Call service to get the request
		const withdrawRequest = await getWithDrawRequestByIdService(id);

		if (!withdrawRequest) {
			return res.status(404).json({ message: "Withdrawal request not found." });
		}

		res.status(200).json({
			message: "Withdrawal request fetched successfully",
			data: withdrawRequest,
		});
	} catch (error) {
		res.status(500).json({
			message: "Error fetching withdrawal request",
			error: error.message,
		});
	}
};

const getApprovedAccountByNumber = async (req, res) => {
	const { accountNumber } = req.params; // Get accountNumber from route parameters

	try {
		const approvedAccounts = await MWithDrawRequest.find({
			status: "approved",
			accountNumber: parseInt(accountNumber), // Match both status and account number
		});

		if (approvedAccounts.length === 0) {
			return res.status(200).json([]);
		}

		res.status(200).json(approvedAccounts); // Return all approved entries for the account
	} catch (error) {
		res.status(500).json({ message: "Error retrieving accounts", error });
	}
};


// Handle GET request to fetch all approved withdrawal requests by email
const getAllApprovedWithDrawRequestsByEmail = async (req, res) => {
	try {
		const { email } = req.params;

		// Check if the email is provided
		if (!email) {
			return res.status(400).json({ message: "Email is required." });
		}

		// Fetch approved requests by email
		const approvedRequests =
			await getAllApprovedWithDrawRequestsByEmailService(email);

		if (!approvedRequests.length) {
			return res.status(404).json({
				message: "No approved withdrawal requests found for this email.",
			});
		}

		res.status(200).json({
			message: "Approved withdrawal requests fetched successfully",
			data: approvedRequests,
		});
	} catch (error) {
		res.status(500).json({
			message: "Error fetching approved withdrawal requests",
			error: error.message,
		});
	}
};
const getAllPendingWithDrawRequestsByEmail = async (req, res) => {
	try {
		const { email } = req.params;

		// Check if the email is provided
		if (!email) {
			return res.status(400).json({ message: "Email is required." });
		}

		// Fetch approved requests by email
		const approvedRequests =
			await getAllPendingWithDrawRequestsByEmailService(email);

		if (!approvedRequests.length) {
			return res.status(404).json({
				message: "No pending withdrawal requests found for this email.",
			});
		}

		res.status(200).json({
			message: "Pending withdrawal requests fetched successfully",
			data: approvedRequests,
		});
	} catch (error) {
		res.status(500).json({
			message: "Error fetching approved withdrawal requests",
			error: error.message,
		});
	}
};

const getAllPayoutsWithDrawRequestsByEmail = async (req, res) => {
	try {
		const { email } = req.params;
		const { page = 1, limit = 10 } = req.query; // Default to page 1 and limit 10 if not provided

		// Check if the email is provided
		if (!email) {
			return res.status(400).json({ message: "Email is required." });
		}

		// Fetch approved requests by email with pagination
		const { approvedRequests, total, totalPages } =
			await getAllPayoutsWithDrawRequestsByEmailService(email, page, limit);

		if (!approvedRequests.length) {
			return res.status(404).json({
				message: "No approved withdrawal requests found for this email.",
			});
		}

		res.status(200).json({
			message: "Approved withdrawal requests fetched successfully",
			data: approvedRequests,
			total,
			page: parseInt(page),
			limit: parseInt(limit),
			totalPages,
		});
	} catch (error) {
		res.status(500).json({
			message: "Error fetching approved withdrawal requests",
			error: error.message,
		});
	}
};

const getPayoutRequestHandler = async (req, res) => {
	const { accountNumber } = req.params; // Get accountNumber from route parameters

	try {
		const latestApprovedAccount = await MWithDrawRequest.findOne({
			accountNumber: parseInt(accountNumber), // Match both status and account number
		})
			.sort({ createdAt: -1 }) // Sort by createdAt in descending order
			.exec();

		if (!latestApprovedAccount) {
			return res.status(200).json([]); // Return an empty array if no document is found
		}

		res.status(200).json(latestApprovedAccount); // Return the latest document
	} catch (error) {
		res.status(500).json({ message: "Error retrieving accounts", error });
	}
};



// const getOrderHistoryController = async (req, res) => {
// 	const { account, startDate, endDate } = req.query;

// 	try {
// 		const orderHistory = await getOrderHistory(account, startDate, endDate);

// 		if (!orderHistory || orderHistory.length === 0) {
// 			return res.status(200).json({
// 				success: true,
// 				message: "No trade history found.",
// 			});
// 		}

// 		const approvedAcc = await MWithDrawRequest.findOne({
// 			accountNumber: account,
// 			status: "approved",
// 		});

// 		const uniqueTradeDates = getUniqueTradingDays(orderHistory, true);
// 		console.log("Unique Trade Dates:", uniqueTradeDates);
// 		const tradingLimit = approvedAcc ? 7 : 14;

// 		// Only check for reset if current trading days reached the limit
// 		if (uniqueTradeDates.length >= tradingLimit) {
// 			const referenceDate = new Date(uniqueTradeDates[tradingLimit - 1]); // 7th or 14th trade date
// 			referenceDate.setDate(referenceDate.getDate() + 1); // 1 day after threshold

// 			const today = new Date();

// 			// Only reset if current date is at least 1 day past the threshold date
// 			if (today >= referenceDate) {
// 				const filteredTrades = orderHistory.filter((trade) => {
// 					const tradeTime = new Date(trade.openTime);
// 					return tradeTime >= referenceDate;
// 				});

// 				const recalculatedDays = getUniqueTradingDays(filteredTrades);
// 				console.log("Recalculated Days:", recalculatedDays);

// 				if (recalculatedDays === 0) {
// 					return res.status(200).json({
// 						success: true,
// 						message: "No open trades found for this account.",
// 						reset: true,
// 					});
// 				}

// 				return res.status(200).json({
// 					success: true,
// 					openTradeDays: recalculatedDays,
// 					reset: true,
// 				});
// 			}
// 		}

// 		// No reset, just return current count
// 		return res.status(200).json({
// 			success: true,
// 			openTradeDays: uniqueTradeDates.length,
// 			reset: false,
// 		});

// 	} catch (error) {
// 		return res.status(500).json({
// 			success: false,
// 			message: error.message,
// 		});
// 	}
// };






// const getOrderHistoryController = async (req, res) => {
// 	const { account, startDate, endDate } = req.query;

// 	try {
// 		// First check if there's any approved withdrawal request for this account
// 		const latestWithdrawal = await MWithDrawRequest.findOne({
// 			accountNumber: account,
// 			status: 'approved'
// 		}).sort({ updatedAt: -1 }); // Get the most recent approved withdrawal

// 		const orderHistory = await getOrderHistory(account, startDate, endDate);

// 		if (!orderHistory || orderHistory.length === 0) {
// 			return res.status(200).json({
// 				success: true,
// 				message: "No trade history found.",
// 			});
// 		}

// 		// Get sorted unique trade dates from the entire history
// 		const uniqueTradeDates = getUniqueTradingDays(orderHistory, true);

// 		// If there's an approved withdrawal, reset counting from the approval date
// 		if (latestWithdrawal) {
// 			const approvalDate = new Date(latestWithdrawal.updatedAt);
// 			approvalDate.setDate(approvalDate.getDate() + 1); // Start counting from next day

// 			// Filter trades that occurred after the withdrawal approval date
// 			const postApprovalTrades = orderHistory.filter((trade) => {
// 				const tradeTime = new Date(trade.openTime);
// 				return tradeTime >= approvalDate;
// 			});

// 			const tradingDaysSinceApproval = getUniqueTradingDays(postApprovalTrades);

// 			// Calculate remaining days (7 days minus days traded since approval)
// 			const remainingDays = Math.max(0, 7 - tradingDaysSinceApproval);

// 			return res.status(200).json({
// 				success: true,
// 				openTradeDays: tradingDaysSinceApproval,
// 				remainingDaysUntilEligibility: remainingDays,
// 				reset: true,
// 				resetDate: latestWithdrawal.updatedAt,
// 				message: remainingDays === 0 ?
// 					"Eligible for withdrawal (7 days passed since last approval)" :
// 					`${remainingDays} more trading days needed before next withdrawal`
// 			});
// 		}

// 		// If no approved withdrawal, apply the 14-day rule
// 		if (uniqueTradeDates.length >= 14) {
// 			const cutoffDate = new Date(uniqueTradeDates[13]); // 14th date
// 			cutoffDate.setDate(cutoffDate.getDate() + 1); // Day after the 14th

// 			// Filter trades after the cutoff date (reset point)
// 			const filteredTrades = orderHistory.filter((trade) => {
// 				const tradeTime = new Date(trade.openTime);
// 				return tradeTime >= cutoffDate;
// 			});

// 			const tradingDaysSinceReset = getUniqueTradingDays(filteredTrades);

// 			// Calculate remaining days (7 days minus days traded since reset)
// 			const remainingDays = Math.max(0, 7 - tradingDaysSinceReset);

// 			return res.status(200).json({
// 				success: true,
// 				openTradeDays: tradingDaysSinceReset,
// 				remainingDaysUntilEligibility: remainingDays,
// 				reset: true,
// 				resetDate: cutoffDate,
// 				message: remainingDays === 0 ?
// 					"Eligible for withdrawal (7 days passed since 14-day mark)" :
// 					`${remainingDays} more trading days needed before withdrawal eligibility`
// 			});
// 		}

// 		// If less than 14 days and no withdrawals, return current count
// 		const remainingDays = Math.max(0, 14 - uniqueTradeDates.length);
// 		return res.status(200).json({
// 			success: true,
// 			reset: false,
// 			openTradeDays: uniqueTradeDates.length,
// 			remainingDaysUntilEligibility: remainingDays,
// 			message: `${remainingDays} more trading days needed to reach 14-day threshold`
// 		});

// 	} catch (error) {
// 		return res.status(500).json({
// 			success: false,
// 			message: error.message,
// 		});
// 	}
// };

const getOrderHistoryController = async (req, res) => {
	const { account, startDate, endDate } = req.query;

	try {
		const orderHistory = await getOrderHistory(account, startDate, endDate);

		if (!orderHistory || orderHistory.length === 0) {
			return res.status(200).json({
				success: true,
				message: "No trade history found.",
			});
		}

		const approvedAcc = await MWithDrawRequest.findOne({
			accountNumber: account,
			status: "approved",
		});

		let filteredOrderHistory = orderHistory;

		// If approved, only consider trades after approval time
		let approvalTime = null;
		if (approvedAcc) {
			approvalTime = new Date(approvedAcc.updatedAt);
			filteredOrderHistory = orderHistory.filter(trade => new Date(trade.openTime) >= approvalTime);
		}

		const uniqueTradeDates = getUniqueTradingDays(filteredOrderHistory, true);
		console.log("Unique Trade Dates:", uniqueTradeDates);

		const tradingLimit = approvedAcc ? 7 : 14;

		if (uniqueTradeDates.length >= tradingLimit) {
			const referenceDate = new Date(uniqueTradeDates[tradingLimit - 1]); // 7th trade day
			referenceDate.setDate(referenceDate.getDate() + 1); // 1 day after 7th

			const today = new Date();

			if (today >= referenceDate) {
				// Reset check: get trades done AFTER reference date
				const newTradesAfterLimit = orderHistory.filter(trade => {
					const tradeTime = new Date(trade.openTime);
					return tradeTime >= referenceDate;
				});

				const recalculatedDays = getUniqueTradingDays(newTradesAfterLimit, true);
				console.log("Recalculated Days:", recalculatedDays);

				if (recalculatedDays.length === 0) {
					return res.status(200).json({
						success: true,
						message: "No open trades found for this account.",
						reset: true,
					});
				}

				return res.status(200).json({
					success: true,
					openTradeDays: recalculatedDays.length,
					reset: true,
				});
			}
		}

		return res.status(200).json({
			success: true,
			openTradeDays: uniqueTradeDates.length,
			reset: false,
		});

	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

const getOrderHistoryControllerInstantFunding = async (req, res) => {
	const { account, startDate, endDate } = req.query;
	// console.log(account, startDate, endDate);
	try {
		// Call the service function
		const orderHistory = await getOrderHistory(account, startDate, endDate);

		// Send success response with order history data
		res.status(200).json({
			success: true,
			data: orderHistory
		});
	} catch (error) {
		// Send error response
		res.status(500).json({
			success: false,
			message: error.message
		});
	}
}




const getApprovedRequestsController = async (req, res) => {
	try {
		const result = await getAllApprovedRequester();
		res.status(200).json({
			message: "Approved withdrawal requests retrieved successfully",
			totalLength: result.totalLength,
			totalApprovedAmount: result.totalApprovedAmount,
			data: result.approvedRequests
		});
	} catch (error) {
		res.status(500).json({
			message: "Failed to retrieve approved withdrawal requests",
			error: error.message
		});
	}
}
const getPendingRequestsController = async (req, res) => {
	try {
		const result = await getAllPendingRequester();
		res.status(200).json({
			message: "Pending withdrawal requests retrieved successfully",
			totalLength: result.totalLength,
			totalPendingAmount: result.totalPendingAmount,
			data: result.pendingRequests
		});
	} catch (error) {
		res.status(500).json({
			message: "Failed to retrieve pending withdrawal requests",
			error: error.message
		});
	}
}

const getAccountDetailsController = async (req, res) => {
	const { account } = req.params;
	if (!account) {
		return res.status(400).json({ error: "Account number is required" });
	}

	const singleAccountDetails = await accountDetails(account);
	res.status(200).json(singleAccountDetails);
};


module.exports = {
	createWithDrawRequest,
	getWithDrawRequestByAccountNumber,
	getAllWithDrawRequests,
	updateWithDrawRequestById,
	getWithDrawRequestById,
	getApprovedAccountByNumber,
	getAllApprovedWithDrawRequestsByEmail,
	getPayoutRequestHandler,
	getAllPayoutsWithDrawRequestsByEmail,
	getAllPendingWithDrawRequestsByEmail,
	getOrderHistoryController,
	getApprovedRequestsController,
	getPendingRequestsController,
	getAccountDetailsController,
	getOrderHistoryControllerInstantFunding
};
