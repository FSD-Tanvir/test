const express = require("express");
const {
	getStopLossRiskDataHandler,
	sendStopLossWarningEmailHandler,
	disableStopLossRiskedAccountHandler,
} = require("./stopLossRisk.controller");

const router = express.Router();

// Route to handle GET requests for all orders
router.get("/get-stopLoss-risk", getStopLossRiskDataHandler);

router.post("/disable-risk-account/:account", disableStopLossRiskedAccountHandler);

router.post("/warning-email/:account", sendStopLossWarningEmailHandler);

module.exports = router;
