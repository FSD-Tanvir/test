const express = require("express");
const { sendWarningEmailHandlerForNewsTrading, disableRiskedAccountHandlerForNewsTrading, getAccountRiskDataHandlerForNewsTrading } = require("./newsTradingRisk.controller");


const router = express.Router();



router.get("/get-trading-risk", getAccountRiskDataHandlerForNewsTrading);

router.post("/news-disable-risk-account/:account", disableRiskedAccountHandlerForNewsTrading);

router.post("/news-warning-email/:account", sendWarningEmailHandlerForNewsTrading);

module.exports = router;
