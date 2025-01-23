const deepMerge = require("../../helper/utils/deepMerge");
const { MChallenge } = require("./challenges.schema");
const mongoose = require("mongoose");

/**
 * Service to create a new challenge
 * @param {Object} challengeData - Data for the new challenge
 * @returns {Object} - The created challenge
 * @throws {Error} - If creation fails
 */
const createChallenge = async (challengeData) => {
	try {
		const newChallenge = new MChallenge(challengeData); // Initialize with new instance
		await newChallenge.save(); // Save the document
		return newChallenge;
	} catch (error) {
		throw error;
	}
};
/**
 * Service to get all challenges
 * @returns {Array} - List of all challenges
 * @throws {Error} - If fetching fails
 */
const getAllChallenges = async () => {
	try {
		return await MChallenge.find();
	} catch (error) {
		throw error;
	}
};

/**
 * Service to get all active challenges
 * @returns {Array} - List of all active challenges
 * @throws {Error} - If fetching fails
 */
const getAllActiveChallenges = async () => {
	try {
		return await MChallenge.find({ status: "active" });
	} catch (error) {
		throw error;
	}
};

/**
 * Service to get a single challenge by name
 * @param {String} challengeName - Name of the challenge
 * @returns {Object} - The found challenge
 * @throws {Error} - If fetching fails
 */
const getChallengeByName = async (challengeName) => {
	try {
		const challenge = await MChallenge.findOne({
			challengeName: { $regex: new RegExp(`^${challengeName}$`, "i") },
		});
		return challenge;
	} catch (error) {
		throw error;
	}
};

/**
 * Service to update a single challenge by name
 * @param {String} challengeName - Name of the challenge
 * @param {Object} updateFields - Fields to update
 * @returns {Object} - The updated challenge
 * @throws {Error} - If updating fails
 */

const updateSingleChallenge = async (id, updateFields) => {
	try {
		const challenge = await MChallenge.findById(id);
		if (!challenge) {
			throw new Error("Challenge not found");
		}

		// Use deepMerge to merge updateFields into the existing challenge
		deepMerge(challenge, updateFields);

		// Save the updated challenge and return the latest version
		const updatedChallenge = await challenge.save();

		return updatedChallenge;
	} catch (error) {
		console.error(error);
		throw new Error("Error updating the challenge");
	}
};

module.exports = {
	createChallenge,
	getAllChallenges,
	getAllActiveChallenges,
	getChallengeByName,
	updateSingleChallenge,
};
