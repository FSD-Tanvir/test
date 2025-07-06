const express = require("express");
const router = express.Router();

const {
	getDisabledAccountHandler,
	getAllDisabledAccounts,
	createManuallyDisabledAccountHandler,
} = require("./disableAccounts.controller");

router.get("/:account", getDisabledAccountHandler);
// New route to get all disabled accounts
router.get("/", getAllDisabledAccounts);

router.post("/disable-account-manually", createManuallyDisabledAccountHandler);

module.exports = router;
