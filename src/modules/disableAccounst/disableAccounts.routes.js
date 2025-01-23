const express = require("express");
const router = express.Router();

const { getDisabledAccountHandler,getAllDisabledAccounts } = require("./disableAccounst.controller");

router.get("/:account", getDisabledAccountHandler);
// New route to get all disabled accounts
router.get("/", getAllDisabledAccounts);



module.exports = router;
