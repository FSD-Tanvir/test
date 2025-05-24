const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const config = require("./src/config/config");

const app = express();

app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // Parse JSON bodies
app.use(bodyParser.json()); // Parse JSON bodies using body-parser

// Importing route modules
const challengesRoutes = require("./src/modules/challenge/challenges.routes.js");
const usersRoutes = require("./src/modules/users/users.routes.js");
const orderRoutes = require("./src/modules/orders/orders.routes.js");
const couponRoutes = require("./src/modules/coupon/coupon.routes.js");
const { runAllFunctions } = require("./src/riskMangement/allfunction.js");
const affiliateRoutes = require("./src/modules/affiliate/affiliate.routes.js");
const cryptoCloudRoutes = require("./src/modules/payment/cryptoPaymentSystem/cryptoCloud.routes.js");
const zenPayRoutes = require("./src/modules/payment/zenPaymentSystem/zenPayment.routes.js");
const paytikoRoutes = require("./src/modules/payment/paytiko/paytiko.routes.js");
const challengePassRoutes = require("./src/modules/challengePass/challengePass.router.js");
const errorHandler = require("./src/middleware/errorHandler.js");
const disableAccountRoutes = require("./src/modules/disableAccounst/disableAccounts.routes.js");
const breachRoutes = require("./src/modules/breach/breach.routes.js");
const veriffRoutes = require("./src/modules/Verification/verification.routes.js");
const withdrawRequest = require("./src/modules/withDrawRequests/withDrawReuests.routes.js");
const contractRoutes = require("./src/modules/contract/contract.routes.js");
const tazaPayRoutes = require("./src/modules/payment/tazaPay/tazaPay.routes.js");
const twoPercentRisk = require("./src/modules/twoPercentRisk/twoPercentRisk.routes.js");
const leaderboard = require("./src/modules/leaderBoard/leaderBoard.router.js");
const metaRoutes = require("./src/modules/meta/meta.routes.js");
const orderHistory = require("./src/modules/withDrawRequests/withDrawReuests.routes.js");
const affiliatePayout = require("./src/modules/affiliatePayout/affiliatePayout.routes.js");
const banEmail = require("./src/modules/banEmail/banEmail.routes.js");
const consistencyBreakRoutes = require("./src/modules/consistencyBreak/consistencyBreak.routes.js");
const newsTradingRiskRoutes = require("./src/modules/newsTradingRisk/newsTradingRisk.routes.js");
const stopLossRiskRoutes = require("./src/modules/stopLossRisk/stopLossRisk.routes.js");
const lotSizeRiskRoutes = require("./src/modules/lotSizeRisk/lotSizeRisk.routes.js");
const sevenDaysTradingChallengeRoutes = require("./src/modules/sevenDaysTradingChallenge/sevenDaysTradingChallenge.routes.js");
const becomeAffiliateRequesterRoutes = require("./src/modules/becomeAffiliateRequester/becomeAffiliateRequester.routes.js");

// Route middleware
app.use("/api/foxx-funded/v1/challenges", challengesRoutes);
app.use("/api/foxx-funded/v1/users", usersRoutes);
app.use("/api/foxx-funded/v1/orders", orderRoutes);
app.use("/api/foxx-funded/v1/coupons", couponRoutes);
app.use("/api/foxx-funded/v1/affiliate", affiliateRoutes);
app.use("/api/foxx-funded/v1/crypto", cryptoCloudRoutes);
app.use("/api/foxx-funded/v1/paytiko", paytikoRoutes);
app.use("/api/foxx-funded/v1/zenPay", zenPayRoutes);
app.use("/api/foxx-funded/v1/challengePass", challengePassRoutes);
app.use("/api/foxx-funded/v1/veriff", veriffRoutes);
app.use("/api/foxx-funded/v1/disableAccount", disableAccountRoutes);
app.use("/api/foxx-funded/v1/breach", breachRoutes);
app.use("/api/foxx-funded/v1/contracts", contractRoutes);
app.use("/api/foxx-funded/v1/tazapay", tazaPayRoutes);
app.use("/api/foxx-funded/v1/twoPercentRisk", twoPercentRisk);
app.use("/api/foxx-funded/v1/withdraw", withdrawRequest);
app.use("/api/foxx-funded/v1/leaderboard", leaderboard);
app.use("/api/foxx-funded/v1/meta", metaRoutes);
app.use("/api/foxx-funded/v1/orderHistory", orderHistory);
app.use("/api/foxx-funded/v1/affiliatePayout", affiliatePayout);
app.use("/api/foxx-funded/v1/banEmail", banEmail);
app.use("/api/foxx-funded/v1/newsTradingRisk", newsTradingRiskRoutes);
app.use("/api/foxx-funded/v1/stopLossRisk", stopLossRiskRoutes);
app.use("/api/foxx-funded/v1/consistencyBreak", consistencyBreakRoutes);
app.use("/api/foxx-funded/v1/lotSizeRisk", lotSizeRiskRoutes);
app.use("/api/foxx-funded/v1/sevenDaysTradingChallenge", sevenDaysTradingChallengeRoutes);
app.use("/api/foxx-funded/v1/becomeAffiliate", becomeAffiliateRequesterRoutes);

runAllFunctions();

// Use the error handler middleware 💚💚💚 Global Error Handler
app.use(errorHandler);

// Database connection

mongoose
	.connect(config.dbConnection)
	.then(() => {
		console.log("Mongoose connected successfully");
		// Start the server only after successfully connecting to MongoDB
		app.listen(config.port, () => {
			console.log(`Server is running on port ${config.port}`);
		});
	})
	.catch((error) => {
		console.error("Error connecting to MongoDB", error);
	});

// Test route to check if server is running
app.get("/", (req, res) => {
	res.send("Foxx-Funded-server-v2-backend is running");
});

// Graceful error handling
process.on("uncaughtException", (error) => {
	console.error("Uncaught Exception:", error);
	// Optionally perform cleanup

	// Exit the process with a non-zero status code
	process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
	console.error("Unhandled Rejection at:", promise, "reason:", reason);
	// Optionally perform cleanup
	// Exit the process with a non-zero status code
	process.exit(1);
});

module.exports = app;
