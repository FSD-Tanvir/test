const express = require("express");
const { getConsistencyBreakDataHandler } = require("./consistencyBreak.controller");

const router = express.Router();

// Route to handle GET requests for all orders
router.get("/get-consistency-break", getConsistencyBreakDataHandler);

module.exports = router;
