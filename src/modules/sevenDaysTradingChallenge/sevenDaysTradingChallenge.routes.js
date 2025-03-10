const express = require("express");
const { getSevenDaysTradingChallengeDataHandler } = require("./sevenDaysTradingChallenge.controller");

const router = express.Router();


// get all data for the 7 days trading challenge

router.get("/", getSevenDaysTradingChallengeDataHandler);

module.exports = router;