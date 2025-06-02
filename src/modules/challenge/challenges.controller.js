const challengesService = require("./challenges.services");
const createChallenge = async (req, res) => {
	try {
		const newChallenge = await challengesService.createChallenge(req.body);
		res.status(201).json(newChallenge);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

const getChallenge = async (req, res) => {
	try {
		const challenges = await challengesService.getAllChallenges();
		res.json(challenges);
	} catch (error) {
		res.status(500).json(error);
	}
};


const getActiveChallenge = async (req, res) => {
	try {
		const challenges = await challengesService.getAllActiveChallenges();
		res.json(challenges);
	} catch (error) {
		res.status(500).json(error);
	}
};


const getChallengeByName = async (req, res) => {
	try {
		const challengeName = req.params.challengeName;
		const challenge = await challengesService.getChallengeByName(challengeName);

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
		const updatedChallenge = await challengesService.updateSingleChallenge(
			id,
			updateFields,
		);
		res.json(updatedChallenge);
	} catch (error) {
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
