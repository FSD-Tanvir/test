const express = require("express");
const {
	getMt5MetaDataHandler,
	getAccountsOverTimeHandler,
	getOrdersOverTimeHandler,
	getMetaSalesHandler,
	getSpecificChallengeSalesMetaHandler,
	getSpecificTotalChallengeSalesMetaHandler,
} = require("./meta.controller");

const router = express.Router();

// Route to get mt5 meta data from Database
router.get("/db/mt5MetaData", getMt5MetaDataHandler);

// Route for getting the number of MT5 accounts created over time (mainly for graph)
router.get("/db/mt5-accounts-created-over-time", getAccountsOverTimeHandler);

// Route for getting the number of Orders created over time (mainly for graph)
router.get("/db/orders-created-over-time", getOrdersOverTimeHandler);

// Route for getting the number of Orders created over time (mainly for graph)
router.get("/db/meta-sales", getMetaSalesHandler);

// Route for getting the number of Orders created over time (mainly for graph)
router.get("/db/specific-challenge-sales-meta", getSpecificChallengeSalesMetaHandler);

// Route for getting the number of Orders for specific challenge
router.get("/db/specific-challenge-total-sales-meta", getSpecificTotalChallengeSalesMetaHandler);

module.exports = router;
