const couponService = require("./coupon.services");
const ordersService = require("../orders/orders.services.js");

const createCoupon = async (req, res) => {
	try {
		const newOrder = await couponService.createCoupon(req.body);
		res.status(201).json(newOrder);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

const getCoupon = async (req, res) => {
	try {
		const { couponName } = req.params;
		const coupon = await couponService.getCoupon(couponName);

		res.status(200).json(coupon);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};
const updateCouponHandler = async (req, res) => {
	try {
		const { id } = req.params;

		const coupon = await couponService.updateCoupon(id, req.body);

		res.status(200).json(coupon);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

const allCoupons = async (req, res) => {
	try {
		const coupon = await couponService.allCoupons();

		res.status(200).json(coupon);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// const getOrdersByCoupon = async (req, res) => {
// 	try {
// 		// Step 1: Get all coupons
// 		const coupons = await couponService.allCoupons();

// 		// Step 2: Prepare the result array
// 		const result = [];

// 		// Step 3: Loop through each coupon and fetch associated orders
// 		for (const coupon of coupons) {
// 			const couponData = {
// 				couponName: coupon.couponName,
// 				orders: []
// 			};

// 			// Step 4: For each coupon, fetch its claimed orders
// 			for (const orderId of coupon.claimedOrders) {
// 				try {
// 					// Fetch the order by its ID
// 					const order = await ordersService.singleOrder(orderId);

// 					// Check if the order exists and its paymentStatus is 'paid'
// 					if (order && order.paymentStatus === 'Paid') {
// 						couponData.orders.push(order);
// 					} else if (!order) {
// 						console.warn(`Order with ID ${orderId} not found`);
// 					}
// 				} catch (error) {
// 					console.error(`Error retrieving order with ID ${orderId}: ${error.message}`);
// 				}
// 			}

// 			// Add the coupon with its 'paid' orders to the result
// 			result.push(couponData);
// 		}

// 		// Send the response with the coupon and order data
// 		res.status(200).json(result);
// 	} catch (error) {
// 		// Handle errors and send error response
// 		res.status(500).json({ error: error.message });
// 	}
// };
const getOrdersByCoupon = async (req, res) => {
	try {
		// Step 1: Get all coupons
		const coupons = await couponService.allCoupons();

		// Step 2: Prepare the result array
		const result = [];

		// Step 3: Loop through each coupon and fetch associated orders in parallel
		for (const coupon of coupons) {
			// Step 4: Fetch all orders for the current coupon in parallel
			const ordersPromises = coupon.claimedOrders.map(orderId =>
				ordersService.singleOrder(orderId).catch(error => {
					console.error(`Error retrieving order with ID ${orderId}: ${error.message}`);
					return null; // Handle individual errors without breaking the loop
				})
			);

			// Wait for all orders to be fetched
			const orders = await Promise.all(ordersPromises);

			// Step 5: Filter out null values and unpaid orders
			const paidOrders = orders.filter(order => order && order.paymentStatus === 'Paid');

			// Step 6: Push couponName and the number of paid orders
			result.push({
				couponName: coupon.couponName,
				numberOfOrders: paidOrders.length
			});
		}

		// Send the response with the coupon name and the count of paid orders
		res.status(200).json(result);
	} catch (error) {
		// Handle errors and send error response
		res.status(500).json({ error: error.message });
	}
};



module.exports = {
	createCoupon,
	getCoupon,
	allCoupons,
	updateCouponHandler,
	getOrdersByCoupon,
};
