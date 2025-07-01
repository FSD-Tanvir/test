const {
	getMt5MetaData,
	getOrdersOverTime,
	getMetaSales,
	getSpecificChallengeSalesMeta,
	getCombinedAccountsOverTime,
} = require("./meta.services");

const getMt5MetaDataHandler = async (req, res) => {
	try {
		const mt5MetaData = await getMt5MetaData();
		res.json(mt5MetaData);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// Controller function to get users over time
const getAccountsOverTimeHandler = async (req, res) => {
	try {
		// Extract the startDate and endDate from the request query (for GET requests)
		const { startDate, endDate } = req.query; // or use req.body for POST requests if necessary

		// Call the service function with the optional date range
		const result = await getCombinedAccountsOverTime(startDate, endDate);

		// Send the result back as a JSON response
		return res.status(200).json({
			success: true,
			data: result.data, // Return the account data
			totalCount: result.totalCount, // Return the total count
		});
	} catch (error) {
		// Handle any errors and send an appropriate response
		return res.status(500).json({
			success: false,
			message: error.message, // Provide the error message for debugging
		});
	}
};

// Controller function to get users over time
const getOrdersOverTimeHandler = async (req, res) => {
	try {
		const { startDate, endDate } = req.query;

		const result = await getOrdersOverTime(startDate, endDate);

		const { data, totalCount, totalSum } = result;

		return res.status(200).json({
			success: true,
			data,
			totalCount,
			totalSum,
		});
	} catch (error) {
		// Handle any errors and send an appropriate response
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

const getMetaSalesHandler = async (req, res) => {
	try {
		const { startDate, endDate } = req.query;
		const data = await getMetaSales(startDate, endDate);
		return res.status(200).json({
			success: true,
			data,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};
const getSpecificChallengeSalesMetaHandler = async (req, res) => {
	try {
		// Extract optional startDate and endDate from query parameters
		const { startDate, endDate } = req.query;

		// Pass startDate and endDate to getSpecificChallengeSalesMeta
		const data = await getSpecificChallengeSalesMeta(startDate, endDate);

		return res.status(200).json({
			success: true,
			data,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

module.exports = {
	getMt5MetaDataHandler,
	getAccountsOverTimeHandler,
	getOrdersOverTimeHandler,
	getMetaSalesHandler,
	getSpecificChallengeSalesMetaHandler,
};
