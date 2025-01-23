const {
	getStopLossRiskData,
	sendStopLossWarningEmail,
	disableStopLossRiskedAccount,
} = require("./stopLossRisk.services");

const getStopLossRiskDataHandler = async (req, res) => {
	try {
		const { openDate, account, page = 1, limit = 10 } = req.query;

		const pageNumber = Number.parseInt(page, 10);
		const limitNumber = Number.parseInt(limit, 10);

		const accountRiskData = await getStopLossRiskData(openDate, account, pageNumber, limitNumber);

		res.status(200).json(accountRiskData);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

const disableStopLossRiskedAccountHandler = async (req, res) => {
	try {
		const { account } = req.params;
		const accountDetails = req.body;

		const disabledAccountResult = await disableStopLossRiskedAccount(account, accountDetails);

		res.status(200).json(disabledAccountResult);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};
const sendStopLossWarningEmailHandler = async (req, res) => {
	try {
		const { account } = req.params;
		const accountDetails = req.body;

		const disabledAccountResult = await sendStopLossWarningEmail(account, accountDetails);

		res.status(200).json(disabledAccountResult);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

module.exports = {
	getStopLossRiskDataHandler,
	disableStopLossRiskedAccountHandler,
	sendStopLossWarningEmailHandler,
};
