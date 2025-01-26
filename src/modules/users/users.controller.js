const { getAllAccountSummery } = require("../../thirdPartyMt5Api/thirdPartyMt5Api.js");
const { fetchDisabledAccounts } = require("../disableAccounst/disableAccounst.controller.js");
const userService = require("./users.services.js");

/**
 * Controller to create a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 *  create user with tradelocker userId and send service .js
 */

const createMt5Account = async (req, res) => {
	try {
		const mt5Account = await userService.handleMt5AccountCreate(req.body);
		res.status(200).json(mt5Account);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

const updateMt5AccountStatusHandler = async (req, res) => {
	try {
		const { account } = req.params;

		const updateMt5Account = await userService.updateMt5AccountStatus(account, req.body);
		if (!updateMt5Account) {
			return res.status(400).json({ error: "Error updating MT5 account" });
		}
		res.status(200).json(updateMt5Account);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

const getUserById = async (req, res) => {
	try {
		// Extract the user ID from the request parameters
		const { id } = req.params;

		// Call the service function to find the user by ID and get their MT5 account details
		const user = await userService.findUserWithMt5Details(id);

		// If user is found, respond with a status of 200 and the user object in JSON format
		res.status(200).json(user);
	} catch (error) {
		// If an error occurs (e.g., user not found), respond with a status of 404 and the error message in JSON format
		res.status(404).json({ error: error.message });
	}
};

const getOnlyUserHandler = async (req, res) => {
	try {
		// Extract the user ID from the request parameters
		const { id } = req.params;

		// Call the service function to find the user by ID and get their MT5 account details
		const user = await userService.getOnlyUser(id);

		// If user is found, respond with a status of 200 and the user object in JSON format
		res.status(200).json(user);
	} catch (error) {
		// If an error occurs (e.g., user not found), respond with a status of 404 and the error message in JSON format
		res.status(404).json({ error: error.message });
	}
};

// Controller to get all users
const getAllUsers = async (req, res) => {
	try {
		const { page = 1, limit = 10, searchQuery = "" } = req.query;

		// Pass the searchQuery to the service function along with pagination parameters
		const result = await userService.getAllUsers(
			Number.parseInt(page),
			Number.parseInt(limit),
			searchQuery
		);

		res.status(200).json(result);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

// Controller to get all users with optional challengeStage filtering
const getAllMt5Accounts = async (req, res) => {
	try {
		const { page = 1, limit = 10, searchQuery = "", challengeStage = "" } = req.query;

		const pageNumber = Number.parseInt(page, 10);
		const limitNumber = Number.parseInt(limit, 10);

		const result = await userService.getAllMt5Accounts(
			pageNumber,
			limitNumber,
			searchQuery,
			challengeStage
		);

		res.status(200).json(result);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const getPhasedUsers = async (req, res) => {
	try {
		const { account } = req.params;
		const users = await userService.getPhasedUsers(account);
		res.status(200).json(users);
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

/**
 * Controller to log in a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const loginUser = async (req, res) => {
	try {
		const { email, password } = req.body;
		const { user, token } = await userService.authenticateUser(email, password);

		res.status(200).json({ user, token }); // Respond with the authenticated user and token
	} catch (error) {
		res.status(400).json({ error }); // Respond with an error
	}
};

/**
 * Controller to update a user's role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateUserRole = async (req, res) => {
	try {
		const { email, role } = req.body;
		if (!email || !role) {
			return res.status(400).json({ error: "Email and role are required" }); // Validate request body
		}

		const updatedUser = await userService.updateUserRole(email, role);

		res.status(200).json(updatedUser); // Respond with the updated user
	} catch (error) {
		res.status(400).json({ error: error.message }); // Respond with an error
	}
};

/**
 * Controller to update a user's role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateUser = async (req, res) => {
	try {
		const { id } = req.params;

		const updatedUser = await userService.updateUser(id, req.body);

		res.status(200).json(updatedUser); // Respond with the updated user
	} catch (error) {
		res.status(400).json({ error: error.message }); // Respond with an error
	}
};

/**
 * Controller to update purchased products of a user.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
const updatePurchasedProductsHandler = async (req, res) => {
	const { userId } = req.params; // Assuming the user ID is passed in the URL
	const productData = req.body; // The product data is sent in the request body

	try {
		const updatedUser = await userService.updatePurchasedProducts(userId, productData);
		res.status(200).json({
			message: "Purchased products updated successfully",
			data: updatedUser,
		});
	} catch (error) {
		res.status(400).json({ message: error.message });
	}
};

/**
 * Controller to handle forgot password process
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
// Forgot password handler
const forgotPassword = async (req, res) => {
	const { email } = req.body;

	try {
		const user = await userService.findUserWithEmail(email);

		if (user) {
			await userService.sendOtp(email);
			res.status(200).send({ message: "OTP sent to your email.", email });
		} else {
			res.status(404).send("Invalid email address.");
		}
	} catch (error) {
		console.error("Error in forgotPassword:", error);
		res.status(500).send("Error sending OTP. Please try again later.");
	}
};

/**
 * Controller to verify OTP
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const verifyOtp = async (req, res) => {
	const { email, otp } = req.body;
	try {
		const valid = await userService.verifyOtp(email, otp);
		if (valid) {
			res.status(200).send({ message: "OTP verified. You can now reset your password." }); // Respond with success message
		} else {
			res.status(400).send("Invalid or expired OTP."); // Respond with an error message
		}
	} catch (error) {
		res.status(500).send("Error verifying OTP."); // Respond with an error
	}
};

/**
 * Controller to reset password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const resetPassword = async (req, res) => {
	const { email, newPassword } = req.body;
	try {
		const result = await userService.resetPassword(email, newPassword);

		if (result.status === 200) {
			// Password updated successfully
			return res.status(200).json({ message: result.message, user: result });
		} else if (result.status === 404) {
			// User not found
			return res.status(404).json({ error: result.message });
		} else if (result.status === 400) {
			// Validation error
			return res.status(400).json({ error: result.message });
		} else {
			// Fallback for other errors
			return res.status(500).json({ error: "Unexpected error occurred." });
		}
	} catch (error) {
		// Handle unexpected server errors
		res.status(500).json({ error: "Error resetting password." });
	}
};

const normalRegister = async (req, res) => {
	try {
		const result = await userService.normalRegister(req.body);

		res.status(201).json(result); // Respond with the created user
	} catch (error) {
		res.status(400).json({ error }); // Respond with an error
	}
};

const normalLogin = async (req, res) => {
	try {
		const result = await userService.normalLogin(req.body);
		res.status(200).json(result); // Respond with the authenticated user and token
	} catch (error) {
		res.status(400).json({ error }); // Respond with an error
	}
};

const credentials = async (req, res) => {
	try {
		const userCredentials = await userService.createUser(req.body);

		res.status(200).json(userCredentials);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

const changePasswordController = async (req, res) => {
	const { account } = req.params; // Account ID from URL parameter
	const { masterPassword } = req.body; // New password from request body

	if (!masterPassword) {
		return res.status(400).json({ message: "New password is required" });
	}

	try {
		const result = await userService.updatePassword(account, masterPassword);

		res.status(200).json({ message: "Password changed successfully", result });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
};

const getFundedUsers = async (req, res) => {
	try {
		// Fetch funded users
		const fundedUsers = await userService.findFundedUsers();

		// Fetch all disabled accounts using the helper function
		const disabledAccounts = await fetchDisabledAccounts();
		const disabledAccountIds = disabledAccounts.map((account) => account.mt5Account);

		// Filter out funded users to exclude accounts that are in disabled accounts
		const filteredFundedUsers = fundedUsers
			.map((user) => {
				user.mt5Accounts = user.mt5Accounts.filter(
					(account) => account.account && !disabledAccountIds.includes(account.account.toString())
				);
				return user;
			})
			.filter((user) => user.mt5Accounts.length > 0);

		// Select only the required fields
		const formattedUsers = filteredFundedUsers.map((user) => ({
			mt5Accounts: user.mt5Accounts.map((account) => ({
				account: account.account,
				challengeStage: account.challengeStage,
				challengeStageData: {
					challengeName: account.challengeStageData?.challengeName,
					accountSize: account.challengeStageData?.accountSize,
				},
			})),
		}));

		// Fetch all account details
		const getAllAccountDetails = await getAllAccountSummery();

		// Convert getAllAccountDetails to a map for faster lookup
		const accountDetailsMap = Object.fromEntries(
			getAllAccountDetails.map((detail) => [detail.login, detail.balance])
		);

		// Add balance and profit to matching accounts and filter by balance > accountSize
		const enrichedUsers = formattedUsers
			.map((user) => ({
				mt5Accounts: user.mt5Accounts
					.map((account) => {
						const balance = accountDetailsMap[account.account];
						const accountSize = account.challengeStageData.accountSize;
						if (balance !== undefined && balance > accountSize) {
							return {
								...account,
								balance,
								profit: balance - accountSize,
							};
						}
						return null;
					})
					.filter((account) => account !== null),
			}))
			.filter((user) => user.mt5Accounts.length > 0);

		// Calculate total profit by summing up all individual profits
		const totalProfit = enrichedUsers.reduce((sum, user) => {
			return sum + user.mt5Accounts.reduce((acc, account) => acc + account.profit, 0);
		}, 0);

		res.status(200).json({
			success: true,
			message:
				"Funded users with active accounts, balance, and profit (balance > account size) fetched successfully",
			totalProfit, // Add the total profit here
			data: enrichedUsers,
		});
	} catch (error) {
		console.error("Error fetching funded users:", error);
		res.status(500).json({
			success: false,
			message: "Failed to fetch funded users",
			error: error.message,
		});
	}
};

module.exports = {
	createMt5Account,
	getUserById,
	forgotPassword,
	verifyOtp,
	resetPassword,
	getOnlyUserHandler,
	getAllUsers,
	loginUser,
	updateUserRole,
	normalLogin,
	normalRegister,
	updatePurchasedProductsHandler,
	updateUser,
	getAllMt5Accounts,
	getPhasedUsers,
	credentials,
	changePasswordController,
	updateMt5AccountStatusHandler,
	getFundedUsers,
};
