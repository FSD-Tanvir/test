// const fetch = require("node-fetch");
const config = require("../config/config");
const axios = require("axios");

const BASE_URL = config.matchTraderBaseURL;

// creation of normal account
const createNormalAccount = async (userDetails) => {
	const normalAccUrl = `${BASE_URL}/v1/accounts`;
	const normalAccPayload = {
		email: userDetails.email,
		password: userDetails.password,
		personalDetails: {
			firstname: userDetails.firstname,
			lastname: userDetails.lastname,
		},
		contactDetails: {
			phoneNumber: userDetails.phoneNumber || "N/A",
		},
		addressDetails: {
			country: userDetails.country || "N/A",
			city: userDetails.city || "N/A",
			postCode: userDetails.postCode || "N/A",
			address: userDetails.address || "N/A",
		},
	};
	try {
		const response = await axios.post(normalAccUrl, normalAccPayload, {
			headers: {
				Authorization: `${config.matchTraderAuthToken}`,
				"Content-Type": "application/json",
			},
		});
		return response.data;
	} catch (error) {
		console.error("Error connecting manager:", error);
		return null;
	}
};

// get normal account using email
const getNormalAccountUsingEmail = async (email) => {
	try {
		const modifiedEmail = email.toLowerCase();
		const response = await axios.get(`${BASE_URL}/v1/accounts/by-email/${modifiedEmail}`, {
			headers: {
				Authorization: `${config.matchTraderAuthToken}`,
				"Content-Type": "application/json",
			},
		});

		if (response.data.status === 500) {
			return null;
		}

		return response.data;
	} catch (error) {
		// Handle other errors
		// console.error("Error fetching account by email:", error);
	}
};

// change normal account password in Match - trader
const changeNormalAccountPassword = async (email, newPassword) => {
	try {
		const userAccount = await getNormalAccountUsingEmail(email);

		// Check if the response has a `uuid`, indicating success
		if (userAccount?.uuid) {
			const accountUuid = userAccount.uuid;

			const response = await axios.post(
				`${BASE_URL}/v1/change-password`,
				{
					accountUuid,
					newPassword,
				},
				{
					headers: {
						Authorization: `${config.matchTraderAuthToken}`,
						"Content-Type": "application/json",
					},
				}
			);

			console.log("🚀 ~ changeNormalAccountPassword ~ response:", response.statusText);
			return response.statusText; // "OK"
		} else {
			// Handle the case where userAccount does not contain a valid UUID
			console.error("Error: User account not found or UUID missing.");
			return "User account not found or invalid UUID";
		}
	} catch (error) {
		// Check if the error is from the broker API
		if (error.response && error.response.status === 500) {
			console.error("Internal application error:", error.response.data);
			return "Internal application error. Please try again later.";
		} else {
			// Handle other types of errors
			console.error("Error changing password:", error);
			throw error; // Re-throw error for further handling
		}
	}
};

// manual deposit in trading account
const manualDepositInTradingAccount = async (depositData) => {
	try {
		const depositUrl = `${BASE_URL}/v1/deposits/manual`;

		const payload = {
			systemUuid: config.matchTraderSystemUUID,
			login: depositData.login,
			paymentGatewayUuid: config.paymentGatewayId,
			amount: depositData.amount,
			comment: depositData.comment || "Manual deposit",
		};

		const response = await axios.post(depositUrl, payload, {
			headers: {
				Authorization: `${config.matchTraderAuthToken}`,
				"Content-Type": "application/json",
			},
		});

		// Return the response data from the API
		return response.data;
	} catch (error) {
		// Handle any errors that occur during the request
		console.error("Error processing manual deposit:", error.message);
	}
};

// creation of trading account in Match Trader manager
const createTradingAccount = async (accountUuid, offerUuid) => {
	try {
		const payload = {
			offerUuid: offerUuid,
		};

		const response = await axios.post(
			`${BASE_URL}/v1/accounts/${accountUuid}/trading-accounts`,
			payload,
			{
				headers: {
					Authorization: `${config.matchTraderAuthToken}`,
					"Content-Type": "application/json",
				},
			}
		);

		// Return the response data from the API
		return response.data;
	} catch (error) {
		// Handle any errors that occur during the request
		console.error("Error creating trading account:", error.response?.data || error.message);
	}
};

// create trading account and deposit
const createTradingAccountAndDeposit = async (userDetails) => {
	try {
		// Check if the normal account already exists
		let normalAccount = await getNormalAccountUsingEmail(userDetails.email);
		let normalAccUUID = normalAccount?.uuid;

		if (normalAccUUID) {
			const tradingAccount = await createTradingAccount(normalAccUUID, userDetails.offerUuid);

			if (!tradingAccount || !tradingAccount.login) {
				throw new Error("Failed to create trading account");
			}

			// Proceed with manual deposit into the trading account
			const deposit = await manualDepositInTradingAccount({
				login: tradingAccount.login,
				amount: userDetails.depositAmount,
				comment: "Manual deposit",
			});

			if (!deposit) {
				throw new Error("Failed to process manual deposit");
			}

			console.log("Trading account created and deposit made successfully");
			return {
				success: true,
				message: "Trading account created and deposit made successfully",
				accountDetails: {
					normalAccount,
					tradingAccount,
					deposit,
				},
			};
		}

		normalAccount = await createNormalAccount(userDetails);

		normalAccUUID = normalAccount?.uuid;

		const tradingAccount = await createTradingAccount(normalAccUUID, userDetails.offerUuid);

		if (!tradingAccount || !tradingAccount.login) {
			throw new Error("Failed to create trading account");
		}

		// Proceed with manual deposit into the trading account
		const deposit = await manualDepositInTradingAccount({
			login: tradingAccount.login,
			amount: userDetails.depositAmount,
			comment: "Manual deposit",
		});

		if (!deposit) {
			throw new Error("Failed to process manual deposit");
		}

		console.log("Trading account created and deposit made successfully");

		return {
			success: true,
			message: "Trading account created and deposit made successfully",
			accountDetails: {
				normalAccount,
				tradingAccount,
				deposit,
			},
		};
	} catch (error) {
		console.error("Error in createTradingAccountAndDeposit:", error.message);
		return {
			success: false,
			message: error.message || "An unexpected error occurred",
		};
	}
};

// Withdrawal of balance from trading account in Match Trader manager
const manualWithdrawalInTradingAccount = async (withdrawalData) => {
	console.log("Withdrawal Data:", withdrawalData);
	try {
		const response = await axios.post(
			`${BASE_URL}/v1/withdrawals/manual`,
			{
				systemUuid: config.matchTraderSystemUUID,
				login: withdrawalData.login,
				paymentGatewayUuid: config.paymentGatewayId,
				amount: withdrawalData.amount,
				comment: "Manual withdrawal",
			},
			{
				headers: {
					Authorization: `${config.matchTraderAuthToken}`,
					"Content-Type": "application/json",
				},
			}
		);

		return response.data; // Return response from the API
	} catch (error) {
		console.error("Error during manual withdrawal:", error.response?.data || error.message);
	}
};

// Get all trading accounts
const getAllTradingAccounts = async () => {
	try {
		const response = await axios.get(`${BASE_URL}/v1/trading-accounts`, {
			headers: {
				Authorization: `${config.matchTraderAuthToken}`,
				"Content-Type": "application/json",
			},
		});
		return response.data;
	} catch (error) {
		console.error("Error fetching trading accounts:", error.message);
		throw error;
	}
};

// Get Trading Account by login (Account Number)
const getSingleTradingAccount = async (login) => {
	const response = await axios.get(`${BASE_URL}/v1/trading-account`, {
		headers: {
			Authorization: `${config.matchTraderAuthToken}`,
			"Content-Type": "application/json",
		},
		params: {
			systemUuid: config.matchTraderSystemUUID,
			login: login,
		},
	});

	return response.data;
};

// get opened positions
const getOpenedPositions = async (login) => {
	try {
		const response = await axios.get(
			`${BASE_URL}/v1/trading-accounts/trading-data/open-positions`,
			{
				headers: {
					Authorization: `${config.matchTraderAuthToken}`,
					"Content-Type": "application/json",
				},
				params: {
					systemUuid: config.matchTraderSystemUUID,
					login,
				},
			}
		);
		return response?.data?.positions;
	} catch (error) {
		console.error(`Error fetching open positions for ${login}`);
	}
};

// get closed positions
const getClosedPositions = async (login) => {
	try {
		const response = await axios.get(
			`${BASE_URL}/v1/trading-accounts/trading-data/closed-positions`,
			{
				headers: {
					Authorization: `${config.matchTraderAuthToken}`,
					"Content-Type": "application/json",
				},
				params: {
					systemUuid: config.matchTraderSystemUUID,
					login,
				},
			}
		);
		return response.data?.closedPositions;
	} catch (error) {
		console.error(`Error fetching closed positions: ${login}`);
	}
};

// close all orders (❌❌)
const closeAllOrders = async (logins) => {
	const response = await axios.post(
		`${BASE_URL}/v1/trading-accounts/positions/close-all`,
		{
			systemUuid: config.matchTraderSystemUUID,
			logins: logins, // This should be an array of login IDs
		},
		{
			headers: {
				Authorization: config.matchTraderAuthToken,
				"Content-Type": "application/json",
			},
		}
	);

	return response.data;
};

// update trading account
// access: "FULL", "CLOSE_ONLY", "TRADING_DISABLED", "TRADING_AND_LOGIN_DISABLED"
/* const updateData = {
  access: "TRADING_DISABLED",
}; */

const updateTradingAccount = async (login, updateData) => {
	try {
		const response = await axios.patch(`${BASE_URL}/v1/trading-account`, updateData, {
			headers: {
				Authorization: `Bearer ${config.matchTraderAuthToken}`,
				"Content-Type": "application/json",
			},
			params: {
				systemUuid: config.matchTraderSystemUUID,
				login: login,
			},
		});
		return response.data;
	} catch (error) {
		console.error(
			"Error updating trading account:",
			error.response ? error.response.data : error.message
		);
	}
};

module.exports = {
	getNormalAccountUsingEmail,
	manualDepositInTradingAccount,
	createNormalAccount,
	createTradingAccount,
	createTradingAccountAndDeposit,
	manualWithdrawalInTradingAccount,
	getSingleTradingAccount,
	getOpenedPositions,
	getClosedPositions,
	changeNormalAccountPassword,
	getAllTradingAccounts,
	closeAllOrders,
	updateTradingAccount,
};
