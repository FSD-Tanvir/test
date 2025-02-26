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
            border: 3px solid red;
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
            <p class="animated-text">Due to violating the Lot Size Risk rule</p>
        </div>
        
        <!-- Content Section -->
        <div class="content">
            <p>Dear Trader,</p>
            <p>We regret to inform you that we have observed continued violations of our Lot Size Rules at Foxx Funded. Despite previous warnings, these breaches have persisted, constituting a serious compliance issue.</p>
            <p>Breach Details:</p>
    
            <div class="highlight">
                <p><strong>Account Number:</strong> ${account}</p>
                <p><strong>Initial Account Balance:</strong> $${accountDetails?.accountSize}</p>
                <p><strong>Lot Size Limit:</strong> ${accountDetails?.totalLotSizeLimit}</p>
            </div>
    
            <!-- Trade Details Section -->
            <div class="trade-details">
                ${accountDetails?.trades
                    ?.map((trade) => {
                        const isViolation = trade.lotSize > accountDetails?.totalLotSizeLimit;
                        return `
                    <div class="trade" ${isViolation ? 'style="border: 2px solid red;"' : ""}>
                        <h3>Trade Ticket: ${trade.ticket}</h3>
                        <p><strong>Lot Size:</strong> ${trade.lotSize}</p>
                        <p><strong>Profit:</strong> $${trade.profit}</p>
                    </div>
                `;
                    })
                    .join("")}
            </div>

            <p>Lot Size Rules:</p>

            <p>To ensure responsible trading and prevent excessive risk-taking, the number of lots opened must be proportional to the account size:
Account Size Max Recommended Lot Size (Forex) $5,000 0.5 lot$10,000  1 lot$25,000 2.5 lots$50,000 5 lots$100,000 10 lots$200,000 20 lots$300,000 30 lots 
</p>
            <p>Example: A trader with a $10K account opening a 5-lot trade on EUR/USD is taking excessive risk and violating this rule.
</p>

            <p style="font-size: 18px; font-weight: bold; color: #d32f2f; margin-bottom: 10px;">Final Consequences</p>
<p style="font-size: 16px; color: #444; margin-bottom: 20px;">Due to this breach, the following actions will be taken:</p>

<div style="background-color: #fff3e0; border-left: 6px solid #ff9800; padding: 15px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
    <p style="margin: 10px 0; font-size: 14px; color: #333;">
        <span style="font-weight: bold; color: #d32f2f;">• Profit Deduction:</span> Any profits generated from non-compliant trades will be deducted per our rules.
    </p>
    <p style="margin: 10px 0; font-size: 14px; color: #333;">
        <span style="font-weight: bold; color: #d32f2f;">• Final Account Review:</span> Your account is now under final review by our Risk Team.
    </p>
    <p style="margin: 10px 0; font-size: 14px; color: #333;">
        <span style="font-weight: bold; color: #d32f2f;">• Potential Termination:</span> Any further violations will result in the permanent closure of your trading account with Foxx Funded.
    </p>
</div>
    
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
                    `Final Breach Notice: Violation of Trading Policies
`,
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
            background-color: #f9f9f9; /* Light gray background */
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .email-container {
            background-color: #ffffff;
            border-radius: 12px;
            max-width: 600px;
            margin: 0 auto;
            padding: 30px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            border: 1px solid #e0e0e0; /* Subtle border */
        }
        .header {
            background-color: #ff6f61; /* Vibrant red-orange header */
            color: #ffffff;
            padding: 25px;
            border-radius: 12px 12px 0 0;
            text-align: center;
            font-size: 28px;
            font-weight: bold;
            letter-spacing: 1px;
        }
        .header img {
            max-width: 150px;
            margin-bottom: 15px;
        }
        .content {
            padding: 25px;
            font-size: 16px;
            line-height: 1.7;
            color: #444;
        }
        .highlight {
            background-color: #fff5e1; /* Soft cream background */
            color: #000;
            border-left: 5px solid #ff6f61; /* Matching vibrant border */
            padding: 15px;
            margin: 25px 0;
            border-radius: 8px;
            font-weight: bold;
        }
        .cta-button {
            display: inline-block;
            background-color: #ff6f61; /* Vibrant red-orange button */
            color: #ffffff;
            padding: 12px 25px;
            text-decoration: none;
            border-radius: 8px;
            margin-top: 25px;
            font-size: 16px;
            transition: background-color 0.3s ease;
        }
        .cta-button a {
            text-decoration: none;
            color: #ffffff;
        }
        .cta-button:hover {
            background-color: #ff9a8b; /* Slightly lighter hover effect */
        }
        .footer {
            text-align: center;
            font-size: 12px;
            color: #777;
            margin-top: 30px;
        }
        .social-links {
            margin-top: 25px;
            display: flex;
            justify-content: center;
            gap: 20px;
        }
        .social-links img {
            width: 36px;
            height: 36px;
            transition: transform 0.3s ease;
        }
        .social-links img:hover {
            transform: scale(1.1); /* Slight zoom effect on hover */
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
            <p>I hope this email finds you well. We wanted to bring to your attention an issue that has been observed in your recent trading activities at <strong>Foxx Funded</strong>.</p>
            
            <p>Upon reviewing your trading history, we've noticed that some of your trades have violated our <strong>Lot Size Rules</strong>, which constitutes a soft breach of our trading policies. While we understand that trading strategies vary, failing to adhere to these rules can expose your account to unnecessary risks and potential compliance issues.</p>
            
            <p>As a reminder, our <strong>Lot Size Rules</strong> are designed to ensure responsible trading and prevent excessive risk-taking:</p>
            
            <p><strong>Lot Size Rules</strong></p>
            <div>
                <p><strong>- The number of lots opened must be proportional to the account size.</strong></p>
                <p><strong>- Excessive lot sizes relative to the risk taken will not be allowed.</strong></p>
            </div>
            
            <p>Below are the <strong>maximum recommended lot sizes</strong> for compliance:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                    <tr style="background-color: #ff6f61; color: #ffffff; text-align: left;">
                        <th style="padding: 10px; border: 1px solid #e0e0e0;">Account Size</th>
                        <th style="padding: 10px; border: 1px solid #e0e0e0;">Max Recommended Lot Size (Forex)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="background-color: #fff5e1;">
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">$5,000</td>
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">0.5 lot</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">$10,000</td>
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">1 lot</td>
                    </tr>
                    <tr style="background-color: #fff5e1;">
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">$25,000</td>
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">2.5 lots</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">$50,000</td>
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">5 lots</td>
                    </tr>
                    <tr style="background-color: #fff5e1;">
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">$100,000</td>
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">10 lots</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">$200,000</td>
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">20 lots</td>
                    </tr>
                    <tr style="background-color: #fff5e1;">
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">$300,000</td>
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">30 lots</td>
                    </tr>
                </tbody>
            </table>
            
            <p><strong>Example:</strong> A trader with a $10K account opening a <strong>5-lot</strong> trade on EUR/USD is taking excessive risk and violating this rule.</p>
            
            <p>Any profit(s) generated from trades that exceed the allowed lot size will be deducted as per our rules, with details of the affected trades listed below. If the trade resulted in a loss, no deduction will be made.</p>
            
            <p>The details of the violating trades are as follows:</p>
            
            <div class="highlight">
                <p><strong>Account Number:</strong> ${account}</p>
                <p><strong>Initial Account Balance:</strong> $${accountDetails.accountSize}</p>
                <p><strong>Lot Size Limit:</strong> ${accountDetails.totalLotSizeLimit}</p>
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
            
            <p>We want to emphasize the seriousness of this matter and the importance of strict compliance with our policies. Failure to follow the <strong>Lot Size Rules</strong> may result in further consequences, including the termination of your trading account with <strong>Foxx Funded</strong>. Please refer to our FAQ article here: <a href="https://foxx-funded.com/faqs">FAQ</a></p>
            
            <p>If you have any questions or need further clarification on the <strong>Lot Size Rules</strong>, please don’t hesitate to reach out to our support team for guidance.</p>
            
            <p>Thank you for your attention to this matter, and we appreciate your cooperation in maintaining a safe and responsible trading environment.</p>
            
            <p>Best regards,</p>
            <p><strong>Fox Funded Risk Team</strong></p>
            
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
            <p>@2024 <strong>Fox Funded</strong> All Rights Reserved.</p>
        </div>
    </div>
</body>
</html>`;

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
