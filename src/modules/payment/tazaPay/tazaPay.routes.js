// routes/tazapayRoutes.js
const express = require("express");
const {
	createCheckout,
	getCheckout,
	checkMt5Account,
} = require("./tazaPay.controller");

const router = express.Router();

router.post("/create-checkout", createCheckout);
router.get("/get-checkout/:orderId", getCheckout);
router.get("/check-account/:orderId", checkMt5Account);

module.exports = router;
