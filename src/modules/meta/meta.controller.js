const {
	getMt5MetaData,
	getUsersOverTime,
	getOrdersOverTime,
	getAccountsOverTime,
	getMetaSales,
	getSpecificChallengeSalesMeta,
	getSpecificTotalChallengeSalesMeta,
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
		const result = await getAccountsOverTime(startDate, endDate);

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
		// Extract the startDate and endDate from the request query (or body, if preferred)
		const { startDate, endDate } = req.query; // or req.body for POST request

		// Call the service function with the date range
		const result = await getOrdersOverTime(startDate, endDate);

		// Extract data and totalCount from the result
		const { data, totalCount } = result;

		// Send the result back as a JSON response with the existing structure
		return res.status(200).json({
			success: true,
			data, // Orders over time data
			totalCount, // Total count of orders in the selected date range
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
		const data = await getMetaSales();
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

const getSpecificTotalChallengeSalesMetaHandler = async (req, res) => {
	try {
		// Extract optional startDate and endDate from query parameters
		const { startDate, endDate } = req.query;

		// Pass startDate and endDate to getSpecificChallengeSalesMeta
		const data = await getSpecificTotalChallengeSalesMeta(startDate, endDate);

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
	getSpecificTotalChallengeSalesMetaHandler,
};
