const express = require("express");
const router = express.Router();
const {
	forgotPassword,
	verifyOtp,
	resetPassword,
	normalRegister,
	normalLogin,
	updatePurchasedProductsHandler,
	updateUser,
	getAllUsers,
	getAllMt5Accounts,
	loginUser,
	getPhasedUsers,
	getOnlyUserHandler,
	createMt5Account,
	getUserById,
	credentials,
	changePasswordController,
	updateMt5AccountStatusHandler,
	getFundedUsers,
	createMt5TrialAccount,
} = require("./users.controller.js");
// Route to create a new user in database and in mt5 manager
router.post("/create-user", createMt5Account);

router.post("/create-trial-account", createMt5TrialAccount);

// Route to create a new user in database
router.put("/update-mt5-status/:account", updateMt5AccountStatusHandler);

// to send credentials through email
router.post("/credentials", credentials);

// get all mt5 accounts
router.get("/mt5-accounts", getAllMt5Accounts);

// Route to get users with 'funded' challenge stage
router.get("/funded", getFundedUsers);

// get phase based accounts
router.get("/phased-users/:account", getPhasedUsers);

// get single user
router.get("/:id", getUserById);
// router.get("/:id", authMiddleware, getUserById);

// get only user data, not mt5 data
router.get("/single-user/:id", getOnlyUserHandler);
// router.get("/single-user/:id", authMiddleware, getOnlyUserHandler);

// router.get("/", authMiddleware, getAllUsers);
router.get("/", getAllUsers);

// /**
//  * Route to log in a user
//  * @route POST /login
//  * @access Public
//  */
router.post("/login", loginUser);

// /**
//  * Route to update a user's role
//  * @route PUT /role
//  * @access Admin
//  */
// router.put("/role", isAdmin, updateUserRole);

// /**
//  * Route to update a user's role
//  * @route PUT /user
//  * @access Admin
//  */
router.put("/:id", updateUser);
router.put("/change-password/:account", changePasswordController);

// /**
//  * Route to initiate the forgot password process by sending an OTP
//  * @route POST /forgot-password
//  * @access Public
//  */
router.post("/forgot-password", forgotPassword);

// /**
//  * Route to verify the OTP sent to the user's email
//  * @route POST /verify-otp
//  * @access Public
//  */
router.post("/verify-otp", verifyOtp);

// /**
//  * Route to reset the user's password after verifying the OTP
//  * @route POST /reset-password
//  * @access Public
//  */
router.post("/reset-password", resetPassword);

/**
 * Route to sign up a new normal user
 * @route POST /normal-register
 * @access Public
 */
router.post("/normal-register", normalRegister);

/**
 * Route to sign in  user
 * @route POST /normal-login
 * @access Public
 */
router.post("/normal-login", normalLogin);

// Route to update purchased products for a user
router.put("/:userId/purchased-products", updatePurchasedProductsHandler);

module.exports = router;
