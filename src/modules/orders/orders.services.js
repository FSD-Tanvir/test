const { default: mongoose } = require("mongoose");
const { MOrder } = require("./orders.schema");
const { sendEmailSingleRecipient } = require("../../helper/mailing");
const MUser = require("../users/users.schema");
const { invoiceMailingHTMLTemplate } = require("../../helper/utils/invoiceMailingHTMLTemplate");
const { getAffiliateByReferralCode } = require("../affiliate/affiliate.services");

/**
 * Asynchronously creates a new order in the database.
 *
 * @param {Object} orderData - The data for the order to be created.
 * @returns {Promise<Object>} The newly created order.
 * @throws {Error} If there is an error creating the order.
 */
const createOrder = async (orderData) => {
	try {
		const newOrder = await MOrder.create({
			...orderData,
			orderItems: orderData.orderItems || [],
		});

		const { orderId, buyerDetails } = newOrder;

		//  [✅][✅][✅] Todo:: send an email to the user with the order details with (email, orderId,password) and  also invoice details 💬💬💬💬💬💬💬💬

		// Send an email to the user with the order details 🧲🧲🧲🧲🧲🧲🧲🧲🧲

		const htmlTemplate = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 12px; background-color: #ffffff; border: 2px solid #DB8112; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); text-align: center;">
    <!-- Header Section -->
    <div style="text-align: center; margin-bottom: 25px;">
        <img src="https://i.ibb.co.com/34qjbqp/Fox-Funded-Logo.png" alt="Company Logo" style="max-width: 100px; height: auto;">
    </div>
    <h2 style="color: #333; text-align: center; margin-bottom: 20px; font-size: 26px; font-weight: bold;">
        Your customer portal has been created
    </h2>
    <p style="font-size: 16px; color: #555; text-align: center; margin-bottom: 20px; line-height: 1.6;">
        Your order has been successfully created. Here are the details:
    </p>

    <!-- Order ID Section -->
    <div style="background-color: #fff8f0; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #DB8112;">
        <p style="font-size: 20px; color: #333; text-align: center; margin-bottom: 10px; font-weight: bold;">
            Order ID: <span style="color: #DB8112; font-weight: 800;">${orderId}</span>
        </p>
    </div>

    <!-- Instruction Text -->
    <p style="font-size: 16px; color: #555; text-align: center; margin-bottom: 20px; line-height: 1.6; font-style: italic;">
        To track your order, please log in with the following credentials in our dashboard:
    </p>

    <!-- Credentials Section -->
    <div style="background-color: #fff8f0; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #DB8112;">
        <p style="font-size: 18px; color: #333; margin-bottom: 10px; text-align: center;">
            <strong>Email:</strong> <span style="color: #DB8112; font-weight: bold;">${buyerDetails?.email}</span>
        </p>
        <p style="font-size: 18px; color: #333; margin-bottom: 10px; text-align: center;">
            <strong>Password:</strong> <span style="color: #DB8112; font-weight: bold;">${buyerDetails?.password}</span>
        </p>
    </div>

    <!-- Call-to-Action Button -->
    <div style="text-align: center; margin-bottom: 20px;">
        <a href="https://foxx-funded.com/login" style="display: inline-block; padding: 12px 25px; background: linear-gradient(135deg, #DB8112, #ffa64d); color: #fff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; transition: all 0.3s ease;">
            Login to Track Your Order
        </a>
    </div>

    <!-- Support Section -->
    <p style="font-size: 14px; color: #777; margin-top: 20px; line-height: 1.6;">
        Need help? <a href="https://foxx-funded.com/contact-us" style="color: #DB8112; text-decoration: none; font-weight: bold;">Contact our support team</a>.
    </p>

    <!-- Social Media Section -->
    <div style="margin-top: 20px; text-align: center;">
        <a href="https://t.me/+2QVq5aChxiBlOWFk" style="margin-right: 10px;">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUQ9pRZvmScqICRjNBvAHEjIawnL1erY-AcQ&s" alt="Telegram" style="width: 36px; height: 36px;">
        </a>
    </div>

    <!-- Footer Section -->
    <p style="font-size: 14px; color: #777; margin-top: 20px;">
        Thank you for shopping with us!
    </p>
</div>

<style>
    @media only screen and (max-width: 600px) {
        div[style] {
            padding: 20px !important;
        }
        h2[style] {
            font-size: 24px !important;
        }
        p[style], a[style] {
            font-size: 14px !important;
        }
        a[style] {
            padding: 10px 20px !important;
            font-size: 14px !important;
        }
    }
</style>`;

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

/**
 * Retrieves all orders based on optional orderStatus and paymentStatus filters.
 * If provided, filters orders by the specified orderStatus and/or paymentStatus.
 * Valid orderStatus options: "Processing", "Pending", "Accepted", "Delivered", "Cancelled".
 * Valid paymentStatus options: "Unpaid", "Processing", "Paid", "Refunded", "Failed".
 * Orders are sorted by 'createdAt' in descending order.
 * @param {string} orderStatus - Optional filter for order status.
 * @param {string} paymentStatus - Optional filter for payment status.
 * @returns {Promise<Array>} A promise that resolves to an array of orders matching the filters.
 * @throws {Error} If there is an error retrieving orders.
 */
const allOrders = async (
	orderStatus = null,
	paymentStatus = null,
	paymentMethod = null,
	page = 1,
	limit = 10,
	search = "",
	date = null,
	accountSize = null
) => {
	try {
		const validOrderStatuses = ["Processing", "Pending", "Accepted", "Delivered", "Cancelled"];
		const validPaymentStatuses = ["Unpaid", "Processing", "Paid", "Refunded", "Failed"];

		let filter = {
			$or: [{ isGiveAway: false }, { isGiveAway: { $exists: false } }],
		};

		// Add order status filter if valid
		if (orderStatus && validOrderStatuses.includes(orderStatus)) {
			filter.orderStatus = orderStatus;
		}

		// Add payment status filter if valid
		if (paymentStatus && validPaymentStatuses.includes(paymentStatus)) {
			filter.paymentStatus = paymentStatus;
		}

		// Add payment method filter if provided
		if (paymentMethod) {
			filter.paymentMethod = paymentMethod;
		}

		// Add search filter if provided
		if (search) {
			filter.$or = [
				{ orderId: { $regex: search, $options: "i" } },
				{ "buyerDetails.email": { $regex: search, $options: "i" } },
			];
		}

		// Apply single date filter only if date is provided
		if (date) {
			const targetDate = new Date(date);
			const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
			const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

			filter.createdAt = {
				$gte: startOfDay,
				$lte: endOfDay,
			};
		}

		// Add account size filter if provided and convert to number
		if (accountSize) {
			filter["orderItems.accountSize"] = Number(accountSize);
		}

		// Convert page and limit to numbers and apply pagination
		const pageNumber = Number.parseInt(page, 10);
		const limitNumber = Number.parseInt(limit, 10);

		// Query the orders with filters, sort by createdAt, and paginate results
		const orders = await MOrder.find(filter)
			.populate("couponClaimed")
			.sort({ createdAt: -1 })
			.skip((pageNumber - 1) * limitNumber)
			.limit(limitNumber);

		// Get the total count of orders matching the filter
		const totalOrders = await MOrder.countDocuments(filter);

		// Return the paginated result and accountSize counts
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

/**
 * Updates an order in the database with the provided data.
 * @param {string} id - The ID of the order to update.
 * @param {object} data - The data to update in the order.
 * @returns {Promise<object>} - The updated order object.
 * @throws {Error} - If the order with the specified ID is not found or if there is an error updating the order.
 */

const updateOrder = async (id, data) => {
	try {
		// Update the order with the provided data
		const updatedOrder = await MOrder.findByIdAndUpdate(
			id,
			{ $set: data },
			{ new: true, runValidators: true }
		);

		if (!updatedOrder) {
			// Return an appropriate response if the order is not found
			return { error: `Order with id ${id} not found` };
		}

		// Extract necessary fields from the updated order
		const { orderId, paymentStatus, orderStatus } = updatedOrder;

		if (paymentStatus === "Paid") {
			// ⚠️⚠️⚠️invoice details send to user through email
			if (
				(updatedOrder?.totalPrice !== null ||
					updatedOrder?.totalPrice !== 0 ||
					updatedOrder?.totalPrice !== undefined) &&
				(updatedOrder?.subtotal !== null ||
					updatedOrder?.subtotal !== undefined ||
					updatedOrder?.subtotal !== 0)
			) {
				const invoiceHTML = await invoiceMailingHTMLTemplate(updatedOrder);
				await sendEmailSingleRecipient(
					updatedOrder?.buyerDetails?.email,
					"Your Order Confirmation invoice",
					"Your order has been successfully created with the following details:",
					invoiceHTML
				);
			} else if (updatedOrder?.discountPrice === updatedOrder?.orderItems[0].challengePrice) {
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
		const user = await MUser.findOne({ email: updatedOrder?.buyerDetails?.email });

		if (!user || user.mt5Accounts.length === 0) {
			// If no user or no Mt5Accounts, return the updated order
			return { updatedOrder };
		}

		// Find the matching MT5 account
		const matchingAccount =
			user && (await user.mt5Accounts.find((account) => account.productId === orderId));

		// Prepare the HTML content for the email
		const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .email-container {
            width: 100%;
            max-width: 600px;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
            border: 2px solid #DB8112;
            overflow: hidden;
            text-align: center;
            padding: 30px;
            animation: fadeIn 0.5s ease-in-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .logo-container {
            margin-bottom: 25px;
        }
        .logo-container img {
            max-width: 100px;
            height: auto;
        }
        .header {
            color: #DB8112;
            margin-bottom: 25px;
        }
        .header h2 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            position: relative;
            display: inline-block;
        }
        .header h2::after {
            content: '';
            display: block;
            width: 50px;
            height: 3px;
            background-color: #DB8112;
            margin: 10px auto 0;
            border-radius: 2px;
        }
        .content {
            color: #333333;
            font-size: 16px;
            line-height: 1.6;
            text-align: left;
        }
        .content p {
            margin: 15px 0;
        }
        .credentials {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: left;
            border-left: 4px solid #DB8112;
        }
        .credentials p {
            margin: 10px 0;
            font-size: 16px;
            color: #555;
        }
        .credentials strong {
            color: #DB8112;
            font-weight: bold;
        }
        .download-links {
            margin-top: 25px;
            text-align: center;
        }
        .download-links p {
            font-size: 18px;
            color: #333;
            margin-bottom: 15px;
        }
        .download-links a {
            display: inline-block;
            color: #ffffff;
            background: linear-gradient(135deg, #DB8112, #ffa64d);
            text-decoration: none;
            font-weight: bold;
            padding: 12px 25px;
            border-radius: 6px;
            margin: 10px 5px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .download-links a:hover {
            background: linear-gradient(135deg, #ffa64d, #DB8112);
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }
        .footer {
            padding-top: 20px;
            font-size: 14px;
            color: #777;
            margin-top: 25px;
            border-top: 1px solid #eeeeee;
            text-align: center;
        }
        .footer p {
            margin: 5px 0;
        }
        @media only screen and (max-width: 600px) {
            .email-container {
                padding: 20px;
            }
            .header h2 {
                font-size: 24px;
            }
            .download-links a {
                padding: 10px 20px;
                font-size: 14px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="logo-container">
            <img src="https://i.ibb.co.com/34qjbqp/Fox-Funded-Logo.png" alt="Company Logo">
        </div>
        <div class="header">
            <h2>Your MT5 Account Credentials</h2>
        </div>
        <div class="content">
            <p>Dear User,</p>
            <p>Your MT5 account has been successfully created. Here are your credentials:</p>
            <div class="credentials">
                <p><strong>Account:</strong> ${matchingAccount?.account}</p>
                <p><strong>Password:</strong> ${matchingAccount?.masterPassword}</p>
                <p><strong>Platform:</strong> MT5</p>
                <p><strong>Broker:</strong> BizzTrade</p>
            </div>
            <p>Please keep this information secure and do not share it with anyone.</p>
            <div class="download-links">
                <p>Download the MT5 for:</p>
                <a href="https://play.google.com/store/apps/details?id=net.metaquotes.metatrader5" target="_blank" rel="noopener noreferrer">Android</a>
                <a href="https://apps.apple.com/us/app/metatrader-5/id413251709" target="_blank" rel="noopener noreferrer">iOS</a>
                <a href="https://download.mql5.com/cdn/web/metaquotes.software.corp/mt5/metatrader5.apk?utm_source=www.metatrader5.com&utm_campaign=install.metaquotes" target="_blank" rel="noopener noreferrer">Desktop</a>
            </div>
        </div>
        <div class="footer">
            <p>Thank you for choosing our services.</p>
        </div>
    </div>
</body>
</html>`;

		// Send email and update order status if conditions are met
		if (matchingAccount) {
			const info = await sendEmailSingleRecipient(
				user.email,
				"Your MT5 Account Credentials From Foxx Funded",
				`Your MT5 account: ${matchingAccount.account} and password: ${matchingAccount.masterPassword}`,
				htmlContent
			);
			if (info) {
				// Update order status to 'Delivered'
				await MOrder.findOneAndUpdate(
					{ orderId: orderId },
					{ $set: { orderStatus: "Delivered" } },
					{ new: true }
				);
			}
			// Return the matched MT5 account
			return { matchingAccount, updatedOrder };
		}
		// Return the updated order if no email was sent
		return { updatedOrder };
	} catch (error) {
		console.log("🚀 ~ updateOrder ~ error:", error);
		// Return the error in the response
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
		const totalSalesPrice = orders.reduce((sum, order) => {
			return sum + order.orderItems.reduce((itemSum, item) => itemSum + item.challengePrice, 0);
		}, 0);

		// Get affiliate data
		const getAffiliate = await getAffiliateByReferralCode(referralCode);

		// Set commission rate based on affiliate tier
		let commissionRate = 0.075; // Default 7.5% for Tier 1
		if (getAffiliate.tier === "Tier 2") {
			commissionRate = 0.1; // 10% for Tier 2
		} else if (getAffiliate.tier === "Tier 3") {
			commissionRate = 0.15; // 15% for Tier 3
		}

		// Commissions Earned (based on affiliate tier, rounded to two decimal places)
		const commissionsEarned = parseFloat(
			orders
				.reduce((sum, order) => {
					return (
						sum + order.totalPrice * commissionRate
						// order.orderItems.reduce(
						// 	(itemSum, item) => itemSum + item.challengePrice * commissionRate,
						// 	0
						// )
					);
				}, 0)
				.toFixed(2)
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
			console.log("No unpaid orders found.");
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
};
