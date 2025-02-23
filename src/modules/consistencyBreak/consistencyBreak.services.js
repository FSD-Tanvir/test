const { orderHistories } = require("../../thirdPartyMt5Api/thirdPartyMt5Api");
const ConsistencyBreakModel = require("./consistencyBreak.schema");
const MUser = require("../users/users.schema");

const consistencyBreak = async () => {
    const activeAccounts = await MUser.aggregate([
        {
            $project: {
                email: 1,
                mt5Accounts: {
                    $filter: {
                        input: "$mt5Accounts",
                        as: "account",
                        cond: { $eq: ["$$account.accountStatus", "active"] }
                    }
                }
            },
        },
        { $unwind: "$mt5Accounts" },
        {
            $addFields: {
                accountString: { $toString: "$mt5Accounts.account" }
            },
        },
        {
            $lookup: {
                from: "disableaccounts",
                localField: "accountString",
                foreignField: "mt5Account",
                as: "disabledAccount"
            },
        },
        {
            $match: {
                disabledAccount: { $eq: [] }
            },
        },
        {
            $replaceRoot: {
                newRoot: {
                    email: "$email",
                    account: "$mt5Accounts.account",
                    accountStatus: "$mt5Accounts.accountStatus",
                    accountSize: "$mt5Accounts.challengeStageData.accountSize"
                },
            },
        },
    ]);
    

    const startDate = "1970-01-01T00:00:00";
    const endDate = "2100-01-01T00:00:00";

    const storedTickets = await ConsistencyBreakModel.find({}, { ticket: 1 });
    const storedTicketSet = new Set(storedTickets.map((doc) => doc.ticket));

    const processBatch = async (accounts, batchNumber) => {
        console.log(`Processing batch number ${batchNumber}`);
        
        const allGroupedOrders = await Promise.all(
            accounts.map(async (account) => {
                try {
                    const orderHistory = await orderHistories(account.account, startDate, endDate);
                    if (!orderHistory) throw new Error("No order history returned");

                    const highRiskTrades = [];
                    const accountSize = account.accountSize;
                    const profitLimit = (1.5 / 100) * accountSize;

                    orderHistory.forEach((order) => {
                        const profit = order.profit;
                        const profitPercentage = (profit / accountSize) * 100;
                        const profitDifference = profit - profitLimit;

                        if (profitPercentage > 1.5 && !storedTicketSet.has(order.ticket)) {
                            highRiskTrades.push({
                                account: account.account,
                                accountSize,
                                ticket: order.ticket,
                                profit,
                                profitPercentage,
                                profitDifference,
                                profitLimit,
                                email: account.email,
                            });
                        }
                    });

                    if (highRiskTrades.length > 0) {
                        await ConsistencyBreakModel.insertMany(highRiskTrades);
                        highRiskTrades.forEach((trade) => storedTicketSet.add(trade.ticket));
                    }

                    return {
                        account: account.account,
                        email: account.email,
                    };
                } catch (error) {
                    console.error(`Failed to process account ${account.account}:`, error.message);
                    return null;
                }
            })
        );
        return allGroupedOrders.filter(Boolean);
    };

    const batchSize = 50;
    const allResults = [];

    for (let i = 0; i < activeAccounts.length; i += batchSize) {
        const batch = activeAccounts.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const results = await processBatch(batch, batchNumber);
        allResults.push(...results);
    }

    return allResults;
};




module.exports = { consistencyBreak };

