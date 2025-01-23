const express = require("express");
const {
	getAccountRiskDataHandler,
	disableRiskedAccountHandler,
	sendWarningEmailHandler,
} = require("./twoPercentRisk.controller");

const router = express.Router();

// Route to handle GET requests for all orders
router.get("/get-trading-risk", getAccountRiskDataHandler);

router.post("/disable-risk-account/:account", disableRiskedAccountHandler);

router.post("/warning-email/:account", sendWarningEmailHandler);

module.exports = router;
