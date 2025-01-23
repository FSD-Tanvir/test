const { invoiceMailingHTMLTemplate } = require("../../helper/utils/invoiceMailingHTMLTemplate");
const { removeObjectProperties } = require("../../helper/utils/removeObjectProperties");
const ordersService = require("./orders.services");

const createOrder = async (req, res) => {
	try {
		const newOrder = await ordersService.createOrder(req.body);
		res.status(201).json(newOrder);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

const multipleSameChallengeSalesHandler = async (req, res) => {
	try {
		const newOrder = await ordersService.multipleSameChallengeSales();
		res.status(200).json(newOrder);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

const allOrders = async (req, res) => {
	try {
		const {
			orderStatus,
			paymentStatus,
			paymentMethod,
			page = 1,
			limit = 10,
			search,
			date, //  date parameter - (2024-10-01)
			accountSize, //  accountSize parameter - (50000)
		} = req.query;

		const orders = await ordersService.allOrders(
			orderStatus,
			paymentStatus,
			paymentMethod,
			page,
			limit,
			search,
			date, // Pass the date to the service
			accountSize // Pass the accountSize to the service
		);

		res.status(200).json(orders);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

const updateOrder = async (req, res) => {
	try {
		const { id } = req.params;
		// Remove userId, email, and orderItems from the request body
		const updateData = removeObjectProperties(req.body, ["userId", "email", "orderItems"]);
		const updatedOrder = await ordersService.updateOrder(id, updateData);
		res.status(200).json(updatedOrder);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

const totalOrderSales = async (req, res) => {
	try {
		const totalSales = await ordersService.totalOrderSales();
		res.status(200).json(totalSales);
		return totalSales;
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

const singleOrder = async (req, res) => {
	try {
		const { id } = req.params;
		const singleOrder = await ordersService.singleOrder(id);
		res.status(200).json(singleOrder);
		return singleOrder;
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

const userOrders = async (req, res) => {
	try {
		const { email } = req.params;
		const userOrders = await ordersService.userOrders(email);
		res.status(200).json(userOrders);
		return userOrders;
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

const getOrderById = async (req, res) => {
	try {
		const { orderId } = req.params;

		const order = await ordersService.getOrderById(orderId);

		if (!order) {
			return res.status(404).json({ message: "Order not found" });
		}

		const htmlTemplate = await invoiceMailingHTMLTemplate(order);

		res.status(200).send(htmlTemplate);

		// res.status(200).json(order);
	} catch (error) {
		console.error("Error fetching order:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Controller to get orders by referral code with additional filters
const fetchOrdersByReferralCode = async (req, res) => {
	const { referralCode } = req.params;

	try {
		const orders = await ordersService.getOrdersByReferralCode(referralCode);

		if (orders.length === 0) {
			return res.status(404).json({
				message:
					"No orders found with the given referral code, order status Delivered, and payment status Paid.",
			});
		}

		res.status(200).json({ success: true, orders });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};
const fetchOrdersByReferralAndStatus = async (req, res) => {
	try {
		const { orders, totalOrders, totalPriceSum } =
			await ordersService.getOrdersByReferralAndStatus();

		return res.status(200).json({
			success: true,
			totalOrders,
			totalPriceSum,
			data: orders,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Failed to fetch orders",
			error: error.message,
		});
	}
};

module.exports = {
	createOrder,
	allOrders,
	updateOrder,
	totalOrderSales,
	singleOrder,
	userOrders,
	getOrderById,
	fetchOrdersByReferralCode,
	fetchOrdersByReferralAndStatus,
	multipleSameChallengeSalesHandler,
};
