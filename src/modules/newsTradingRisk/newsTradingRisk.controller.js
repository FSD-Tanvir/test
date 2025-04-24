const cron = require("node-cron");
const { orderHistories } = require("../../thirdPartyMt5Api/thirdPartyMt5Api");

const {
    sendWarningEmailForNewsTrading,
    disableRiskedAccountForNewsTrading,
    getAccountRiskDataForNews,
} = require("./newsTradingRisk.services");
// const { instantFundingAccount } = require("../../helper/utils/instantFunding");
const { MNewsTradingRisk } = require("./newsTradingRisk.schema");
const { allAccounts } = require("../../helper/utils/allAccounts");





const chunkArray = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
};

const fetchAndSaveData = async () => {
    console.log("Fetching and saving data for news trading risk...");
    try {
        const instantFunding = await allAccounts();
        console.log(instantFunding)
        const newsTradingData = await MNewsTradingRisk.find({});
        console.log(newsTradingData)

        const startDate = "1970-01-01";
        const endDate = "2100-01-01";
        const accountChunks = chunkArray(instantFunding, 50);
        let dataSaved = false;

        for (const chunk of accountChunks) {
            const bulkOps = [];

            for (const funding of chunk) {
                const { account, email } = funding;
                const orders = await orderHistories(account, startDate, endDate);

                // Skip accounts with undefined or non-array orders
                if (!orders || !Array.isArray(orders)) {
                    console.warn(`Skipping account ${account} as no data found:`, []);
                    continue;
                }

                for (const news of newsTradingData) {
                    for (const order of orders) {
                        const openTime = new Date(new Date(order.openTime).getTime() + 6 * 60 * 60 * 1000);
                        const closeTime = new Date(new Date(order.closeTime).getTime() + 6 * 60 * 60 * 1000);
                        const accountNumber = order.login || funding.account;

                        const newsTime = new Date(news.newsDate);
                        const TWO_MINUTES = 2 * 60 * 1000;
                        const openDiff = Math.abs(openTime - newsTime);
                        const closeDiff = Math.abs(closeTime - newsTime);

                        if (openDiff <= TWO_MINUTES || closeDiff <= TWO_MINUTES) {
                            const matchedData = {
                                ticket: order.ticket,
                                account: accountNumber,
                                email,
                                openTime: new Date(new Date(order.openTime).getTime() + 6 * 60 * 60 * 1000),
                                closeTime: new Date(new Date(order.closeTime).getTime() + 6 * 60 * 60 * 1000),
                                emailSent: false,
                                isDisabled: false,
                                message: "Matched order within news trading window."
                            };

                            bulkOps.push({
                                updateOne: {
                                    filter: { _id: news._id },
                                    update: { $push: { newsTradingRiskAccountDetails: matchedData } }
                                }
                            });

                            dataSaved = true;
                        }
                    }
                }
            }

            if (bulkOps.length > 0) {
                await MNewsTradingRisk.bulkWrite(bulkOps);
            }
        }

        if (dataSaved) {
            console.log("Matching data was found and saved successfully.");
        } else {
            console.log("No matching data found. No records were saved.");
        }
    } catch (error) {
        console.error("Error processing data:", error);
    }
};


const getAccountRiskDataHandlerForNewsTrading = async (req, res) => {
    try {
        const { openTime, account, page = 1, limit = 10 } = req.query;
        const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);
        const limitNumber = Math.max(1, Number.parseInt(limit, 10) || 10);

        const accountRiskData = await getAccountRiskDataForNews(
            openTime,
            account,
            pageNumber,
            limitNumber
        );

        res.status(200).json(accountRiskData);
    } catch (error) {
        res.status(500).json({ error: `Error fetching data: ${error.message}` });
    }
};

const sendWarningEmailHandlerForNewsTrading = async (req, res) => {
    try {
        const { account } = req.params;
        const accountDetails = req.body;

        const warningResult = await sendWarningEmailForNewsTrading(account, accountDetails);

        res.status(200).json(warningResult);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const disableRiskedAccountHandlerForNewsTrading = async (req, res) => {
    try {
        const { account } = req.params;
        const accountDetails = req.body;

        const disabledAccountResultForNewsTrading = await disableRiskedAccountForNewsTrading(
            account,
            accountDetails
        );

        res.status(200).json(disabledAccountResultForNewsTrading);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    fetchAndSaveData,
    // storeNewTradingAccount,
    sendWarningEmailHandlerForNewsTrading,
    disableRiskedAccountHandlerForNewsTrading,
    getAccountRiskDataHandlerForNewsTrading,
};




