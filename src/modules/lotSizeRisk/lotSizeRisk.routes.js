const express = require("express");
const {
    getLotSizeRiskDataHandler,
    disableLotRiskedAccountHandler,
    sendLotSizeWarningEmailHandler,
} = require("./lotSizeRisk.controller");

const router = express.Router();

router.get("/get-lot-size-risk", getLotSizeRiskDataHandler);

router.post("/disable-lot-risked-account/:account", disableLotRiskedAccountHandler);

router.post("/send-lot-size-warning-email/:account", sendLotSizeWarningEmailHandler);

module.exports = router;
