// utils/generateCustomId.js
const Counter = require("../counterSchema.js"); // Adjust the path as necessary

const generateCustomId = async (prefix) => {
	const counter = await Counter.findByIdAndUpdate(
		{ _id: prefix },
		{ $inc: { seq: 1 } },
		{ new: true, upsert: true }
	);

	const number = counter.seq.toString().padStart(6, "0"); // Always 6 digits
	return `${prefix}${number}`;
};

module.exports = generateCustomId;
