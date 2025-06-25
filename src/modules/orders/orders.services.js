const { MOrder } = require("./orders.schema");
const { sendEmailSingleRecipient } = require("../../helper/mailing");
const MUser = require("../users/users.schema");
const { invoiceMailingHTMLTemplate } = require("../../helper/utils/invoiceMailingHTMLTemplate");
const { MCoupon } = require("../coupon/coupon.schema");

const MAffiliate = require("../affiliate/affiliate.schema");
const {
	orderCreationEmailTemplate,
	sendingMt5CredentialsEmailTemplate,
	sendingMatchTraderCredentialsEmailTemplate,
} = require("../../helper/emailTemplates/orderEmailTemplates");
const { mt5Constant, matchTraderConstant } = require("../../constants/commonConstants");

/**
 * Asynchronously creates a new order in the database.
 *
 * @param {Object} orderData - The data for the order to be created.
 * @returns {Promise<Object>} The newly created order.
 * @throws {Error} If there is an error creating the order.
 */
const createOrder = async (orderData) => {
	try {
		// Validate that orderItems is not empty
		if (!Array.isArray(orderData.orderItems) || orderData.orderItems.length === 0) {
			throw new Error("Order items cannot be empty");
		}

		const newOrder = await MOrder.create({
			...orderData,
			orderItems: orderData.orderItems || [],
		});

		const { orderId, buyerDetails } = newOrder;

		const htmlTemplate = orderCreationEmailTemplate(orderId, buyerDetails);

		if (newOrder) {
			await sendEmailSingleRecipient(
				buyerDetails?.email,
				"Onboard your Order",
				"Your order has been successfully created with the following details:",
				htmlTemplate
			);
		}
		// 🧲🧲🧲🧲🧲🧲🧲🧲🧲
		return newOrder;
	} catch (error) {
		console.error(error);
		throw new Error("Error creating order");
	}
};

const allOrders = async (
	orderStatus = null,
	paymentStatus = null,
	paymentMethod = null,
	page = 1,
	limit = 10,
	search = "",
	startDate = null,
	endDate = null,
	accountSize = null,
	couponName = null,
	platform = null
) => {
	try {
		const validOrderStatuses = ["Processing", "Pending", "Accepted", "Delivered", "Cancelled"];
		const validPaymentStatuses = ["Unpaid", "Processing", "Paid", "Refunded", "Failed"];
		const validPlatforms = [mt5Constant, matchTraderConstant];

		let filter = {
			$or: [{ isGiveAway: false }, { isGiveAway: { $exists: false } }],
		};

		// Order status filter
		if (orderStatus && validOrderStatuses.includes(orderStatus)) {
			filter.orderStatus = orderStatus;
		}

		// Payment status filter
		if (paymentStatus && validPaymentStatuses.includes(paymentStatus)) {
			filter.paymentStatus = paymentStatus;
		}

		// Payment method filter
		if (paymentMethod) {
			filter.paymentMethod = paymentMethod;
		}

		// Search filter
		if (search) {
			filter.$or = [
				{ orderId: { $regex: search, $options: "i" } },
				{ "buyerDetails.email": { $regex: search, $options: "i" } },
			];
		}

		// Date range filter
		if (startDate || endDate) {
			const dateRangeFilter = {};

			if (startDate) {
				const startOfDay = new Date(startDate);
				startOfDay.setHours(0, 0, 0, 0);
				dateRangeFilter.$gte = startOfDay;
			}

			if (endDate) {
				const endOfDay = new Date(endDate);
				endOfDay.setHours(23, 59, 59, 999);
				dateRangeFilter.$lte = endOfDay;
			}

			if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
				throw new Error("Invalid date range: startDate must be less than or equal to endDate");
			}

			filter.createdAt = dateRangeFilter;
		}

		// Account size filter
		if (accountSize) {
			filter["orderItems.accountSize"] = Number(accountSize);
		}

		// Coupon filter
		if (couponName) {
			const matchingCoupon = await MCoupon.findOne({ couponName: couponName }, { _id: 1 }).sort({
				created_at: -1,
			});

			if (matchingCoupon) {
				filter.couponClaimed = matchingCoupon._id;
			} else {
				return {
					orders: [],
					currentPage: page,
					totalPages: 0,
					totalOrders: 0,
				};
			}
		}

		// Platform filter
		if (platform && validPlatforms.includes(platform)) {
			filter.platform = platform;
		}

		// Convert page and limit
		const pageNumber = Number.parseInt(page, 10);
		const limitNumber = Number.parseInt(limit, 10);

		// Fetch orders
		const orders = await MOrder.find(filter)
			.populate({
				path: "couponClaimed",
				select: "couponName",
			})
			.sort({ createdAt: -1 })
			.skip((pageNumber - 1) * limitNumber)
			.limit(limitNumber);

		const totalOrders = await MOrder.countDocuments(filter);

		return {
			orders,
			currentPage: pageNumber,
			totalPages: Math.ceil(totalOrders / limitNumber),
			totalOrders,
		};
	} catch (error) {
		console.error("Error retrieving orders:", error.message);
		throw new Error("Error retrieving orders");
	}
};

const updateOrder = async (id, data) => {
	try {
		// Update the order with the provided data
		const updatedOrder = await MOrder.findByIdAndUpdate(
			id,
			{ $set: data },
			{ new: true, runValidators: true }
		);

		if (!updatedOrder) {
			return { error: `Order with id ${id} not found` };
		}

		const { orderId, paymentStatus, platform } = updatedOrder;

		// Send invoice if payment is Paid
		if (paymentStatus === "Paid") {
			const shouldSendInvoice =
				(updatedOrder.totalPrice !== null &&
					updatedOrder.totalPrice !== undefined &&
					updatedOrder.totalPrice !== 0) ||
				(updatedOrder.subtotal !== null &&
					updatedOrder.subtotal !== undefined &&
					updatedOrder.subtotal !== 0) ||
				updatedOrder.discountPrice === updatedOrder?.orderItems[0]?.challengePrice;

			if (shouldSendInvoice) {
				const invoiceHTML = await invoiceMailingHTMLTemplate(updatedOrder);
				await sendEmailSingleRecipient(
					updatedOrder?.buyerDetails?.email,
					"Your Order Confirmation invoice",
					"Your order has been successfully created with the following details:",
					invoiceHTML
				);
			}
		}

		// Find the user
		const user = await MUser.findOne({
			email: updatedOrder?.buyerDetails?.email,
		});

		if (!user) {
			return { updatedOrder };
		}

		let matchingAccount = null;
		let htmlContent = "";
		let subject = "";
		let plainText = "";

		if (platform === mt5Constant && user.mt5Accounts.length > 0) {
			matchingAccount = user.mt5Accounts.find((account) => account.productId === orderId);

			if (matchingAccount) {
				htmlContent = sendingMt5CredentialsEmailTemplate(matchingAccount);
				subject = "Your MT5 Account Credentials From Foxx Funded";
				plainText = `Your MT5 account: ${matchingAccount.account} and password: ${matchingAccount.masterPassword}`;
			}
		} else if (platform === matchTraderConstant && user.matchTraderAccounts.length > 0) {
			matchingAccount = user.matchTraderAccounts.find((account) => account.productId === orderId);

			if (matchingAccount) {
				htmlContent = sendingMatchTraderCredentialsEmailTemplate(matchingAccount);
				subject = "Your Match Trader Account Credentials From Foxx Funded";
				plainText = `Your Match Trader account: ${matchingAccount.account} and password: ${matchingAccount.masterPassword}`;
			}
		}

		if (matchingAccount) {
			const info = await sendEmailSingleRecipient(user.email, subject, plainText, htmlContent);

			if (info) {
				await MOrder.findOneAndUpdate(
					{ orderId: orderId },
					{ $set: { orderStatus: "Delivered" } },
					{ new: true }
				);
			}

			return { matchingAccount, updatedOrder };
		}

		return { updatedOrder };
	} catch (error) {
		console.log("🚀 ~ updateOrder ~ error:", error);
		return { error: `Error updating order: ${error.message}` };
	}
};

/**
 * Calculates the total order sales and today's sales by aggregating data from the MOrder collection.
 * @returns {Promise<{ totalSales: number, todaySales: number }>} An object containing the total sales and today's sales.
 */
const totalOrderSales = async () => {
	try {
		// Define the pipeline for total sales with paymentStatus and orderStatus filter
		const totalSalesPipeline = [
			{
				$match: {
					paymentStatus: "Paid",
					orderStatus: "Delivered",
				},
			},
			{
				$group: {
					_id: null,
					totalSales: {
						$sum: "$totalPrice", // Summing the totalPrice field from the demo data
					},
				},
			},
		];

		// Define the pipeline for today's sales with paymentStatus and orderStatus filter
		const todaySalesPipeline = [
			{
				$match: {
					paymentStatus: "Paid",
					orderStatus: "Delivered",
					createdAt: {
						$gte: new Date(new Date().setHours(0, 0, 0, 0)), // Start of today
						$lt: new Date(new Date().setHours(23, 59, 59, 999)), // End of today
					},
				},
			},
			{
				$group: {
					_id: null,
					totalSalesToday: {
						$sum: "$totalPrice", // Summing the totalPrice field from today's sales
					},
				},
			},
		];

		// Count all the orders in the collection without any filters
		const totalOrdersResult = await MOrder.countDocuments().exec(); // Just return the count of all orders

		// Execute the aggregation pipelines for total sales and today's sales
		const [totalSalesResult] = await MOrder.aggregate(totalSalesPipeline).exec();
		const [todaySalesResult] = await MOrder.aggregate(todaySalesPipeline).exec();

		// Return total sales, today's sales, and total order count
		return {
			totalSales: totalSalesResult?.totalSales || 0, // Returning total sales, or 0 if no result
			todaySales: todaySalesResult?.totalSalesToday || 0, // Returning today's sales, or 0 if no result
			totalOrders: totalOrdersResult || 0, // Returning the count of all orders
		};
	} catch (error) {
		console.error("Error calculating order sales:", error);
		throw error;
	}
};

/**
 * Retrieves a single order by its ID.
 * @param {string} id - The ID of the order to retrieve.
 * @returns {Promise<object>} A promise that resolves to the order object.
 * @throws {Error} If there is an error retrieving the order.
 */
const singleOrder = async (id) => {
	try {
		const order = await MOrder.findById(id);
		return order;
	} catch (error) {
		throw new Error("Error retrieving order");
	}
};

/**
 * Retrieves orders for a specific user based on the provided email address.
 * Orders are fetched from the database, sorted by creation date in descending order, and populated with user details.
 * @param {string} email - The email address of the user whose orders are to be retrieved.
 * @returns {Promise<Array>} A promise that resolves to an array of orders belonging to the user, sorted by creation date.
 * If no orders are found, an empty array is returned.
 * @throws {Error} If there is an error retrieving the orders from the database.
 */
const userOrders = async (email) => {
	try {
		const orders = await MOrder.find({ "buyerDetails.email": email }).sort({
			createdAt: -1,
		}); // Sort by 'createdAt' field in descending order
		return orders || [];
	} catch (error) {
		throw new Error("Error retrieving order");
	}
};

const getOrderById = async (orderId) => {
	try {
		const order = await MOrder.findOne({ orderId: `#${orderId}` });
		return order;
	} catch (error) {
		console.error("Error in orderService:", error);
		throw new Error("Failed to retrieve order from database");
	}
};

// Service function to get orders by referralCode with additional filters
const getOrdersByReferralCode = async (referralCode) => {
	try {
		const orders = await MOrder.find({
			referralCode,
			orderStatus: "Delivered",
			paymentStatus: "Paid",
		});

		// Total number of orders (totalSales)
		const totalSales = orders.length;

		// Total Sales Price (sum of challengePrice from each order)
		const totalSalesPrice = orders.reduce((sum, order) => sum + order.totalPrice, 0);
		// Determine commission rate based on totalSales
		let commissionRate = 0.15; // Default 15% for 1-15 sales
		if (totalSales >= 16 && totalSales <= 50) {
			commissionRate = 0.2; // 20% for 16-50 sales
		} else if (totalSales > 50) {
			commissionRate = 0.3; // 30% for 51+ sales
		}

		// Commissions Earned (based on affiliate tier, rounded to two decimal places)
		const commissionsEarned = parseFloat(totalSalesPrice * commissionRate);

		await MAffiliate.findOneAndUpdate(
			{ referralCode },
			{
				totalNumberOfSales: totalSales,
				totalSalesAmount: totalSalesPrice,
				commissionsAmount: commissionsEarned,
			},
			{ new: true }
		);

		// Return the result with totals
		return {
			success: true,
			totalSales,
			totalSalesPrice,
			commissionsEarned,
			orders,
		};
	} catch (error) {
		throw new Error(error.message);
	}
};

const getOrdersByReferralAndStatus = async () => {
	try {
		const orders = await MOrder.find({
			referralCode: { $exists: true, $ne: "" },
			orderStatus: "Delivered",
			paymentStatus: "Paid",
		});

		// Calculate total number of orders
		const totalOrders = orders.length;

		// Calculate sum of totalPrice
		const totalPriceSum = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

		return {
			orders,
			totalOrders,
			totalPriceSum,
		};
	} catch (error) {
		throw new Error(error.message);
	}
};

/* ---------------------------------------------------------------------------------------------- */
/*                 //~ FETCH ORDERS WITH PAYMENT STATUS 'UNPAID' AND MATCHING EMAIL                 */
/* ---------------------------------------------------------------------------------------------- */

// const orders = await MOrder.find({
// 	paymentStatus: "Unpaid",
// 	"buyerDetails.email": "clashking1545@gmail.com",
// });

const sendingFollowUpUnPaidEmail = async () => {
	try {
		// Fetch all orders with paymentStatus 'Unpaid'
		const orders = await MOrder.find({ paymentStatus: "Unpaid" });

		if (orders.length === 0) {
			return;
		}

		const currentTime = new Date();
		const twoHoursAgo = new Date(currentTime.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
		const oneHourAgo = new Date(currentTime.getTime() - 1 * 60 * 60 * 1000); // 1 hour ago

		// Process each order
		for (const order of orders) {
			const orderCreationTime = new Date(order.createdAt); // Ensure it's a Date object

			// Check if the order was created between 2 hours ago and 1 hour ago
			if (orderCreationTime >= twoHoursAgo && orderCreationTime < oneHourAgo) {
				const buyerDetails = order.buyerDetails;

				const htmlTemplate = `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); text-align: center; line-height: 1.6;">
				  <!-- Header Section -->
				  <div style="margin-bottom: 25px;">
					<img src="https://i.ibb.co.com/34qjbqp/Fox-Funded-Logo.png" alt="Company Logo" style="max-width: 120px; height: auto;">
				  </div>
				
				  <!-- Greeting Section -->
				  <p style="font-size: 18px; color: #333; margin-bottom: 15px;">
					Hi ${buyerDetails.first ? buyerDetails.first : ""} ${buyerDetails.last ? buyerDetails.last : ""},
				  </p>
				
				  <!-- Order ID Section -->
				  <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
					<p style="font-size: 20px; color: #333; font-weight: bold; margin: 0;">
					  Order ID: <span style="color: #DB8112; font-style: italic; text-decoration: underline dotted;">
					  ${order.orderId}
					  </span>
					</p>
				  </div>
				
				  <!-- Main Message Section -->
				  <p style="font-size: 16px; color: #555; margin-bottom: 20px;">
					We noticed that you haven’t completed your purchase on our website. At Foxx Funded, we’re excited to help you on your trading journey!
				  </p>
				  <p style="font-size: 16px; color: #555; margin-bottom: 25px;">
					You can finalize your purchase now by clicking the button below:
				  </p>
				
				  <!-- Down Arrow Emoji -->
				  <div style="font-size: 30px; margin-bottom: 20px;">
					👇
				  </div>
				
				  <!-- Call-to-Action Button -->
				  <div style="margin-bottom: 30px;">
					<a href="https://foxx-funded.com/login" style="display: inline-block; padding: 14px 35px; background: linear-gradient(45deg, #DB8112, #FFA726); color: #fff; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); transition: all 0.3s ease;">
					  Complete Your Purchase
					</a>
				  </div>
				
				  <!-- Support Section -->
				  <p style="font-size: 14px; color: #777; margin-top: 10px;">
					If you have any questions, feel free to
					<a href="https://foxx-funded.com/contact-us" style="color: #DB8112; text-decoration: none; font-weight: bold;">
					  contact our support team.
					</a>
					Our team is here to help. Don’t hesitate to reach out to us at any time.
				  </p>
				
				  <!-- Social Media Section -->
				  <div style="margin-top: 25px;">
					<p style="font-size: 14px; color: #777; margin-bottom: 10px;">
					  Connect with us on:
					</p>
					<a href="https://t.me/+2QVq5aChxiBlOWFk" style="margin-right: 15px; display: inline-block;">
					  <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUQ9pRZvmScqICRjNBvAHEjIawnL1erY-AcQ&s" alt="Telegram" style="width: 36px; height: 36px;">
					</a>
				  </div>
				
				  <!-- Footer Section -->
				  <p style="font-size: 14px; color: #777; margin-top: 25px;">
					Thank you for shopping with us!
				  </p>
				</div>
				
				<!-- Responsive Styles -->
				<style>
				  @media only screen and (max-width: 600px) {
					div[style] {
					  padding: 15px !important;
					}
					p[style], a[style] {
					  font-size: 14px !important;
					}
					a[style] {
					  padding: 12px 25px !important;
					}
				  }
				
				  /* Hover Effect for Button */
				  a[href="https://foxx-funded.com/login"]:hover {
					background: linear-gradient(45deg, #FFA726, #DB8112) !important;
					box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2) !important;
					transform: translateY(-2px);
				  }
				</style>
				`;

				// Add email-sending logic here
				await sendEmailSingleRecipient(
					buyerDetails?.email,
					"Complete Your Signup and Start Trading with Foxx Funded 🚀",
					null,
					htmlTemplate
				);
				console.log("Follow-up email sent successfully to:", buyerDetails.email);
			}
		}
	} catch (error) {
		console.error("Error fetching or processing orders:", error);
	}
};

const getSingleOrderByOrderId = async (orderId) => {
	try {
		const order = await MOrder.findOne({ orderId: `#${orderId}` });
		return order;
	} catch (error) {
		console.error("Error in orderService:", error);
		throw new Error("Failed to retrieve order from database");
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
	getOrdersByReferralCode,
	getOrdersByReferralAndStatus,
	sendingFollowUpUnPaidEmail,
	getSingleOrderByOrderId,
};
