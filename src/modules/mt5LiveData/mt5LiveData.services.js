const StoreDataModel = require("../breach/breach.schema");

let aggregatedResults = [];

// Function to process the result array and ensure uniqueness
const processResultArray = (resultArray) => {
	const existingEntries = new Map(
		aggregatedResults.map((item) => [item.mt5Account, item]),
	);
	resultArray.forEach((result) =>
		existingEntries.set(result.MT4Account, result),
	);
	aggregatedResults = Array.from(existingEntries.values());
};

const liveMt5Data = (account) => {
	// console.log(account);
	try {
		const filteredResults = aggregatedResults.filter(
			(item) => item.mt5Account === parseInt(account, 10),
		);
		// console.log(aggregatedResults);
		return filteredResults.length > 0 ? filteredResults : null;
	} catch (error) {
		console.error("Error in getDrawdownData service:", error);
		return null;
	}
};

module.exports = { liveMt5Data, processResultArray };
