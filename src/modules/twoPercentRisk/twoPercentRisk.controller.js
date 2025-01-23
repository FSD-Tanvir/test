const {
	getAccountRiskData,
	disableRiskedAccount,
	sendWarningEmail,
} = require("./twoPercentRisk.services");

const getAccountRiskDataHandler = async (req, res) => {
	try {
		const { openDate, account, page = 1, limit = 10 } = req.query;

		// Convert page and limit to numbers, defaulting to page 1 and limit 10 if not provided
		const pageNumber = Number.parseInt(page, 10);
		const limitNumber = Number.parseInt(limit, 10);

		// Call the service with openDate, account, page, and limit
		const accountRiskData = await getAccountRiskData(
			openDate,
			account,
			pageNumber,
			limitNumber,
		);

		res.status(200).json(accountRiskData);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};
const disableRiskedAccountHandler = async (req, res) => {
	try {
		const { account } = req.params;
		const accountDetails = req.body;

		const disabledAccountResult = await disableRiskedAccount(
			account,
			accountDetails,
		);

		res.status(200).json(disabledAccountResult);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};


const sendWarningEmailHandler = async (req, res) => {
	try {
		const { account } = req.params;
		const accountDetails = req.body;

		const disabledAccountResult = await sendWarningEmail(
			account,
			accountDetails,
		);

		res.status(200).json(disabledAccountResult);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

module.exports = {
	getAccountRiskDataHandler,
	disableRiskedAccountHandler,
	sendWarningEmailHandler,
};
