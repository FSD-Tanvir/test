const {
	consistencyBreakDisabledEmailTemplate,
} = require("../../helper/emailTemplates/consistencyBreakEmailTemplates");
const {
	lotSizeDisabledEmailTemplate,
	sendLotSizeWarningEmailTemplate,
} = require("../../helper/emailTemplates/lotSizeEmailTemplates");
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
					emailCount: { $sum: "$emailCount" }, // Sum up the emailCount across documents
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
			emailCount: group.emailCount, // Include the emailCount in the output
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
				const htmlContent = lotSizeDisabledEmailTemplate(account, accountDetails);

				await sendEmailSingleRecipient(
					accountDetails?.email,
					`Final Breach Notice: Violation of Trading Policies
`,
					"",
					htmlContent
				);
			} catch (emailError) {
				emailSent = false;
				console.error(`Failed to send email to ${accountDetails?.email}: ${emailError.message}`);
			}
		})();

		if (emailSent) {
			await LotSizeRiskModel.updateMany({ account: account }, { $set: { isDisabled: true } });
		}

		// Return a success message but add a warning about email failure
		return {
			success: true,
			message: `The account "${account}" has been successfully disabled due to Lot Size Risk. ${
				emailSent ? "An email notification has been sent." : "However, email notification failed."
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
		const htmlContent = sendLotSizeWarningEmailTemplate(account, accountDetails);

		const info = await sendEmailSingleRecipient(
			accountDetails?.email,
			"Important Notice: Compliance with Trading Policies",
			null,
			htmlContent
		);

		// Check if the response indicates a successful send
		if (typeof info === "string" && info.includes("OK")) {
			// Update emailSent field to true in the database
			await LotSizeRiskModel.updateMany(
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
			message: `Lot size breach warning email successfully sent to ${accountDetails?.email}`,
			emailInfo: info,
		};
	} catch (error) {
		throw new Error(`Error sending email: ${error.message}`);
	}
};

/* -------------------------- // Send automated lot size  email ------------------------- */

const sendAutomatedLotSizeEmail = async () => {
	try {
		// Aggregation pipeline to group by account and sort
		const groupedData = await LotSizeRiskModel.aggregate([
			{
				$group: {
					_id: "$account",
					email: { $first: "$email" },
					accountSize: { $first: "$accountSize" },
					isDisabled: { $first: "$isDisabled" },
					emailSent: { $first: "$emailSent" },
					emailCount: { $sum: "$emailCount" },
					totalLotSize: { $sum: "$lotSize" },
					totalLotSizeLimit: { $sum: "$lotSizeLimit" },
					count: { $sum: 1 },
					accounts: { $push: "$$ROOT" },
				},
			},
			{ $sort: { "accounts.createdAt": -1 } },
		]);

		// Process data to match the desired output structure
		const processedData = groupedData.map((group) => ({
			account: group._id,
			email: group.email,
			accountSize: group.accountSize,
			totalLotSize: Number(group.totalLotSize),
			totalLotSizeLimit: Number(group.totalLotSizeLimit),
			totalTrades: group.count,
			emailCount: group.emailCount, // Include the emailCount in the output
			trades: group.accounts.map((trade) => ({
				ticket: trade.ticket,
				profit: Number(trade.profit),
				lotSize: Number(trade.lotSize),
				lotSizeLimit: Number(trade.lotSizeLimit),
				emailSent: trade.emailSent,
				emailCount: trade.emailCount,
				isDisabled: trade.isDisabled,
				createdAt: trade.createdAt,
			})),
		}));

		for (const account of processedData) {
			const { email, totalTrades, emailCount, account: accNumb } = account;

			// const currentEmailCount = emailCount / totalTrades;
			const currentEmailCount = account.trades[0].emailCount;

			const accountDetails = {
				email,
				accountSize: account.accountSize,
				totalLotSizeLimit: account.totalLotSizeLimit,
				totalTrades,
				emailCount,
				trades: account.trades,
			};

			// Helper function to send an email and update the database
			const sendEmail = async (subject, template) => {
				const htmlContent = template(accNumb, accountDetails);
				const info = await sendEmailSingleRecipient(
					accountDetails.email,
					subject,
					null,
					htmlContent
				);
				if (typeof info === "string" && info.includes("OK")) {
					await LotSizeRiskModel.updateMany(
						{ account: accNumb },
						{ $set: { emailSent: true }, $inc: { emailCount: 1 } }
					);
				}
			};

			// Helper function to send the final breach notice and disable the account
			const disableAccount = async (accNumb, accountDetails) => {
				try {
					const message = "Lot Size Rule Violation";

					const userDisableDetails = {
						Rights: "USER_RIGHT_TRADE_DISABLED", // cannot trade, but can login
						enabled: true,
					};

					const changeGroupDetails = {
						Group: "demo\\FXbin",
					};

					const [disableMT5Account, orderCloseAll, updateAccGroup] = await Promise.all([
						OrderCloseAll(accNumb),
						accountUpdate(accNumb, changeGroupDetails),
						accountUpdate(accNumb, userDisableDetails),
					]);

					if (disableMT5Account !== "OK") {
						return {
							success: false,
							message: `Failed to disable the account ${accNumb}. Please try again.`,
						};
					}

					const result = await saveRealTimeLog(
						accNumb,
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
					const htmlContent = lotSizeDisabledEmailTemplate(accNumb, accountDetails);
					await sendEmailSingleRecipient(
						accountDetails.email,
						"Final Breach Notice: Permanent Account Action Required",
						"",
						htmlContent
					);
					await LotSizeRiskModel.updateMany({ account: accNumb }, { $set: { isDisabled: true } });
				} catch (error) {
					console.error(
						`Failed to send final breach notice to ${accountDetails.email}: ${error.message}`
					);
				}
			};

			// Handle case where no emails have been sent yet
			if (currentEmailCount === 0) {
				if (totalTrades >= 1)
					await sendEmail(
						"Important Notice: Compliance with Trading Policies Warning - 1",
						sendLotSizeWarningEmailTemplate
					);
				if (totalTrades >= 2)
					await sendEmail(
						"Important Notice: Compliance with Trading Policies Warning - 2",
						sendLotSizeWarningEmailTemplate
					);

				if (!account.trades[0].isDisabled && totalTrades >= 3) {
					await disableAccount(accNumb, accountDetails);
				}
			}
			//  Handle case where one email has been sent
			else if (currentEmailCount === 1) {
				if (totalTrades >= 2) {
					await sendEmail(
						"Important Notice: Compliance with Trading Policies. Warning - 2",
						sendLotSizeWarningEmailTemplate
					);
				}
				if (!account.trades[0].isDisabled && totalTrades >= 3)
					await disableAccount(accNumb, accountDetails);
			}
			//  Handle case where two emails have been sent
			else if (currentEmailCount === 2) {
				if (!account.trades[0].isDisabled && totalTrades >= 3)
					await disableAccount(accNumb, accountDetails);
			} else {
				console.log("No action taken");
			}
		}

		console.log("Email processing for Lot Size completed successfully.");
	} catch (error) {
		console.log(error);
		throw new Error("Failed to fetch lot size risk data");
	}
};

module.exports = {
	lotSizeRisk,
	getLotSizeRiskData,
	disableLotRiskedAccount,
	sendLotSizeWarningEmail,
	sendAutomatedLotSizeEmail,
};
