const express = require("express");
const { sendWarningEmailHandlerForNewsTrading, disableRiskedAccountHandlerForNewsTrading, getAllNewsTradingRiskController } = require("./newsTradingRisk.controller");


const router = express.Router();



router.get("/", getAllNewsTradingRiskController);

router.post("/news-disable-risk-account/:account", disableRiskedAccountHandlerForNewsTrading);

router.post("/news-warning-email/:account", sendWarningEmailHandlerForNewsTrading);

module.exports = router;
