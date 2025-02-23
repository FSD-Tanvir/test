const { getLotSizeRiskData, disableLotRiskedAccount } = require("./lotSizeRisk.services");

const getLotSizeRiskDataHandler = async (req, res) => {
    try {
        const { openDate, account, page = 1, limit = 10 } = req.query;

        const pageNumber = Number.parseInt(page, 10);
        const limitNumber = Number.parseInt(limit, 10);

        const accountRiskData = await getLotSizeRiskData(
            openDate,
            account,
            pageNumber,
            limitNumber
        );

        res.status(200).json(accountRiskData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const disableLotRiskedAccountHandler = async (req, res) => {
    try {
        const { account } = req.params;
        const accountDetails = req.body;

        const disabledAccountResult = await disableLotRiskedAccount(account, accountDetails);

        res.status(200).json(disabledAccountResult);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const sendLotSizeWarningEmailHandler = async (req, res) => {
    try {
        const { account } = req.params;
        const accountDetails = req.body;

        const disabledAccountResult = await sendLotSizeWarningEmail(account, accountDetails);

        res.status(200).json(disabledAccountResult);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getLotSizeRiskDataHandler,
    disableLotRiskedAccountHandler,
    sendLotSizeWarningEmailHandler,
};
