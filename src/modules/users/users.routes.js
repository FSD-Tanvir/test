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
    manualChallengePassHandler,
    getOnlyUserHandlerByEmail,
    downloadAllUsersCsvHandler,
} = require("./users.controller.js");
// Route to create a new user in database and in mt5 manager
router.post("/create-user", createMt5Account);

// Route to create a new user in database
router.put("/update-mt5-status/:account", updateMt5AccountStatusHandler);

// to send credentials through email
router.post("/credentials", credentials);

// get all mt5 accounts
router.get("/mt5-accounts", getAllMt5Accounts);

// Route to get users with 'funded' challenge stage
router.get("/funded", getFundedUsers);

router.get("/download-all-users-csv", downloadAllUsersCsvHandler);

// get phase based accounts
router.get("/phased-users/:account", getPhasedUsers);

// get single user
router.get("/:id", getUserById);
// router.get("/:id", authMiddleware, getUserById);

// get only user data, not mt5 data
router.get("/single-user/:id", getOnlyUserHandler);

// manually pass user
router.get("/pass-user/:id", manualChallengePassHandler);

// router.get("/", authMiddleware, getAllUsers);
router.get("/", getAllUsers);

router.post("/login", loginUser);

router.put("/:id", updateUser);

router.put("/change-password/:account", changePasswordController);

router.post("/forgot-password", forgotPassword);

router.post("/verify-otp", verifyOtp);

router.post("/reset-password", resetPassword);

router.post("/normal-register", normalRegister);

router.post("/normal-login", normalLogin);

// Route to update purchased products for a user
router.put("/:userId/purchased-products", updatePurchasedProductsHandler);

module.exports = router;
