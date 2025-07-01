const express = require("express");

const {
	getChallenge,
	getActiveChallenge,
	updateSingleChallengeHandler,
	createChallenge,
	getChallengeByName,
} = require("./challengesMatchTrader.controller");
const router = express.Router();

// Route to create a new challenge
router.post("/create", createChallenge);

// Route to get all challenges
router.get("/", getChallenge);

// Route to get all active challenges
router.get("/active", getActiveChallenge);

// Route to get a single challenge by name
router.get("/:challengeName", getChallengeByName);

// Route to update a single challenge by name
router.put("/:id", updateSingleChallengeHandler);

module.exports = router;
