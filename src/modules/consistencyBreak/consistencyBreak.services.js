const {
    orderHistories,
    OrderCloseAll,
    accountUpdate,
} = require("../../thirdPartyMt5Api/thirdPartyMt5Api");
const ConsistencyBreakModel = require("./consistencyBreak.schema");
const MUser = require("../users/users.schema");
const { saveRealTimeLog } = require("../disableAccounst/disableAccounts.services");
const { sendEmailSingleRecipient } = require("../../helper/mailing");
const {
    consistencyBreakDisabledEmailTemplate,
    sendConsistencyBreakWarningEmailTemplate,
} = require("../../helper/emailTemplates/consistencyBreakEmailTemplates");

const consistencyBreak = async () => {
    const activeAccounts = await MUser.aggregate([
        {
            $project: {
                email: 1,
                mt5Accounts: {
                    $filter: {
                        input: "$mt5Accounts",
                        as: "account",
                        cond: { $eq: ["$$account.accountStatus", "active"] },
                    },
                },
            },
        },
        { $unwind: "$mt5Accounts" },
        {
            $addFields: {
                accountString: { $toString: "$mt5Accounts.account" },
            },
        },
        {
            $lookup: {
                from: "disableaccounts",
                localField: "accountString",
                foreignField: "mt5Account",
                as: "disabledAccount",
            },
        },
        {
            $match: {
                disabledAccount: { $eq: [] },
            },
        },
        {
            $replaceRoot: {
                newRoot: {
                    email: "$email",
                    account: "$mt5Accounts.account",
                    accountStatus: "$mt5Accounts.accountStatus",
                    accountSize: "$mt5Accounts.challengeStageData.accountSize",
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
                        const profitPercentage = parseFloat(
                            ((profit / accountSize) * 100).toFixed(4)
                        );
                        const profitDifference = parseFloat((profit - profitLimit).toFixed(4));

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

/* ----------------------------- Get consistency break data from DB -----------------------------  */

const getConsistencyBreakData = async (openDate, account, page = 1, limit = 10) => {
    try {
        const skip = (page - 1) * limit;

        // Build the query object
        const query = {};
        if (account) {
            query.account = Number(account);
        }
        if (openDate) {
            const parsedDate = new Date(openDate);
            // Start of the day
            const startOfDay = new Date(parsedDate.setHours(0, 0, 0, 0));
            // End of the day
            const endOfDay = new Date(parsedDate.setHours(23, 59, 59, 999));
            // Query to filter between start and end of the day
            query.createdAt = {
                $gte: startOfDay,
                $lt: endOfDay,
            };
        }

        // Aggregation pipeline to group by account and sort
        const groupedData = await ConsistencyBreakModel.aggregate([
            { $match: query }, // Apply the query filter
            {
                $group: {
                    _id: "$account", // Group by account
                    email: { $first: "$email" }, // Store email for reference
                    accountSize: { $first: "$accountSize" }, // Store account size
                    isDisabled: { $first: "$isDisabled" }, // Store isDisabled for reference
                    emailSent: { $first: "$emailSent" }, // Store emailSent for reference
                    emailCount: { $sum: "$emailCount" }, // Sum up the emailCount across documents
                    accounts: { $push: "$$ROOT" }, // Push the entire document into accounts array
                    count: { $sum: 1 }, // Count how many records for each account
                    totalProfit: { $sum: "$profit" }, // Sum total profit for this account
                },
            },
            { $sort: { "accounts.createdAt": -1 } }, // Sort in descending order based on createdAt
        ]);

        // Calculate the total sum of emailCount across all groups
        const totalEmailCount = groupedData.reduce((sum, group) => sum + group.emailCount, 0);

        // Total count is the length of the grouped data
        const totalCount = groupedData.length;

        // Paginate the grouped data
        const paginatedData = groupedData.slice(skip, skip + limit);

        // Process data for unique close times
        const processedData = paginatedData.map((group) => {
            return {
                account: group._id,
                email: group.email,
                accountSize: group.accountSize,
                totalProfit: Number(group.totalProfit.toFixed(4)), // Convert to number
                totalTrades: group.count,
                emailCount: group.emailCount, // Include emailCount for the group
                trades: group.accounts.map((trade) => ({
                    ticket: trade.ticket,
                    profit: Number(trade.profit.toFixed(4)), // Convert to number
                    profitPercentage: Number(trade.profitPercentage.toFixed(4)), // Convert to number
                    profitDifference: Number(trade.profitDifference.toFixed(4)), // Convert to number
                    profitLimit: Number(trade.profitLimit.toFixed(4)), // Convert to number
                    emailSent: trade.emailSent,
                    isDisabled: trade.isDisabled,
                    createdAt: trade.createdAt,
                })),
            };
        });

        return {
            data: processedData,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page,
            totalEmailCount, // Add the total sum of emailCount to the response
        };
    } catch (error) {
        console.log(error);
        throw new Error("Failed to fetch consistency break data");
    }
};

/* ----------------------------- // Disable consistency break risked account ---------------------------- */

const disableConsistencyBreakAccount = async (account, accountDetails) => {
    try {
        const message = "Consistency Break Violation";

        const userDisableDetails = {
            Rights: "USER_RIGHT_TRADE_DISABLED", // cannot trade, but can login
            enabled: true,
        };

        const changeGroupDetails = {
            Group: "demo\\FXbin",
        };

        const [disableMT5Account, orderCloseAll, updateAccGroup] = await Promise.all([
            OrderCloseAll(account),
            accountUpdate(account, changeGroupDetails),
            accountUpdate(account, userDisableDetails),
        ]);

        if (disableMT5Account !== "OK") {
            return {
                success: false,
                message: `Failed to disable the account ${account}. Please try again.`,
            };
        }

        const result = await saveRealTimeLog(
            account,
            (lossPercentage = 0),
            (asset = 0),
            (balance = 0),
            (initialBalance = accountDetails.accountSize),
            (equity = 0),
            message
        );
        if (result.success) {
            console.log(`Log entry saved successfully for ${account}`);
        }

        // Move email content creation and sending to an asynchronous process
        let emailSent = true;
        (async () => {
            try {
                const htmlContent = consistencyBreakDisabledEmailTemplate(account, accountDetails);
                await sendEmailSingleRecipient(
                    accountDetails?.email,
                    `Final Breach Notice: Permanent Account Action Required`,
                    "",
                    htmlContent
                );
            } catch (emailError) {
                emailSent = false;
                console.error(
                    `Failed to send email to ${accountDetails?.email}: ${emailError.message}`
                );
            }
        })();

        if (emailSent) {
            await ConsistencyBreakModel.updateMany(
                { account: account },
                { $set: { isDisabled: true } }
            );
        }

        // Return a success message but add a warning about email failure
        return {
            success: true,
            message: `The account "${account}" has been successfully disabled due to Consistency Break Risk. ${
                emailSent
                    ? "An email notification has been sent."
                    : "However, email notification failed."
            }`,
            emailSent,
        };
    } catch (error) {
        throw new Error(`Error disabling risked account: ${error.message}`);
    }
};

/* ------------------------------- // Send consistency break warning email ------------------------------ */

const sendConsistencyBreakWarningEmail = async (account, accountDetails) => {
    try {
        const htmlContent = sendConsistencyBreakWarningEmailTemplate(account, accountDetails);

        const info = await sendEmailSingleRecipient(
            accountDetails?.email,
            "Fox Funded - 1.5% Consistency Rule Breach",
            null,
            htmlContent
        );

        // Check if the response indicates a successful send
        if (typeof info === "string" && info.includes("OK")) {
            // Update emailSent field to true in the database
            await ConsistencyBreakModel.updateMany(
                { account: account },
                {
                    $set: { emailSent: true },
                    $inc: { emailCount: 1 }, // Increment the email count
                }
            );
        }

        // Return success response with details
        return {
            success: true,
            message: `Warning email successfully sent to ${accountDetails?.email}`,
            emailInfo: info,
        };
    } catch (error) {
        throw new Error(`Error sending email: ${error.message}`);
    }
};

module.exports = {
    consistencyBreak,
    getConsistencyBreakData,
    disableConsistencyBreakAccount,
    sendConsistencyBreakWarningEmail,
};
