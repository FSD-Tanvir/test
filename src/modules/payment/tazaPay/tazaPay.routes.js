// routes/tazapayRoutes.js
const express = require("express");
const {
	createCheckout,
	getCheckout,
	checkMt5Account,
	sendToZapierHandler,
	checkMatchTraderAccount,
} = require("./tazaPay.controller");

const router = express.Router();

router.post("/create-checkout", createCheckout);
router.post("/send-zapier", sendToZapierHandler);
router.get("/get-checkout/:orderId", getCheckout);
router.get("/check-account/:orderId", checkMt5Account);
router.get("/check-account-match-trader/:orderId", checkMatchTraderAccount);

module.exports = router;
