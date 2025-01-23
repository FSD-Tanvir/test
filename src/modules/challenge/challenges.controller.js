const challengesService = require("./challenges.services");

/**
 * Controller to create a new challenge
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createChallenge = async (req, res) => {
	try {
		// TODO: 💗 handle challenge uniquenessb
		const newChallenge = await challengesService.createChallenge(req.body);
		res.status(201).json(newChallenge);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

/**
 * Controller to get all challenges
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getChallenge = async (req, res) => {
	try {
		const challenges = await challengesService.getAllChallenges();
		res.json(challenges); // Respond with all challenges
	} catch (error) {
		res.status(500).json(error); // Respond with error if fetching fails
	}
};

/**
 * Controller to get all active challenges
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getActiveChallenge = async (req, res) => {
	try {
		const challenges = await challengesService.getAllActiveChallenges();
		res.json(challenges); // Respond with all active challenges
	} catch (error) {
		res.status(500).json(error); // Respond with error if fetching fails
	}
};

/**
 * Controller to get a single challenge by name
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getChallengeByName = async (req, res) => {
	try {
		const challengeName = req.params.challengeName;
		const challenge = await challengesService.getChallengeByName(challengeName);

		if (!challenge) {
			return res.status(404).json({ error: "Challenge not found" }); // Respond with 404 if challenge is not found
		}

		res.json(challenge); // Respond with the found challenge
	} catch (error) {
		res.status(500).json(error); // Respond with error if fetching fails
	}
};

/**
 * Controller to update a single challenge by name
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */

const updateSingleChallengeHandler = async (req, res) => {
	try {
		const { id } = req.params;

		const updateFields = req.body; // Fields to update sent in the request body

		// Call the service function to update the challenge
		const updatedChallenge = await challengesService.updateSingleChallenge(
			id,
			updateFields,
		);

		// Respond with the updated challenge object
		res.json(updatedChallenge);
	} catch (error) {
		console.log(error);
		// Handle errors and respond with a 500 status code and error message
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
