
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
	getAllApprovedRequester,
	getAllPendingRequester,
	getOrderHistoryService,
	getOrderHistoryServiceByMatchTrader,
	getOrderHistory
} = require("./withDrawRequests.services");

// Handle POST request to create a new withdrawal request
const createWithDrawRequest = async (req, res) => {
	try {
		const {
			email,
			accountNumber,
			amount,
			paymentMethod,
		} = req.body;

		if (!email || !amount || !paymentMethod || !accountNumber) {
			return res.status(400).json({
				message:
					"Email, amount, payment method, and account number are required.",
			});
		}

		const newWithDrawRequest = await createWithDrawRequestService(req.body);
		if (newWithDrawRequest && newWithDrawRequest._id) {
			const id = newWithDrawRequest._id;
			const updatedData = newWithDrawRequest;
			const updatedWithdrawRequest = await updateWithDrawRequestByIdService(
				id,
				updatedData,
			);
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
		if (!accountNumber) {
			return res.status(400).json({ message: "Account number is required." });
		}
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
		if (!id) {
			return res.status(400).json({ message: "ID is required." });
		}
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
		if (!id) {
			return res.status(400).json({ message: "ID is required." });
		}
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


// Handle GET request to fetch all approved withdrawal requests by account number
const getApprovedAccountByNumber = async (req, res) => {
	const { accountNumber } = req.params;

	try {
		const approvedAccounts = await MWithDrawRequest.find({
			status: "approved",
			accountNumber: parseInt(accountNumber),
		});

		if (approvedAccounts.length === 0) {
			return res.status(200).json([]);
		}

		res.status(200).json(approvedAccounts);
	} catch (error) {
		res.status(500).json({ message: "Error retrieving accounts", error });
	}
};


// Handle GET request to fetch all approved withdrawal requests by email
const getAllApprovedWithDrawRequestsByEmail = async (req, res) => {
	try {
		const { email } = req.params;
		if (!email) {
			return res.status(400).json({ message: "Email is required." });
		}
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

// Handle GET request to fetch all pending withdrawal requests by email
const getAllPendingWithDrawRequestsByEmail = async (req, res) => {
	try {
		const { email } = req.params;
		if (!email) {
			return res.status(400).json({ message: "Email is required." });
		}
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

// Handle GET request to fetch all payouts with withdrawal requests by email
const getAllPayoutsWithDrawRequestsByEmail = async (req, res) => {
	try {
		const { email } = req.params;
		const { page = 1, limit = 10 } = req.query;
		if (!email) {
			return res.status(400).json({ message: "Email is required." });
		}
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


// Handle GET request to fetch the latest payout request by account number
const getPayoutRequestHandler = async (req, res) => {
	const { accountNumber } = req.params;

	try {
		const latestApprovedAccount = await MWithDrawRequest.findOne({
			accountNumber: parseInt(accountNumber),
		})
			.sort({ createdAt: -1 })
			.exec();

		if (!latestApprovedAccount) {
			return res.status(200).json([]);
		}

		res.status(200).json(latestApprovedAccount);
	} catch (error) {
		res.status(500).json({ message: "Error retrieving accounts", error });
	}
};


const getOrderHistoryController = async (req, res) => {
	const { account, startDate, endDate } = req.query;

	try {
		const result = await getOrderHistoryService(account, startDate, endDate);
		return res.status(200).json({
			success: true,
			...result,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};


const getOrderHistoryControllerMatchTrader = async (req, res) => {
	const { login } = req.query;
	console.log("Login:", login);
	try {
		const result = await getOrderHistoryServiceByMatchTrader(login);
		return res.status(200).json({
			success: true,
			...result,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
}



const getOrderHistoryControllerInstantFunding = async (req, res) => {
	const { account, startDate, endDate } = req.query;
	try {
		const orderHistory = await getOrderHistory(account, startDate, endDate);
		res.status(200).json({
			success: true,
			data: orderHistory
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message
		});
	}
}



// // Handle GET request to fetch all approved withdrawal requests
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

// // Handle GET request to fetch all pending withdrawal requests
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

// Handle GET request to fetch account details by account number
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
	getOrderHistoryControllerInstantFunding,
	getOrderHistoryControllerMatchTrader
};
