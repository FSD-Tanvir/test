const deepMerge = require("../../helper/utils/deepMerge");
const { MChallenge } = require("./challenges.schema");
const mongoose = require("mongoose");


const createChallenge = async (challengeData) => {
	try {
		const newChallenge = new MChallenge(challengeData); 
		await newChallenge.save(); 
		return newChallenge;
	} catch (error) {
		throw error;
	}
};

const getAllChallenges = async () => {
	try {
		return await MChallenge.find();
	} catch (error) {
		throw error;
	}
};


const getAllActiveChallenges = async () => {
	try {
		return await MChallenge.find({ status: "active" });
	} catch (error) {
		throw error;
	}
};


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



const updateSingleChallenge = async (id, updateFields) => {
	try {
		const challenge = await MChallenge.findById(id);
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
