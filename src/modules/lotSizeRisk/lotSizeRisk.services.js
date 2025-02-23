const { sendEmailSingleRecipient } = require("../../helper/mailing");
const {
    orderHistories,
    OrderCloseAll,
    accountUpdate,
} = require("../../thirdPartyMt5Api/thirdPartyMt5Api");
const { saveRealTimeLog } = require("../disableAccounst/disableAccounts.services");
const MUser = require("../users/users.schema");
const LotSizeRiskModel = require("./lotSizeRisk.schema");

const lotSizeRisk = async () => {
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

    const storedTickets = await LotSizeRiskModel.find({}, { ticket: 1 });
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
                    const lotSizeLimit = accountSize / 10000;

                    orderHistory.forEach((order) => {
                        const lotSize = order.lots;

                        if (lotSize > lotSizeLimit && !storedTicketSet.has(order.ticket)) {
                            highRiskTrades.push({
                                account: account.account,
                                accountSize,
                                ticket: order.ticket,
                                profit: order.profit,
                                lotSize,
                                lotSizeLimit,
                                email: account.email,
                            });
                        }
                    });

                    if (highRiskTrades.length > 0) {
                        await LotSizeRiskModel.insertMany(highRiskTrades);
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

/* ----------------------------- Get lot break data from DB -----------------------------  */

const getLotSizeRiskData = async (openDate, account, page = 1, limit = 10) => {
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
        const groupedData = await LotSizeRiskModel.aggregate([
            { $match: query }, // Apply the query filter
            {
                $group: {
                    _id: "$account", // Group by account
                    email: { $first: "$email" }, // Store email for reference
                    accountSize: { $first: "$accountSize" }, // Store account size
                    isDisabled: { $first: "$isDisabled" }, // Store isDisabled for reference
                    emailSent: { $first: "$emailSent" }, // Store emailSent for reference
                    totalLotSize: { $sum: "$lotSize" }, // Sum lotSize across documents
                    totalLotSizeLimit: { $sum: "$lotSizeLimit" }, // Sum lotSizeLimit across documents
                    count: { $sum: 1 }, // Count the number of trades
                    accounts: { $push: "$$ROOT" }, // Push the entire document into accounts array
                },
            },
            { $sort: { "accounts.createdAt": -1 } }, // Sort in descending order based on createdAt
        ]);

        // Total count is the length of the grouped data
        const totalCount = groupedData.length;

        // Paginate the grouped data
        const paginatedData = groupedData.slice(skip, skip + limit);

        // Process data to match the desired output structure
        const processedData = paginatedData.map((group) => ({
            account: group._id,
            email: group.email,
            accountSize: group.accountSize,
            totalLotSize: Number(group.totalLotSize),
            totalLotSizeLimit: Number(group.totalLotSizeLimit),
            totalTrades: group.count,
            trades: group.accounts.map((trade) => ({
                ticket: trade.ticket,
                profit: Number(trade.profit),
                lotSize: Number(trade.lotSize),
                lotSizeLimit: Number(trade.lotSizeLimit),
                emailSent: trade.emailSent,
                isDisabled: trade.isDisabled,
                createdAt: trade.createdAt,
            })),
        }));

        return {
            data: processedData,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page,
        };
    } catch (error) {
        console.log(error);
        throw new Error("Failed to fetch lot size risk data");
    }
};

/* ----------------------------- // Disable lot risked account ---------------------------- */

const disableLotRiskedAccount = async (account, accountDetails) => {
    try {
        const message = "Lot Size Risk";

        const userDisableDetails = {
            Rights: "USER_RIGHT_TRADE_DISABLED", // cannot trade, but can login
            enabled: true,
        };

        const changeGroupDetails = {
            Group: "real\\Bin-B",
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
                const htmlContent = `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Account Breach Notification</title>
                    <style>
                        body {
                            font-family: 'Arial', sans-serif;
                            margin: 0;
                            padding: 20px;
                            color: #333;
                        }
                        .email-container {
                            background-color: #ffffff;
                            border: 3px solid red;
                            border-radius: 8px;
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 10px;
                            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                        }
                        .header {
                            background: linear-gradient(135deg, #d32f2f, #f44336);
                            color: #ffffff;
                            padding: 40px 20px;
                            text-align: center;
                            position: relative;
                            border-bottom: 2px solid #eeeeee;
                            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                        }
                        .header img {
                            width: 80px;
                            margin-bottom: 15px;
                        }
                        .header h1 {
                            font-size: 24px;
                            font-weight: 700;
                            margin: 0;
                            letter-spacing: -0.5px;
                        }
                        .header p {
                            font-size: 16px;
                            margin-top: 10px;
                            opacity: 0.9;
                        }
                        .content {
                            padding: 20px;
                            font-size: 16px;
                            line-height: 1.6;
                            color: #444;
                        }
                        .highlight {
                            background-color: #ffebee;
                            color: #d32f2f;
                            border-left: 4px solid #d32f2f;
                            padding: 10px;
                            margin: 20px 0;
                            border-radius: 4px;
                            font-weight: bold;
                        }
                        .trade-details {
                            margin-top: 20px;
                        }
                        .trade {
                            background-color: #f9f9f9;
                            border: 1px solid #ddd;
                            border-radius: 8px;
                            padding: 15px;
                            margin-bottom: 15px;
                            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                        }
                        .trade h3 {
                            font-size: 18px;
                            margin: 0 0 10px;
                            color: #d32f2f;
                        }
                        .trade p {
                            margin: 5px 0;
                            font-size: 14px;
                            color: #555;
                        }
                        .trade p strong {
                            color: #333;
                        }
                        .footer {
                            text-align: center;
                            font-size: 12px;
                            color: #777;
                            margin-top: 20px;
                        }
                        .footer a {
                            color: #DB8112;
                            text-decoration: none;
                        }
                        .footer a:hover {
                            text-decoration: underline;
                        }
                        .social-links {
                            margin-top: 20px;
                            display: flex;
                            justify-content: center;
                            gap: 20px;
                        }
                        .social-links img {
                            width: 32px;
                            height: 32px;
                        }
                    </style>
                </head>
                <body>
                    <div class="email-container">
                        <!-- Header Section with Logo -->
                        <div class="header">
                            <img src="https://i.ibb.co.com/34qjbqp/Fox-Funded-Logo.png" alt="Fox Funded Logo">
                            <h1>Your Account Has Been Disabled</h1>
                            <p>Due to violating the Lot Size Risk rule</p>
                        </div>
                        
                        <!-- Content Section -->
                        <div class="content">
                            <p>Dear Trader,</p>
                            <p>We hope this message finds you well. We are writing to inform you about a serious issue with your trading activities at Fox Funded.</p>
                    
                            <p>Upon review, we have determined that one or more of your trades have violated our <strong>Lot Size Risk</strong> rule. The number of lots opened must be proportional to the account size, and excessive lot sizes relative to the risk taken are not allowed.</p>
                    
                            <p>For example, a trader with a $10K account opening a 5-lot trade on EUR/USD is taking an excessive risk and violates this rule.</p>
                    
                            <p>As a result, your account has been disabled. Please see below for the details:</p>
                    
                            <div class="highlight">
                                <p><strong>Account Number:</strong> ${account}</p>
                                <p><strong>Initial Account Balance:</strong> $${
                                    accountDetails?.accountSize
                                }</p>
                                <p><strong>Lot Size Limit:</strong> ${
                                    accountDetails?.totalLotSizeLimit
                                }</p>
                            </div>
                    
                            <!-- Trade Details Section -->
                            <div class="trade-details">
                                ${accountDetails?.trades
                                    ?.map((trade) => {
                                        const isViolation =
                                            trade.lotSize > accountDetails?.totalLotSizeLimit;
                                        return `
                                    <div class="trade" ${
                                        isViolation ? 'style="border: 2px solid red;"' : ""
                                    }>
                                        <h3>Trade Ticket: ${trade.ticket}</h3>
                                        <p><strong>Lot Size:</strong> ${trade.lotSize}</p>
                                        <p><strong>Profit:</strong> $${trade.profit}</p>
                                        ${
                                            isViolation
                                                ? `<p style="color: red; font-weight: bold;">This trade exceeded the maximum allowed lot size.</p>`
                                                : ""
                                        }
                                    </div>
                                `;
                                    })
                                    .join("")}
                            </div>
                    
                            <p>Please note that exceeding the allowed lot size was the main reason for disabling your account. We urge you to review your trading strategies and risk management practices to prevent such violations in the future.</p>
                    
                            <p>For further details on our policies and guidelines, please refer to our <a href="https://foxfunded.com/faq/">FAQ</a> article.</p>
                    
                            <p>Your prompt attention to this matter is required to prevent any further action. We appreciate your cooperation in maintaining a secure and responsible trading environment.</p>
                    
                            <p>Best regards,</p>
                            <p>Fox Funded Risk Team</p>
                    
                            <p style="font-size: 14px; color: #777; margin-top: 20px;">
                                If you have any questions, feel free to
                                <a href="https://foxx-funded.com/contact-us" style="color: #DB8112; text-decoration: none; font-weight: bold;">
                                    contact us or contact our support team
                                </a>.
                            </p>
                    
                            <div class="social-links">
                                <a href="https://t.me/+2QVq5aChxiBlOWFk">
                                    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUQ9pRZvmScqICRjNBvAHEjIawnL1erY-AcQ&s" alt="Telegram">
                                </a>
                            </div>
                        </div>
                    
                        <!-- Footer Section -->
                        <div class="footer">
                            <p>@2024 Fox Funded All Rights Reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
                `;

                await sendEmailSingleRecipient(
                    accountDetails?.email,
                    `Foxx Funded -  Breach of Account Lot Size Risk`,
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
            await LotSizeRiskModel.updateMany({ account: account }, { $set: { isDisabled: true } });
        }

        // Return a success message but add a warning about email failure
        return {
            success: true,
            message: `The account "${account}" has been successfully disabled due to Lot Size Risk. ${
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

/* ------------------------------- // Send lot size warning email ------------------------------ */

const sendLotSizeWarningEmail = async (account, accountDetails) => {
    try {
        const htmlContent = `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Lot Size Risk Breach Notification</title>
                <style>
                    body {
                        font-family: 'Arial', sans-serif;
                        background-color: #fff3cd; /* Light yellow background */
                        margin: 0;
                        padding: 20px;
                        color: #333;
                    }
                    .email-container {
                        background-color: #ffffff;
                        border-radius: 8px;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                        border: 2px solid #f57c00; /* Strong orange border for risk */
                    }
                    .header {
                        background-color: #f57c00; /* Orange header for emphasis */
                        color: #ffffff;
                        padding: 20px;
                        border-radius: 8px 8px 0 0;
                        text-align: center;
                        font-size: 24px;
                        font-weight: bold;
                    }
                    .header img {
                        max-width: 150px;
                        margin-bottom: 10px;
                    }
                    .content {
                        padding: 20px;
                        font-size: 16px;
                        line-height: 1.6;
                        color: #444;
                    }
                    .highlight {
                        background-color: #FAD5A5; 
                        color: #000; 
                        border-left: 4px solid #f57c00; 
                        padding: 10px;
                        margin: 20px 0;
                        border-radius: 4px;
                        font-weight: bold;
                    }
                    .cta-button {
                        display: inline-block;
                        background-color: #f57c00; 
                        color: #ffffff;
                        padding: 10px 20px;
                        text-decoration: none;
                        border-radius: 4px;
                        margin-top: 20px;
                    }
                    .cta-button a{
                        text-decoration: none;
                        color: #ffffff;
                    }
                    .cta-button:hover {
                        background-color: #ffb74d;
                    }
                    .footer {
                        text-align: center;
                        font-size: 12px;
                        color: #777;
                        margin-top: 20px;
                    }
                    .social-links {
                        margin-top: 20px;
                        display: flex;
                        justify-content: center;
                        gap: 20px;
                    }
                    .social-links img {
                        width: 32px;
                        height: 32px;
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <!-- Header Section -->
                    <div class="header">
                        <img src="https://i.ibb.co.com/34qjbqp/Fox-Funded-Logo.png" alt="Fox Funded Logo">
                        <br>
                        Lot Size Risk Breach Notification
                    </div>
                    
                    <!-- Content Section -->
                    <div class="content">
                        <p>Dear Trader,</p>
                        <p>We hope this email finds you well. We are writing to inform you about a critical issue regarding your recent trading activity at Fox Funded.</p>
                        
                        <p>Upon reviewing your recent trades, we noticed that some of your trades have violated the <strong>Lot Size Risk</strong> rule. According to our policy, the lot size for trades must be proportional to the account size. Trades that exceed the allowed lot size limit are considered a breach of this policy.</p>
            
                        <p>The details of the violating trades are as follows:</p>
            
                        <div class="highlight">
                            <p><strong>Account Number:</strong> ${account}</p>
                            <p><strong>Initial Account Balance:</strong> $${
                                accountDetails.accountSize
                            }</p>
                            <p><strong>Lot Size Limit:</strong> ${
                                accountDetails.totalLotSizeLimit
                            }</p>
                            <p><strong>Exceeding Trades:</strong></p>
                            <div>
                                ${accountDetails.trades
                                    .map(
                                        (trade) =>
                                            `<p><strong>Ticket:</strong> ${trade.ticket}, <strong>Lot Size:</strong> ${trade.lotSize}</p>`
                                    )
                                    .join("")}
                            </div>
                        </div>
            
                        <p>Please be aware that continuing to exceed the lot size limit could result in further account restrictions or other actions as outlined in our policies.</p>
            
                        <p>We strongly recommend reviewing your trading strategies to ensure that future trades comply with the <strong>Lot Size Risk</strong> rule. If you have any questions or need assistance adjusting your trades, please do not hesitate to reach out to our support team.</p>
            
                        <p>Thank you for your attention to this matter. We appreciate your cooperation in maintaining a responsible trading environment.</p>
            
                        <p>Best regards,</p>
                        <p>Fox Funded Risk Team</p>
            
                        <p style="font-size: 14px; color: #777; margin-top: 20px;">
                            If you have any questions, feel free to
                            <a href="https://foxx-funded.com/contact-us" style="color: #DB8112; text-decoration: none; font-weight: bold;">
                                contact us or contact our support team
                            </a>.
                        </p>
            
                        <div class="social-links">
                            <a href="https://t.me/+2QVq5aChxiBlOWFk">
                                <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUQ9pRZvmScqICRjNBvAHEjIawnL1erY-AcQ&s" alt="Telegram">
                            </a>
                        </div>
                    </div>
            
                    <!-- Footer Section -->
                    <div class="footer">
                        <p>@2024 Fox Funded All Rights Reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const info = await sendEmailSingleRecipient(
            accountDetails?.email,
            "Fox Funded - Lot Size Risk Breach",
            null,
            htmlContent
        );

        // Check if the response indicates a successful send
        if (typeof info === "string" && info.includes("OK")) {
            // Update emailSent field to true in the database
            await LotSizeRiskModel.updateMany({ account: account }, { $set: { emailSent: true } });
        }

        // Return success response with details
        return {
            success: true,
            message: `Lot size breach warning email successfully sent to ${accountDetails?.email}`,
            emailInfo: info,
        };
    } catch (error) {
        throw new Error(`Error sending email: ${error.message}`);
    }
};

module.exports = {
    lotSizeRisk,
    getLotSizeRiskData,
    disableLotRiskedAccount,
    sendLotSizeWarningEmail,
};
