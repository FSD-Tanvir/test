const deepMerge = require("../../helper/utils/deepMerge");
const mongoose = require("mongoose");
const { MChallengeMatchTrader } = require("./challengesMatchTrader.schema");

const createChallenge = async (challengeData) => {
	try {
		const newChallenge = new MChallengeMatchTrader(challengeData);
		await newChallenge.save();
		return newChallenge;
	} catch (error) {
		throw error;
	}
};

const getAllChallenges = async () => {
	try {
		return await MChallengeMatchTrader.find();
	} catch (error) {
		throw error;
	}
};

const getAllActiveChallenges = async () => {
	try {
		return await MChallengeMatchTrader.find({ status: "active" });
	} catch (error) {
		throw error;
	}
};

const getChallengeByName = async (challengeName) => {
	try {
		const challenge = await MChallengeMatchTrader.findOne({
			challengeName: { $regex: new RegExp(`^${challengeName}$`, "i") },
		});
		return challenge;
	} catch (error) {
		throw error;
	}
};

const updateSingleChallenge = async (id, updateFields) => {
	try {
		const challenge = await MChallengeMatchTrader.findById(id);
		if (!challenge) {
			throw new Error("Challenge not found");
		}
		deepMerge(challenge, updateFields);
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
