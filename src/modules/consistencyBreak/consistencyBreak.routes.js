const express = require("express");
const {
    getConsistencyBreakDataHandler,
    disableConsistencyBreakAccountHandler,
    sendConsistencyBreakWarningEmailHandler,
} = require("./consistencyBreak.controller");

const router = express.Router();

// Route to handle GET requests for all orders
router.get("/get-consistency-break", getConsistencyBreakDataHandler);

router.post("/consistency-break-risk-account/:account", disableConsistencyBreakAccountHandler);

router.post("/consistency-break-warning-email/:account", sendConsistencyBreakWarningEmailHandler);

module.exports = router;
