const { sendEmailSingleRecipient } = require("../../helper/mailing");
const {
	orderHistories,
	OrderCloseAll,
	accountUpdate,
} = require("../../thirdPartyMt5Api/thirdPartyMt5Api");
const { saveRealTimeLog } = require("../disableAccounst/disableAccounts.services");
const MUser = require("../users/users.schema");
const StopLossRiskModel = require("./stopLossRisk.schema");

const stopLossRisk = async () => {
	const fundedAccounts = await MUser.aggregate([
		{
			$match: {
				$or: [
					{
						"mt5Accounts.challengeStageData.challengeType": "funded", // Optional: ChallengeType must be funded
					},
					{
						mt5Accounts: {
							$elemMatch: {
								$and: [
									{ challengeStage: { $in: ["phase1", "phase2"] } }, // ChallengeStage must be either 'phase1' or 'phase2'
									{ "challengeStageData.challengeName": { $regex: /mini/i } }, // ChallengeName must contain 'mini'
								],
							},
						},
					},
				],
			},
		},
		{
			$project: {
				email: 1,
				mt5Accounts: {
					$filter: {
						input: "$mt5Accounts",
						as: "account",
						cond: {
							$or: [
								{ $eq: ["$$account.challengeStageData.challengeType", "funded"] }, // Optional: ChallengeType is funded
								{
									$and: [
										{
											$in: ["$$account.challengeStage", ["phase1", "phase2"]], // ChallengeStage is either 'phase1' or 'phase2'
										},
										{
											$regexMatch: {
												input: "$$account.challengeStageData.challengeName",
												regex: /mini/i, // ChallengeName contains 'mini' (case-insensitive)
											},
										},
									],
								},
							],
						},
					},
				},
			},
		},
		{ $unwind: "$mt5Accounts" }, // Unwind to get individual accounts
		{
			$addFields: {
				accountString: { $toString: "$mt5Accounts.account" }, // Convert `Number` to `String`
			},
		},
		{
			$lookup: {
				from: "disableaccounts", // Collection name of the DisableAccount model
				localField: "accountString", // Converted account number as a string
				foreignField: "mt5Account", // Field in DisableAccount
				as: "disabledAccount", // Store matching documents in this array
			},
		},
		{
			$match: {
				disabledAccount: { $eq: [] }, // Keep only accounts not in DisableAccount
			},
		},
		{
			$replaceRoot: {
				newRoot: {
					email: "$email",
					account: "$mt5Accounts.account",
					challengeStage: "$mt5Accounts.challengeStage",
					challengeStageData: {
						accountSize: "$mt5Accounts.challengeStageData.accountSize",
						challengeName: "$mt5Accounts.challengeStageData.challengeName",
					},
				},
			},
		},
	]);

	const startDate = "1970-01-01T00:00:00";
	const endDate = "2100-01-01T00:00:00";

	// Retrieve all stored tickets to avoid repetitive queries
	const storedTickets = await StopLossRiskModel.find({}, { ticket: 1 });
	const storedTicketSet = new Set(storedTickets.map((doc) => doc.ticket));

	// Function to process a batch of accounts
	const processBatch = async (accounts, batchNumber) => {
		console.log(`Processing batch number ${batchNumber}`);
		const allGroupedOrders = await Promise.all(
			accounts.map(async (account) => {
				try {
					const orderHistory = await orderHistories(account.account, startDate, endDate);
					if (!orderHistory) throw new Error("No order history returned");

					const tradesExceedingRisk = [];
					const accountSize = account.challengeStageData.accountSize;

					orderHistory.forEach((order) => {
						const openTime = new Date(order.openTime);
						const closeTime = new Date(order.closeTime);

						const differenceInMs = closeTime - openTime; // Difference in milliseconds
						const differenceInMinutes = differenceInMs / (1000 * 60); // Convert milliseconds to minutes

						// console.log({
						// 	account: account.account,
						// 	ticket: order.ticket,
						// 	stopLoss: order.stopLoss,
						// 	email: account.email,
						// 	differenceInMinutes: differenceInMinutes,
						// });

						if (
							differenceInMinutes >= 2 &&
							order.stopLoss == 0.0 &&
							!storedTicketSet.has(order.ticket)
						) {
							tradesExceedingRisk.push({
								account: account.account,
								accountSize,
								ticket: order.ticket,
								stopLoss: order.stopLoss,
								closeTime: order.closeTime,
								profit: order.profit,
								email: account.email,
							});
						}
					});

					if (tradesExceedingRisk.length > 0) {
						await StopLossRiskModel.insertMany(tradesExceedingRisk);
						tradesExceedingRisk.forEach((trade) => storedTicketSet.add(trade.ticket));
					}

					// console.log("tradesExceedingRiskClosed", tradesExceedingRisk);

					return {
						account: account.account,
						email: account.email,
					};
				} catch (error) {
					console.error(`Failed to process account ${account.account}:`, error.message);
					return null; // Allow the loop to continue to the next account
				}
			})
		);
		return allGroupedOrders.filter(Boolean); // Filter out any null results
	};

	// Process accounts in batches of 500
	const batchSize = 50;
	const allResults = [];

	for (let i = 0; i < fundedAccounts.length; i += batchSize) {
		const batch = fundedAccounts.slice(i, i + batchSize);
		const batchNumber = Math.floor(i / batchSize) + 1; // Calculate batch number
		const results = await processBatch(batch, batchNumber);
		allResults.push(...results);
	}

	return allResults;
};

/* ----------------------------- Get stop loss risk data from DB -----------------------------  */

const getStopLossRiskData = async (openDate, account, page = 1, limit = 10) => {
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
		const groupedData = await StopLossRiskModel.aggregate([
			{ $match: query }, // Apply the query filter
			{
				$group: {
					_id: "$account", // Group by account
					accounts: { $push: "$$ROOT" }, // Push the entire document into accounts array
					count: { $sum: 1 }, // Count how many documents for each account
				},
			},
			{ $sort: { "accounts.createdAt": -1 } }, // Sort in descending order based on createdAt
		]);

		// Total count is the length of the grouped data
		const totalCount = groupedData.length;

		// Paginate the grouped data
		const paginatedData = groupedData.slice(skip, skip + limit);

		// Calculate unique closeTime dates and their counts
		const processedData = paginatedData.map((group) => {
			const uniqueDatesMap = new Map();

			group.accounts.forEach((account) => {
				const closeDate = new Date(account.closeTime).toISOString().split("T")[0]; // Extract only the date part
				uniqueDatesMap.set(closeDate, (uniqueDatesMap.get(closeDate) || 0) + 1);
			});

			const uniqueCloseTimes = Array.from(uniqueDatesMap.entries()).map(([date, count]) => ({
				date,
				count,
			}));

			// Calculate today's violations
			const today = new Date();
			const startOfToday = new Date(today.setHours(0, 0, 0, 0));
			const endOfToday = new Date(today.setHours(23, 59, 59, 999));

			const todaysViolations = group.accounts.filter((account) => {
				const closeTime = new Date(account.closeTime);
				return closeTime >= startOfToday && closeTime <= endOfToday;
			}).length;

			return {
				...group,
				uniqueCloseTimes,
				todaysViolations,
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
		throw new Error("Failed to fetch stop loss risk data");
	}
};

/* ----------------------------- // Disable stop loss risked account ---------------------------- */

const disableStopLossRiskedAccount = async (account, accountDetails) => {
	try {
		const message = "Stop Loss Violation";

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
				const tickets = accountDetails.tickets.join(", ");
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
							background-color: #d32f2f;
							color: #ffffff;
							padding: 20px;
							border-radius: 8px 8px 0 0;
							text-align: center;
							font-size: 24px;
							font-weight: bold;
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
					   .tickets {
							font-size: 12px;
							line-height: 1.4;
							max-height: 150px;
							overflow-y: auto;
							word-break: break-word;
							padding: 5px;
							background-color: #ffcdd2; /* Updated to light red */
							border: 1px solid #d32f2f; /* Red border to match the theme */
							border-radius: 4px;
							color: #d32f2f; /* Red text for better readability */
						}
						.cta-button {
							display: inline-block;
							background-color: #007bff;
							color: #ffffff;
							padding: 10px 20px;
							text-decoration: none;
							border-radius: 4px;
							margin-top: 20px;
						}
						.cta-button:hover {
							background-color: #0056b3;
						}
						.footer {
							text-align: center;
							font-size: 12px;
							color: #777;
							margin-top: 20px;
						}
						.footer a {
							color: #007bff;
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
						<!-- Header Section -->
						<div class="header">
							Breach of Account No Stop Loss Risk
						</div>
						
						<!-- Content Section -->
						<div class="content">
							<p>Dear Trader,</p>
							<p>I hope this message finds you well. We are writing to address a continuing issue with your trading activities at Summit Strike Capital.</p>
				
							<p>Following our previous communication regarding the necessity of placing stop-loss orders, our review has revealed that this practice has not been adhered to in your recent trades. This constitutes a serious concern and a breach of our trading policies.</p>
				
							<p>As per our policies, stop-loss orders are crucial for risk management and capital protection, especially in volatile market conditions. Despite our prior warning, the absence of stop-loss orders in your trades exposes your account to substantial risks and potential losses.</p>
				
							<p>Please find the details of the affected trades below:</p>
				
							<div class="highlight">
								<p><strong>Account Number:</strong> ${account}</p>
								<div>
									<p><strong>Trade Tickets:</strong></p>
									<div class="tickets">${tickets}</div>
								</div>
								<p><strong>Total Profit:</strong> ${accountDetails?.profit}</p>
							</div>
				
							<p>Since this is the second warning regarding this issue, your account is now in breach of our rules. Therefore, as per our policies, your account will be terminated. It is imperative to understand the gravity of this situation.</p>
				
							<p>We strongly urge you to revise your trading strategies to include stop-loss orders. Our support team is available to assist you with this, ensuring you adhere to our risk management practices.</p>
				
							<p>For further details on our policies and guidelines, please refer to our <a href="https://summitstrike.com/faq/">FAQ</a> article.</p>
				
							<p>Your immediate attention to this matter is required to prevent any further action on our part. We appreciate your cooperation in maintaining a secure and responsible trading environment.</p>
				
							<p>Best regards,</p>
							<p>Summit Strike Capital Risk Team</p>
				
							<p style="font-size: 14px; color: #777; margin-top: 20px;">
								If you have any questions, feel free to
								<a href="https://summitstrike.com/contact" style="color: #007bff; text-decoration: none; font-weight: bold;">
									contact us or contact our support team
								</a>.
							</p>
				
							<div class="social-links">
								<a href="https://t.me/summitsrikecapital">
									<img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUQ9pRZvmScqICRjNBvAHEjIawnL1erY-AcQ&s" alt="Telegram">
								</a>
								<a style="margin-left: 20px;" href="https://discord.com/invite/2NpszcabHC">
									<img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRILFgGb5Qgu-Lc9kkKFcnjKso7EI85qQcy8A&s" alt="Discord">
								</a>
							</div>
						</div>
				
						<!-- Footer Section -->
						<div class="footer">
							<p>@2024 Summit Strike All Rights Reserved.</p>
						</div>
					</div>
				</body>
				</html>
				`;

				await sendEmailSingleRecipient(
					accountDetails?.email,
					`Summit Strike Capital -  Breach of Account No Stop Loss Risk`,
					"",
					htmlContent
				);
			} catch (emailError) {
				emailSent = false;
				console.error(`Failed to send email to ${accountDetails?.email}: ${emailError.message}`);
			}
		})();

		if (emailSent) {
			await StopLossRiskModel.updateMany({ account: account }, { $set: { isDisabled: true } });
		}

		// Return a success message but add a warning about email failure
		return {
			success: true,
			message: `The account "${account}" has been successfully disabled due to Stop Loss Risk. ${
				emailSent ? "An email notification has been sent." : "However, email notification failed."
			}`,
			emailSent,
		};
	} catch (error) {
		throw new Error(`Error disabling risked account: ${error.message}`);
	}
};

/* ------------------------------- // Send stop loss warning email ------------------------------ */

const sendStopLossWarningEmail = async (account, accountDetails) => {
	try {
		const tickets = accountDetails.tickets.join(", ");
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

.highlight .tickets {
    font-size: 12px; /* Smaller font size for trade tickets */
    line-height: 1.4;
    max-height: 150px; /* Restrict height */
    overflow-y: auto; /* Add scroll for long text */
    word-break: break-word; /* Handle long unbroken text */
    padding: 5px;
    background-color: #fff8e1; /* Slightly lighter background for the tickets section */
    border: 1px solid #ffc107;
    border-radius: 4px;
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
			Stop Loss Warning 1
		</div>
		
		<!-- Content Section -->
		<div class="content">
			<p>Dear Trader,</p>
			<p>I hope this email finds you well. We wanted to bring to your attention an issue that has been observed in your recent trading activities at Summit Strike Capital.
			</p>
			
			<p> Upon reviewing your trading history, we've noticed that you have not placed stop-loss orders on your trades, which constitutes a soft breach violation of our trading policies. While we understand that trading involves a certain level of risk, failure to implement stop-loss orders can significantly expose your account to unnecessary risks and potential losses.
			</p>

			<p>
				As a reminder, stop-loss orders are an essential risk management tool that helps protect your capital and mitigate potential losses in volatile market conditions. It's crucial to adhere to our trading guidelines to ensure the safety and integrity of your account. The profit(s) generated from the trades without a stoploss will be deducted as per our rules and information regarding the trades listed below. If the trade resulted in a loss no deduction will be done.

			</p>

			<div class="highlight">
    <p><strong>Account Number:</strong> ${account}</p>
    <div>
        <p><strong>Trade Tickets:</strong></p>
        <div class="tickets">${tickets}</div>
    </div>
    <p><strong>Total Profit:</strong> ${accountDetails?.profit}</p>
</div>


			
			<p>We want to emphasize the seriousness of this matter and the importance of strict compliance with our policies. Failure to rectify this behavior and continue disregarding stop loss orders within the first 2 minutes of placing a simulated trade may result in more severe consequences, including the termination of your trading account with Summit Strike Capital. Please refer to the <a href="https://summitstrike.com/faq/"> <strong></strong>FAQ</strong> </a> here.
			</p>

			<p>
				We highly encourage you to review and adjust your trading strategies to incorporate stop-loss orders effectively. If you have any questions or need assistance in implementing stop-loss orders, please don't hesitate to reach out to our support team for guidance.
			</p>


			<p>Thank you for your attention to this matter, and we appreciate your cooperation in maintaining a safe and responsible trading environment.
			</p>

			<p>Best regards,</p>
			<p>Summit Strike Capital Risk Team</p>

			<p style="font-size: 14px; color: #777; margin-top: 20px;">
		    	If you have any questions, feel free to
		    	<a href="https://summitstrike.com/contact" style="color: #007bff; text-decoration: none; font-weight: bold;">
		    		contact us or contact our support team
		    	</a>.
		  	</p>
			<div class="social-links">
  				<a  href="https://t.me/summitsrikecapital">
    				<img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUQ9pRZvmScqICRjNBvAHEjIawnL1erY-AcQ&s" alt="Telegram">
  				</a>
  				<a style="margin-left: 20px;" href="https://discord.com/invite/2NpszcabHC">
    				<img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRILFgGb5Qgu-Lc9kkKFcnjKso7EI85qQcy8A&s" alt="Discord">
  				</a>
			</div>

		
		</div>
		
		<!-- Footer Section -->
		<div class="footer">
			<p>@2024 Summit Strike All Rights Reserved.</p>
		</div>
	</div>
</body>
</html>

`;

		const info = await sendEmailSingleRecipient(
			accountDetails?.email,
			"Summit Strike Capital -  Stop Loss Warning 1",
			null,
			htmlContent
		);

		// Check if the response indicates a successful send
		if (typeof info === "string" && info.includes("OK")) {
			// Update emailSent field to true in the database
			await StopLossRiskModel.updateMany({ account: account }, { $set: { emailSent: true } });
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
	getStopLossRiskData,
	stopLossRisk,
	disableStopLossRiskedAccount,
	sendStopLossWarningEmail,
};
