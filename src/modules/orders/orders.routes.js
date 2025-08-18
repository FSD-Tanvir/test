const express = require("express");

const router = express.Router();
const {
	createOrder,
	allOrders,
	totalOrderSales,
	userOrders,
	singleOrder,
	updateOrder,
	getOrderById,
	fetchOrdersByReferralCode,
	fetchOrdersByReferralAndStatus,
	getSingleOrderByOrderIdHandler,
	saveCommentController,
} = require("./orders.controller"); // Replace 'your-controller-file' with the actual file name

// Route to handle POST requests for creating an order
router.post("/create-order", createOrder);

// Route to handle GET requests for all orders
router.get("/", allOrders);

// Route to handle GET requests for the total sales and today's sales of all orders
router.get("/total-sales", totalOrderSales);

// Route to handle GET requests for a specific user's orders by email
router.get("/user-orders/:email", userOrders);

// Define a route to fetch orders by referral code and status
router.get("/affiliate/referral-status", fetchOrdersByReferralAndStatus);

// Route to handle GET requests for fetching orders by referral code
router.get("/affiliate/referral/:referralCode", fetchOrdersByReferralCode);

// Route to handle GET requests for a specific order by ID
router.get("/:id", singleOrder);

// Route to handle GET requests for a specific order by orderId for invoice
router.get("/invoice/:orderId", getOrderById);

// GET: Single order by orderId
router.get("/single-order/:orderId", getSingleOrderByOrderIdHandler);

// Route to handle PUT requests for updating a specific order by ID
router.put("/:id", updateOrder);

// Importing the order comment service
router.put("/:id/comment", saveCommentController);

module.exports = router;
