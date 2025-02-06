// withdrawRequestRoutes.js

const express = require("express");
const {
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
	// getOrderHistoryController,
	getApprovedRequestsController,
	getPendingRequestsController,
} = require("./withDrawRequests.controller");

const router = express.Router();

// More specific routes should come first
router.get('/approved-requests', getApprovedRequestsController);
router.get('/pending-requests', getPendingRequestsController);
// router.get('/history', getOrderHistoryController);
router.get('/check-request/:accountNumber', getPayoutRequestHandler);
router.get('/approved/:email', getAllApprovedWithDrawRequestsByEmail);
router.get('/pending/:email', getAllPendingWithDrawRequestsByEmail);
router.get('/all-payout/:email', getAllPayoutsWithDrawRequestsByEmail);
router.get('/all-approved/:accountNumber', getApprovedAccountByNumber);

// Generic routes come later
router.post("/", createWithDrawRequest);
router.get("/by-id/:id", getWithDrawRequestById); 
router.get("/:accountNumber", getWithDrawRequestByAccountNumber);
router.get("/", getAllWithDrawRequests);
router.patch("/:id", updateWithDrawRequestById);



module.exports = router;
