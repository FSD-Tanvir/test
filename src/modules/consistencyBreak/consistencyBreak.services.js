const {
    orderHistories,
    OrderCloseAll,
    accountUpdate,
} = require("../../thirdPartyMt5Api/thirdPartyMt5Api");
const ConsistencyBreakModel = require("./consistencyBreak.schema");
const MUser = require("../users/users.schema");
const { saveRealTimeLog } = require("../disableAccounst/disableAccounts.services");
const { sendEmailSingleRecipient } = require("../../helper/mailing");

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
            background-color: #f5f5f5;
        }
        .email-container {
            background-color: #ffffff;
            border: 3px solid #d32f2f;
            border-radius: 12px;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .email-container:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }
        .header {
            background: linear-gradient(135deg, #d32f2f, #f44336);
            color: #ffffff;
            padding: 40px 20px;
            text-align: center;
            position: relative;
            border-bottom: 2px solid #eeeeee;
            border-radius: 8px 8px 0 0;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .header img {
            width: 80px;
            margin-bottom: 15px;
            transition: transform 0.3s ease;
        }
        .header img:hover {
            transform: scale(1.1);
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
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-weight: bold;
            transition: background-color 0.3s ease;
        }
        .highlight:hover {
            background-color: #ffcdd2;
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
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .trade:hover {
            transform: translateY(-3px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
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
            padding-top: 20px;
            border-top: 1px solid #eee;
        }
        .footer a {
            color: #DB8112;
            text-decoration: none;
            font-weight: bold;
            transition: color 0.3s ease;
        }
        .footer a:hover {
            color: #ff9800;
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
            transition: transform 0.3s ease;
        }
        .social-links img:hover {
            transform: scale(1.2);
        }
        .animated-text {
            animation: fadeIn 1s ease-in-out;
        }
        .consequences-section {
            background-color: #fff3e0;
            border-left: 6px solid #ff9800;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .consequences-section p {
            margin: 10px 0;
            font-size: 14px;
            color: #333;
        }
        .consequences-section p strong {
            color: #d32f2f;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header Section with Logo -->
        <div class="header">
            <img src="https://i.ibb.co.com/34qjbqp/Fox-Funded-Logo.png" alt="Fox Funded Logo">
            <h1 class="animated-text">Your Account Has Been Disabled</h1>
            <p class="animated-text">Due to violating the 1.5% consistency rule</p>
        </div>
        
        <!-- Content Section -->
        <div class="content">
            <p>Dear Trader,</p>
            <p>I hope this message finds you well. We are writing to address a serious issue with your trading activities at Fox Funded.</p>
    
            <p>We regret to inform you that despite previous warnings, we have observed continued violations of our Consistency Rules at Foxx Funded. This constitutes a serious breach of our trading policies, and as a result, your account is now subject to permanent action.</p>

            <p>As per our policies, no single trade should generate more than 1.5% of the initial account balance. Below are the details of the trades that violated this rule:</p>
    
            <p>Breach Details</p>

            <div class="highlight">
                <p><strong>Account Number:</strong> ${account}</p>
                <p><strong>Initial Account Balance:</strong> $${accountDetails?.accountSize}</p>
                <p><strong>Total Profit:</strong> $${accountDetails?.totalProfit}</p>
                <p><strong>Total Trades:</strong> ${accountDetails?.totalTrades}</p>
            </div>
    
            <!-- Trade Details Section -->
            <div class="trade-details">
                ${accountDetails?.trades
                    ?.map(
                        (trade) => `
                    <div class="trade">
                    <h3>Trade Ticket: ${trade.ticket}</h3>
                    <p><strong>Profit Limit:</strong> $${trade.profitLimit}</p>
                    <p><strong>Profit:</strong> $${trade.profit}</p>
                    <p><strong>Profit Percentage:</strong> ${trade.profitPercentage}%</p>
                    <p><strong>Profit Difference:</strong> $${trade.profitDifference}</p>
                    </div>
                `
                    )
                    .join("")}
            </div>

          <div style="background-color: #e3f2fd; border-left: 6px solid #1976d2; padding: 15px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
    <p style="font-size: 18px; font-weight: bold; color: #1976d2; margin-bottom: 10px;">Consistency Rules</p>
    <p style="font-size: 16px; color: #333; margin-bottom: 10px;"><strong style="color: #2e7d32;">Objective:</strong> Ensure responsible trading and prevent excessive risk-taking.</p>
    <ul style="list-style-type: disc; padding-left: 20px; margin: 0;">
        <li style="font-size: 14px; color: #333; margin-bottom: 8px;">
            <strong style="color: #1976d2;">Maximum Profit per Trade:</strong> A single trade cannot generate more than 1.5% of the initial account balance.
        </li>
        <li style="font-size: 14px; color: #333; margin-bottom: 8px;">
            <strong style="color: #1976d2;">Non-Compliance:</strong> If a trade exceeds this limit, it is considered non-compliant and results in a challenge violation.
        </li>
    </ul>
</div>
            <!-- Final Consequences Section -->
            <div class="consequences-section">
                <p><strong>Final Consequences</strong></p>
                <p>Due to repeated violations, the following permanent actions are being enforced:</p>
                <p><strong>• Account Closure:</strong> Your trading account with Foxx Funded will be permanently closed.</p>
                <p><strong>• Profit Deduction:</strong> Any profits generated from non-compliant trades will be deducted per our rules.</p>
                <p><strong>• Ineligibility for Future Participation:</strong> You will no longer be eligible to trade with Foxx Funded.</p>
                <p>This decision is final, and no further appeals will be considered.</p>
            </div>
    
            <p>If you require any clarifications, please review our FAQ: https://foxxfunded.com/faq/ or contact our support team.</p>
    
            <p>For further details on our policies and guidelines, please refer to our <a href="https://foxx-funded.com/faqs">FAQ</a> article.</p>
    
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
</html>`;

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
        const tickets = accountDetails.trades
            .map(
                (trade) =>
                    `Ticket: ${trade.ticket}, Profit: ${trade.profit} (${trade.profitPercentage}%)`
            )
            .join(", ");
        const htmlContent = `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Account Breach Notification</title>
                <style>
                    body {
                        font-family: 'Arial', sans-serif;
                        background-color: #ffff; /* Light red background */
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
                        border: 2px solid #ffa726; /* Red border for urgency */
                    }
                    .header {
                        background-color: #f57c00; /* Strong red for header */
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
                        background-color: #fff3cd; /* Light orange background for warning */
                        color: #856404;           /* Dark orange text */
                        border-left: 4px solid #ffc107; /* Bright orange border */
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
                        1.5% Consistency Rule Breach Notification
                    </div>
                    
                    <!-- Content Section -->
                    <div class="content">
                        <p>Dear Trader,</p>
                        <p>We hope this email finds you well. We are writing to inform you about a critical issue regarding your recent trading activity at Fox Funded.</p>
                        
                        <p>Upon reviewing your recent trades, we noticed that one of your trades has exceeded the 1.5% consistency rule. As per our trading policy, no single trade should generate more than 1.5% of the initial account balance. Unfortunately, your recent trade violated this rule.</p>
            
                        <p>This trade is considered non-compliant and could lead to a challenge violation. The details of the non-compliant trade are provided below:</p>
            
                        <div class="highlight">
                            <p><strong>Account Number:</strong> ${account}</p>
                            <p><strong>Profit Limit:</strong> ${
                                accountDetails.trades[0].profitLimit
                            }</p>
                            <div>
                                <p><strong>Trade Tickets:</strong></p>
                                <div class="tickets">
                                    ${accountDetails.trades
                                        .map(
                                            (trade) =>
                                                `Ticket: ${trade.ticket}, Profit: ${trade.profit} (${trade.profitPercentage}%)`
                                        )
                                        .join("<br>")}
                      </div>
                            </div>
                        </div>
            
                        <p>Please note that any further violations may result in stricter consequences, including potential account restrictions. We strongly recommend reviewing your trading strategies to ensure compliance with the 1.5% consistency rule moving forward.</p>
            
                        <p>If you have any questions or need assistance in adjusting your trading strategies, please feel free to contact our support team.</p>
            
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
