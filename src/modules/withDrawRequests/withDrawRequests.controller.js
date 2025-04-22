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

const getOrderHistoryController = async (req, res) => {
	const { account, startDate, endDate } = req.query;

	try {
		const orderHistory = await getOrderHistory(account, startDate, endDate);

		const approvedAcc = await MWithDrawRequest.findOne({ accountNumber: account });

		let filteredTrades = orderHistory;

		if (approvedAcc) {
			// Filter trades that are after approvedAcc.updatedAt
			const updatedAtTime = new Date(approvedAcc.updatedAt);

			filteredTrades = orderHistory.filter(trade => {
				const tradeTime = new Date(trade.openTime);
				return tradeTime > updatedAtTime;
			});
		}

		const getOpenTrades = getUniqueTradingDays(filteredTrades);

		if (getOpenTrades === 0) {
			return res.status(200).json({
				message: "No open trades found for this account.",
			});
		}

		res.status(200).json(getOpenTrades);

	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message
		});
	}
};



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
	getAccountDetailsController
};
