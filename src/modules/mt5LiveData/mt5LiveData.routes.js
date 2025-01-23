const express = require("express");
const { getLiveMt5Data } = require("./mt5LiveData.controller");
const router = express.Router();

// get live mt5 data
router.get("/:account", getLiveMt5Data);

module.exports = router;
