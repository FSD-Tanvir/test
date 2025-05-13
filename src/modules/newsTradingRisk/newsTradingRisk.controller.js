const { orderHistories } = require("../../thirdPartyMt5Api/thirdPartyMt5Api");

const {
    sendWarningEmailForNewsTrading,
    disableRiskedAccountForNewsTrading,
    getAllNewsTradingRisks,
    getAccountDetailsByAccountNumber,
} = require("./newsTradingRisk.services");
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

        const newsTradingData = await MNewsTradingRisk.find({});

        const startDate = "1970-01-01";
        const endDate = "2100-01-01";
        const accountChunks = chunkArray(instantFunding, 50);
        let dataSaved = false;

        for (const chunk of accountChunks) {
            const bulkOps = [];

            for (const funding of chunk) {
                const { account, email } = funding;
                const orders = await orderHistories(account, startDate, endDate);

                if (!orders || !Array.isArray(orders)) {
                    console.warn(`Skipping account ${account} as no data found:`, []);
                    continue;
                }

                for (const news of newsTradingData) {
                    const newsDateOriginal = new Date(news.newsDate);
                    const newsDate = new Date(newsDateOriginal);
                    // console.log("newsDate", newsDate);

                    const dayStart = new Date(newsDateOriginal); // New copy again
                    dayStart.setHours(0, 0, 0, 0);

                    const dayEnd = new Date(newsDateOriginal);
                    dayEnd.setHours(23, 59, 59, 999); // Use this instead of 24:00 which is invalid

                    for (const order of orders) {
                        const openTime = new Date(new Date(order.openTime).getTime() + 6 * 60 * 60 * 1000);
                        const closeTime = new Date(new Date(order.closeTime).getTime() + 6 * 60 * 60 * 1000);
                        const accountNumber = order.login || funding.account;

                        const TWO_MINUTES = 2 * 60 * 1000;
                        const openDiff = Math.abs(openTime - newsDate); // Now correct
                        const closeDiff = Math.abs(closeTime - newsDate);

                        if (openDiff <= TWO_MINUTES || closeDiff <= TWO_MINUTES) {
                            const matchedData = {
                                ticket: order.ticket,
                                account: accountNumber,
                                email,
                                openTime,
                                closeTime,
                                emailSent: false,
                                isDisabled: false,
                                message: "Matched order within news trading window."
                            };

                            bulkOps.push({
                                updateOne: {
                                    filter: {
                                        _id: news._id,
                                        newsTradingRiskAccountDetails: {
                                            $not: {
                                                $elemMatch: {
                                                    account: accountNumber,
                                                    openTime: { $gte: dayStart, $lt: dayEnd }
                                                }
                                            }
                                        }
                                    },
                                    update: {
                                        $push: {
                                            newsTradingRiskAccountDetails: matchedData
                                        }
                                    }
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

const getAccountDetails = async (req, res) => {
    const { account } = req.params;

    const result = await getAccountDetailsByAccountNumber(Number(account));

    if (!result || result.length === 0) {
        return res.status(404).json({ success: false, message: 'Account not found' });
    }

    return res.status(200).json({ success: true, data: result });
};


const getAllNewsTradingRiskController = async (req, res) => {
    try {
        const risks = await getAllNewsTradingRisks();
        res.status(200).json({ success: true, data: risks });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
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

// const disableRiskedAccountHandlerForNewsTrading = async (req, res) => {
//     try {
//         const { account } = req.params;
//         const accountDetails = req.body;

//         const disabledAccountResultForNewsTrading = await disableRiskedAccountForNewsTrading(
//             account,
//             accountDetails
//         );

//         res.status(200).json(disabledAccountResultForNewsTrading);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

module.exports = {
    fetchAndSaveData,
    sendWarningEmailHandlerForNewsTrading,
    // disableRiskedAccountHandlerForNewsTrading,
    getAllNewsTradingRiskController,
    getAccountDetails,
};




