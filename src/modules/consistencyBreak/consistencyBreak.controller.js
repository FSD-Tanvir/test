const { getConsistencyBreakData } = require("./consistencyBreak.services");

const getConsistencyBreakDataHandler = async (req, res) => {
    try {
        const { openDate, account, page = 1, limit = 10 } = req.query;

        const pageNumber = Number.parseInt(page, 10);
        const limitNumber = Number.parseInt(limit, 10);

        const accountRiskData = await getConsistencyBreakData(
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

module.exports = {
    getConsistencyBreakDataHandler,
};
