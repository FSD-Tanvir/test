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
	getOrderHistoryController,
	getApprovedRequestsController,
	getPendingRequestsController,
	getAccountDetailsController,
	getOrderHistoryControllerInstantFunding
} = require("./withDrawRequests.controller");

const router = express.Router();

router.get('/history', getOrderHistoryController)

router.get('/instant-funding/history', getOrderHistoryControllerInstantFunding);

router.get('/approved-requests', getApprovedRequestsController);

router.get('/pending-requests', getPendingRequestsController);


router.get('/check-request/:accountNumber', getPayoutRequestHandler);

router.get('/approved/:email', getAllApprovedWithDrawRequestsByEmail);

router.get('/pending/:email', getAllPendingWithDrawRequestsByEmail);

router.get('/all-payout/:email', getAllPayoutsWithDrawRequestsByEmail);


router.post("/", createWithDrawRequest);

router.get("/by-id/:id", getWithDrawRequestById);

router.get('/:accountNumber', (req, res, next) => {
	if (isNaN(req.params.accountNumber)) {
		return res.status(400).json({ message: "Invalid account number" });
	}
	next();
}, getWithDrawRequestByAccountNumber);


router.get("/", getAllWithDrawRequests);

router.get("/accountDetails/:account", getAccountDetailsController);

router.patch("/:id", updateWithDrawRequestById);


router.get('/approved/account/:accountNumber', getApprovedAccountByNumber);




module.exports = router;
