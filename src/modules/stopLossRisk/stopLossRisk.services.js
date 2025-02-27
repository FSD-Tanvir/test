const {
	stopLossDisabledEmailTemplate,
	sendStopLossWarningEmail1,
	sendStopLossWarningEmail2,
} = require("../../helper/emailTemplates/stopLossEmailTemplates");
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
					const accountSize = account.accountSize;

					orderHistory.forEach((order) => {
						const openTime = new Date(order.openTime);
						const closeTime = new Date(order.closeTime);

						const differenceInMs = closeTime - openTime; // Difference in milliseconds
						const differenceInMinutes = differenceInMs / (1000 * 60); // Convert milliseconds to minutes

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

	for (let i = 0; i < activeAccounts.length; i += batchSize) {
		const batch = activeAccounts.slice(i, i + batchSize);
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
				const htmlContent = stopLossDisabledEmailTemplate(account, accountDetails);
				await sendEmailSingleRecipient(
					accountDetails?.email,
					`Permanent Account Termination Due to Policy Violations`,
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
		let info;

		const htmlContent1 = sendStopLossWarningEmail1(account, accountDetails);
		const htmlContent2 = sendStopLossWarningEmail2(account, accountDetails);

		if (accountDetails.emailCount === 0) {
			info = await sendEmailSingleRecipient(
				accountDetails?.email,
				"Stop-Loss Warning 1: Compliance with Trading Policies",
				null,
				htmlContent1
			);
		} else {
			info = await sendEmailSingleRecipient(
				accountDetails?.email,
				"Stop-Loss Warning 2: Urgent Compliance Required",
				null,
				htmlContent2
			);
		}

		// Check if the response indicates a successful send
		if (typeof info === "string" && info.includes("OK")) {
			// Update emailSent field to true in the database
			await StopLossRiskModel.updateMany(
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
	getStopLossRiskData,
	stopLossRisk,
	disableStopLossRiskedAccount,
	sendStopLossWarningEmail,
};
