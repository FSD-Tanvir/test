const {
	twoPercentDisabledEmailTemplate,
	sendTwoPercentWarningEmailTemplate,
} = require("../../helper/emailTemplates/twoPercentRiskEmailTemplates");
const { sendEmailSingleRecipient } = require("../../helper/mailing");
const { accountUpdate, OrderCloseAll } = require("../../thirdPartyMt5Api/thirdPartyMt5Api");
const { saveRealTimeLog } = require("../disableAccounts/disableAccounts.services");
const MTwoPercentRiskModel = require("./twoPercentRisk.schema");

const getAccountRiskData = async (openDate, account, page = 1, limit = 10) => {
	try {
		// Initialize an empty query object
		const query = {};

		// If openDate is provided, parse it into a Date object and add date filter to query
		if (openDate) {
			const parsedDate = new Date(`${openDate}T00:00:00.000Z`);
			query.date = {
				$gte: parsedDate,
				$lt: new Date(parsedDate.getTime() + 24 * 60 * 60 * 1000),
			};
		}

		// Convert the account from string to number (if provided)
		const accountNumber = account ? Number(account) : null;

		// Fetch the total number of records in the MTwoPercentRiskModel collection
		const totalRecordsInCollection = await MTwoPercentRiskModel.countDocuments();

		// If account is provided, add it to the query
		if (accountNumber) {
			query.account = accountNumber;
		}

		// Query to filter documents by optional 'date' and 'account'
		const results = await MTwoPercentRiskModel.find(query).sort({ createdAt: -1 }).lean();

		// Get all unique accounts from the current results
		const uniqueAccounts = [...new Set(results.map((item) => item.account))];

		// Fetch all records for these unique accounts at once (batch query)
		const allAccountRecords = await MTwoPercentRiskModel.find({
			account: { $in: uniqueAccounts },
		})
			.sort({ createdAt: -1 }) // Sort by createdAt in descending order
			.lean();

		// Create a Set for fast lookup of openTime in the results
		const resultOpenTimesSet = new Set(results.map((result) => result.openTime.getTime()));

		// Group and compare records
		const groupedData = uniqueAccounts.map((account) => {
			// Filter records for the current account
			const accountResults = results.filter((result) => result.account === account);
			const accountRecords = allAccountRecords.filter((record) => record.account === account);

			// If openDate is provided, find records with different openTime that occurred before the openDate
			let differentOpenTimeRecords = [];
			if (openDate) {
				const parsedDate = new Date(`${openDate}T00:00:00.000Z`);
				differentOpenTimeRecords = accountRecords.filter(
					(record) =>
						!resultOpenTimesSet.has(record.openTime.getTime()) && record.openTime < parsedDate // Ensure it's before the specified openDate
				);
			}

			// Extract count and dates of records with different openTime
			const differentOpenTimeDetails = differentOpenTimeRecords.map((record) => ({
				openTime: record.openTime,
				date: record.date,
			}));

			// Ensure dates are unique by converting to ISO string and using Set
			let uniqueDates = Array.from(
				new Set(differentOpenTimeDetails.map((detail) => detail.date.toISOString()))
			);

			// If no openDate, extract unique dates from 'matches' (accountResults)
			if (!openDate) {
				uniqueDates = Array.from(
					new Set(accountResults.map((result) => result.date.toISOString()))
				);
			}

			// Return grouped data for this account
			return {
				account,
				matches: accountResults,
				differentOpenTime: {
					count: uniqueDates.length,
					dates: uniqueDates, // Now with only unique ISO dates
				},
			};
		});

		// Implement pagination by slicing the grouped data
		const totalRecords = groupedData.length;
		const totalPages = Math.ceil(totalRecords / limit);
		const paginatedData = groupedData.slice((page - 1) * limit, page * limit);

		// Return paginated data and pagination metadata
		return {
			data: paginatedData,
			totalRecords,
			totalPages,
			currentPage: page,
			perPage: limit,
			totalRecordsInCollection,
		};
	} catch (error) {
		throw new Error(`Error fetching account risk data: ${error.message}`);
	}
};

const disableRiskedAccount = async (account, accountDetails) => {
	try {
		const message = "Two Percent Violation";

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
				const htmlContent = twoPercentDisabledEmailTemplate(account, accountDetails);
				await sendEmailSingleRecipient(
					accountDetails?.email,
					`Foxx Funded - Maximum risk per trade exposure Breach`,
					"",
					htmlContent
				);
			} catch (emailError) {
				emailSent = false;
				console.error(`Failed to send email to ${accountDetails?.email}: ${emailError.message}`);
			}
		})();

		if (emailSent) {
			await MTwoPercentRiskModel.updateMany({ account: account }, { $set: { isDisabled: true } });
		}

		// Return a success message but add a warning about email failure
		return {
			success: true,
			message: `The account "${account}" has been successfully disabled due to exceeding the 2% risk limit. ${
				emailSent ? "An email notification has been sent." : "However, email notification failed."
			}`,
			emailSent,
		};
	} catch (error) {
		throw new Error(`Error disabling risked account: ${error.message}`);
	}
};

const sendWarningEmail = async (account, accountDetails) => {
	try {
		const htmlContent = sendTwoPercentWarningEmailTemplate(account, accountDetails);

		const info = await sendEmailSingleRecipient(
			accountDetails?.email,
			"Foxx Funded - Maximum risk per trade exposure warning",
			null,
			htmlContent
		);

		// Check if the response indicates a successful send
		if (typeof info === "string" && info.includes("OK")) {
			// Update emailSent field to true in the database
			await MTwoPercentRiskModel.updateMany(
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

/* -------------------------- // Send automated stop loss email ------------------------- */

const sendAutomatedTwoPercentEmail = async () => {
	try {
		const results = await MTwoPercentRiskModel.find().sort({ createdAt: -1 }).lean();

		const uniqueAccounts = [...new Set(results.map((item) => item.account))];

		const processedData = uniqueAccounts.map((account) => {
			const accountResults = results.filter((result) => result.account === account);
			return {
				account,
				matches: accountResults,
			};
		});

		for (const account of processedData) {
			const accNumb = account.account;
			const matches = account.matches;
			const email = matches[0].email;
			const currentEmailCount = matches[0].emailCount || 0;
			const isDisabled = matches[0].isDisabled || false;
			const tickets = matches.map((m) => m.ticket);

			// Count unique dates (breaches)
			const uniqueDates = new Set(
				matches.map((match) => new Date(match.date).toISOString().split("T")[0])
			);
			const count = uniqueDates.size;

			if (isDisabled) {
				console.log(`Account ${accNumb} already disabled. Skipping.`);
				continue;
			}

			const accountDetails = {
				email,
				account: accNumb,
				accountSize: matches[0].accountSize,
				emailCount: currentEmailCount,
				count,
				tickets,
			};

			const sendEmail = async (subject, template) => {
				try {
					const htmlContent = template(accNumb, accountDetails);
					const info = await sendEmailSingleRecipient(email, subject, null, htmlContent);
					if (typeof info === "string" && info.includes("OK")) {
						await MTwoPercentRiskModel.updateMany(
							{ account: accNumb },
							{ $set: { emailSent: true }, $inc: { emailCount: 1 } }
						);
					}
				} catch (err) {
					console.error(`Failed to send warning email to ${email}: ${err.message}`);
				}
			};

			const disableAccount = async () => {
				try {
					const message = "Two Percent Risk Violation";

					const userDisableDetails = {
						Rights: "USER_RIGHT_TRADE_DISABLED",
						enabled: true,
					};

					const changeGroupDetails = {
						Group: "demo\\FXbin",
					};

					// Step 1: Close all orders
					const orderCloseAll = await OrderCloseAll(accNumb);

					// Step 2: Change group
					const updateGroup = await accountUpdate(accNumb, changeGroupDetails);

					// Step 3: Disable trading rights
					const updateRights = await accountUpdate(accNumb, userDisableDetails);

					// If any of the 3 failed, log and skip this account
					if (
						// orderCloseAll !== "OK" ||
						// updateGroup !== "OK" ||
						updateRights !== "OK"
					) {
						console.error(`❌ Failed to disable account ${accNumb}`);
						return; // skip to next account (caller function should handle looping through accounts)
					}

					// Step 4: Save real-time log
					const result = await saveRealTimeLog(
						accNumb,
						(lossPercentage = 0),
						(asset = 0),
						(balance = 0),
						(initialBalance = accountDetails.accountSize),
						(equity = 0),
						message
					);

					if (!result.success) {
						console.error(`⚠️ Failed to log disable event for account ${accNumb}`);
					} else {
						console.log(`✅ Log saved for account ${accNumb}`);
					}

					// Step 5: Send email
					const htmlContent = twoPercentDisabledEmailTemplate(accNumb, accountDetails);
					await sendEmailSingleRecipient(
						email,
						"Final Breach Notice: Permanent Account Action Required",
						null,
						htmlContent
					);

					// Step 6: Update DB to mark account as disabled
					await MTwoPercentRiskModel.updateMany(
						{ account: accNumb },
						{ $set: { isDisabled: true } }
					);

					console.log(`✅ Account ${accNumb} disabled and email sent.`);
				} catch (error) {
					console.error(`Error disabling account ${accNumb}: ${error.message}`);
				}
			};

			// Email logic based on email count and unique date count
			if (currentEmailCount === 0) {
				if (count >= 1) {
					await sendEmail(
						"Two Percent Warning 1: Foxx Funded - Maximum risk per trade exposure warning",
						sendTwoPercentWarningEmailTemplate
					);
				}
				if (count >= 2) {
					await sendEmail(
						"Two Percent Warning 2: Foxx Funded - Maximum risk per trade exposure warning",
						sendTwoPercentWarningEmailTemplate
					);
				}
				if (count >= 3) {
					await disableAccount();
				}
			} else if (currentEmailCount === 1) {
				if (count >= 2) {
					await sendEmail(
						"Two Percent Warning 2: Foxx Funded - Maximum risk per trade exposure warning",
						sendTwoPercentWarningEmailTemplate
					);
				}
				if (count >= 3) {
					await disableAccount();
				}
			} else if (currentEmailCount === 2 && count >= 3) {
				await disableAccount();
			} else {
				console.log(`No action taken for account ${accNumb}`);
			}
		}

		console.log("Email processing for Two Percent Risk completed successfully.");
	} catch (error) {
		throw new Error(`Error fetching account risk data: ${error.message}`);
	}
};

module.exports = {
	getAccountRiskData,
	disableRiskedAccount,
	sendWarningEmail,
	sendAutomatedTwoPercentEmail,
};
