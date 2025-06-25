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

		// Get all unique accounts from the results
		const uniqueAccounts = [...new Set(results.map((item) => item.account))];

		// Group and compare records
		const processedData = uniqueAccounts.map((account) => {
			const accountResults = results.filter((result) => result.account === account);

			return {
				account,
				matches: accountResults,
			};
		});

		for (const account of processedData) {
			const tickets = account.matches.map((account) => account.ticket);
			const accNumb = account.account;
			const email = account.matches[0].email;
			const currentEmailCount = account.matches[0].emailCount;

			// Calculate unique date count from matches array
			const uniqueDates = new Set(
				account.matches.map((match) => new Date(match.date).toISOString().split("T")[0])
			);
			const count = uniqueDates.size;

			const accountDetails = {
				email,
				account: accNumb,
				accountSize: account.matches[0].accountSize,
				emailCount: currentEmailCount,
				count,
				tickets,
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
					await MTwoPercentRiskModel.updateMany(
						{ account: accNumb },
						{ $set: { emailSent: true }, $inc: { emailCount: 1 } }
					);
				}
			};

			// Helper function to send the final breach notice and disable the account
			const disableAccount = async (accNumb, accountDetails) => {
				try {
					const message = "Two Percent Risk Violation";

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
					const htmlContent = twoPercentDisabledEmailTemplate(accNumb, accountDetails);
					await sendEmailSingleRecipient(
						accountDetails.email,
						"Final Breach Notice: Permanent Account Action Required",
						"",
						htmlContent
					);
					await MTwoPercentRiskModel.updateMany(
						{ account: accNumb },
						{ $set: { isDisabled: true } }
					);
				} catch (error) {
					console.error(
						`Failed to send final breach notice to ${accountDetails.email}: ${error.message}`
					);
				}
			};

			// Handle case where no emails have been sent yet
			if (currentEmailCount === 0) {
				if (count >= 1)
					await sendEmail(
						"Two Percent Warning 1: Foxx Funded - Maximum risk per trade exposure warning",
						sendTwoPercentWarningEmailTemplate
					);
				if (count >= 2)
					await sendEmail(
						"Two Percent Warning 2: Foxx Funded - Maximum risk per trade exposure warning",
						sendTwoPercentWarningEmailTemplate
					);

				if (!account.matches[0].isDisabled && count >= 3) {
					await disableAccount(accNumb, accountDetails);
				}
			}
			//  Handle case where one email has been sent
			else if (currentEmailCount === 1) {
				if (count >= 2) {
					await sendEmail(
						"Two Percent Warning 2: Foxx Funded - Maximum risk per trade exposure warning",
						sendTwoPercentWarningEmailTemplate
					);
				}
				if (!account.matches[0].isDisabled && count >= 3)
					await disableAccount(accNumb, accountDetails);
			}
			//  Handle case where two emails have been sent
			else if (currentEmailCount === 2) {
				if (!account.matches[0].isDisabled && count >= 3)
					await disableAccount(accNumb, accountDetails);
			} else {
				console.log("No action taken");
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
