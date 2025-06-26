const challengesMatchTraderService = require("./challengesMatchTrader.services");
const createChallenge = async (req, res) => {
	try {
		const newChallenge = await challengesMatchTraderService.createChallenge(req.body);
		res.status(201).json(newChallenge);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

const getChallenge = async (req, res) => {
	try {
		const challenges = await challengesMatchTraderService.getAllChallenges();
		res.json(challenges);
	} catch (error) {
		res.status(500).json(error);
	}
};

const getActiveChallenge = async (req, res) => {
	try {
		const challenges = await challengesMatchTraderService.getAllActiveChallenges();
		res.json(challenges);
	} catch (error) {
		res.status(500).json(error);
	}
};

const getChallengeByName = async (req, res) => {
	try {
		const challengeName = req.params.challengeName;
		const challenge = await challengesMatchTraderService.getChallengeByName(challengeName);

		if (!challenge) {
			return res.status(404).json({ error: "Challenge not found" });
		}

		res.json(challenge);
	} catch (error) {
		res.status(500).json(error);
	}
};

const updateSingleChallengeHandler = async (req, res) => {
	try {
		const { id } = req.params;

		const updateFields = req.body;
		const updatedChallenge = await challengesMatchTraderService.updateSingleChallenge(
			id,
			updateFields
		);
		res.json(updatedChallenge);
	} catch (error) {
		console.log(error);
		res.status(500).json({ error: error.message });
	}
};

module.exports = {
	createChallenge,
	getChallenge,
	getActiveChallenge,
	getChallengeByName,
	updateSingleChallengeHandler,
};
