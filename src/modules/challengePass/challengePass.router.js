const express = require("express");
const {
	getPhasedUsersHandler,
	automateChallengePassHandler,
} = require("./challengePass.controller");
const router = express.Router();

router.get("/phasedUsers", getPhasedUsersHandler);

router.get("/challengePass-automation/:mt5Account", automateChallengePassHandler);

module.exports = router;
