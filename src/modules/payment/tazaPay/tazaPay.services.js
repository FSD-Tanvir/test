const axios = require("axios");
const MTazaPay = require("./tazaPay.schema");
const { MOrder } = require("../../orders/orders.schema");
const MUser = require("../../users/users.schema");
const config = require("../../../config/config");

const sandboxURL = "https://service-sandbox.tazapay.com/v3/checkout";
const sandboxSecretKey =
	"Basic YWtfdGVzdF9NRlI3WkdKNDFRQ1lPTDBISlpMQjpza190ZXN0X215aE5zYmFmRXVpaFY4c0VVVXdBaVBod0dIZHdhVGdTZk9EVGtyRVBtZnpESlNkbUNmNEJFSnF6R2w2eDI0R0FvbEl6MnhPMUNVVEx6a1owSzNQZ3o1NGxUTVlEQUp6YWhWdzdFcERNOXExcWhjcjBvNXJxSXpaaVUzMHRqOGxE";

// const tazaPayURL = config.tazapay_base_url;
// const tazaPaySecretKey = config.tazapay_secret_key;

/* --------------------------------------- //! For Sandbox -------------------------------------- */

const tazaPayURL = sandboxURL;
const tazaPaySecretKey = sandboxSecretKey;

// Function to make the Tazapay API request
const createTazaPayCheckout = async (transactionData) => {
	const {
		customerName,
		customerEmail,
		customerCountry,
		amount,
		invoiceCurrency,
		transactionDescription,
		orderId,
	} = transactionData;

	// Convert amount to cents (remove decimal)
	const amountInCents = Math.round(amount * 100); // Ensures proper handling of decimals

	const updatedOrderId = orderId.replace("#", "");

	const options = {
		method: "POST",
		url: tazaPayURL,
		headers: {
			accept: "application/json",
			"content-type": "application/json",
			authorization: tazaPaySecretKey,
		},
		data: {
			customer_details: {
				name: customerName,
				email: customerEmail,
				country: customerCountry,
			},
			invoice_currency: invoiceCurrency, // Default to 'USD' if not provided
			amount: amountInCents,
			transaction_description: transactionDescription,
			// success_url: `http://localhost:5173/tazaPay/payment-success/${updatedOrderId}`,
			success_url: `https://foxx-funded.com/tazaPay/payment-success/${updatedOrderId}`,
			cancel_url: "http://foxx-funded.com",
		},
	};

	try {
		// Make the request to TazaPay API
		const response = await axios.request(options);

		// Check if the response is successful (status code 200)
		if (response) {
			// Extract paymentId and other necessary data
			const paymentId = response?.data?.data?.id;
			const redirectURL = response?.data?.data?.url;
			const success_url = response?.data?.data?.success_url;

			// Create the checkout object with the necessary details
			const createdCheckout = await MTazaPay.create({
				customerName,
				customerEmail,
				customerCountry,
				amount,
				invoiceCurrency,
				transactionDescription,
				tazaPayData: {
					redirectURL,
				},
				orderId,
				paymentId,
			});

			// Return the created checkout object
			return {
				createdCheckout,
				success_url,
			};
		} else {
			throw new Error("Tazapay API response not successful");
		}
	} catch (error) {
		throw new Error("Tazapay API request failed: " + error.message);
	}
};

const getTazaPayCheckout = async (orderId) => {
	try {
		// Run both database queries in parallel using Promise.all
		const [tazaPayDataResponse, orderResponse] = await Promise.all([
			MTazaPay.findOne({ orderId: `#${orderId}` }),
			MOrder.findOne({ orderId: `#${orderId}` }),
		]);

		// Extract the paymentId if available
		const paymentId = tazaPayDataResponse?.paymentId;

		if (!paymentId) {
			throw new Error("Payment ID not found");
		}

		// Define request options for the API
		const options = {
			method: "GET",
			url: `${tazaPayURL}/${paymentId}`, // Use template literals directly
			headers: {
				accept: "application/json",
				"content-type": "application/json",
				authorization: tazaPaySecretKey,
			},
			timeout: 5000, // Set a timeout for the request
		};

		// Make the API request to TazaPay
		const response = await axios.request(options);

		// Extract the data from the response
		const tazaPayData = response.data?.data;

		if (!tazaPayData) {
			throw new Error("TazaPay data not available in the response");
		}

		// Proceed to next steps with tazaPayData
		return {
			tazaPayData,
			orderResponse,
		};
	} catch (error) {
		// Pass the error message for better error debugging
		throw new Error(`Tazapay API request failed: ${error.message}`);
	}
};

const checkMt5AccountService = async (orderId) => {
	try {
		// Find a user with an MT5 account matching the given orderId (productId)
		const user = await MUser.findOne({
			"mt5Accounts.productId": `#${orderId}`,
		});

		if (user) {
			return {
				success: true,
				message: `MT5 account found for the given orderId: #${orderId}`,
			};
		} else {
			return {
				success: false,
				message: `No MT5 account found for the given orderId: ${orderId}`,
			};
		}
	} catch (error) {
		console.error("Error checking MT5 account:", error);
		return {
			success: false,
			message: "An error occurred while checking the MT5 account",
		};
	}
};

module.exports = {
	createTazaPayCheckout,
	getTazaPayCheckout,
	checkMt5AccountService,
};

// 🚀 ~ createTazaPayCheckout ~ transactionData: {
// 	customerName: 'Sajid Abdullah TEST',
// 	customerEmail: 'clashking1545@gmail.com',
// 	customerCountry: 'SG',
// 	amount: 45.5,
// 	invoiceCurrency: 'USD',
// 	transactionDescription: '1 x T-shirt',
// 	orderId: '#840038'
//   }
