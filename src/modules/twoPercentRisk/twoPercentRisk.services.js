const { sendEmailSingleRecipient } = require("../../helper/mailing");
const { accountUpdate, OrderCloseAll } = require("../../thirdPartyMt5Api/thirdPartyMt5Api");
const { saveRealTimeLog } = require("../disableAccounst/disableAccounts.services");
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

        // Query to filter documents by optional 'date' and 'account', use lean() for performance
        const results = await MTwoPercentRiskModel.find(query)
            .sort({ createdAt: -1 }) // Sort by createdAt in descending order
            .lean();

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
                        !resultOpenTimesSet.has(record.openTime.getTime()) &&
                        record.openTime < parsedDate // Ensure it's before the specified openDate
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
                const tickets = accountDetails.tickets.join(", ");
                const htmlContent = `<!DOCTYPE html>
				<html lang="en">
				<head>
					<meta charset="UTF-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<title>Account Breach Notification</title>
				</head>
				<body style="font-family: Arial, sans-serif; background-color: #f7f8fa; margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh;">
					<div style="background-color: #ffffff; border-radius: 12px; max-width: 800px; margin: 0 auto; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1); border: 1px solid #e0e0e0; overflow: hidden;">
						<!-- Header Section -->
						<div style="background: linear-gradient(135deg, #d32f2f, #f44336); color: #ffffff; padding: 40px 20px; text-align: center; position: relative; border-bottom: 2px solid #eeeeee; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
							<img src="https://i.ibb.co.com/34qjbqp/Fox-Funded-Logo.png" alt="Foxx Funded Logo" style="width: 80px; margin-bottom: 15px;">
							<h1 style="font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">Your Account Has Been Disabled</h1>
							<p style="font-size: 16px; margin-top: 10px; opacity: 0.9;">Due to exceeding the 2% risk limit</p>
						</div>
				
						<!-- Content Section -->
						<div style="padding: 30px; font-size: 16px; line-height: 1.6; color: #444;">
							<p style="margin: 0 0 20px;">Dear Trader,</p>
							<p style="margin: 0 0 20px;">We hope this message finds you well.</p>
				
							<div style="background-color: #f7f8fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
								<p style="margin: 0 0 10px;">We are writing to inform you that your account <strong>${account}</strong> recent trading activities <strong>${tickets}</strong> has exceeded the allowable maximum risk exposure per trade. As per our guidelines, we permit a maximum of 2% risk per trade.</p>
								<p style="margin: 0;">This breach constitutes a violation of our trading rules. You have previously received a warning (Warning 1) regarding this matter. Consequently, since this is a second violation of this rule, it resulted in a hard breach, leading to your account being permanently marked as violated.</p>
							</div>
				
							<p style="margin: 0 0 20px;">We urge you to adhere strictly to our risk management guidelines to ensure the continued success and integrity of your trading activities. Should you have any questions or require further clarification, please do not hesitate to reach out.</p>
				
							<!-- Contact Link and Telegram Logo Section -->
							<div style="text-align: center; margin-top: 30px;">
								<p style="font-size: 14px; color: #777; margin-bottom: 10px;">
									<a href="https://foxx-funded.com/contact-us" target="_blank" rel="noopener noreferrer" style="color: #d32f2f; text-decoration: none; font-weight: bold;">
										Contact Us
									</a>
									for further assistance or join our Telegram community for updates:
								</p>
								<a href="https://t.me/+2QVq5aChxiBlOWFk" style="display: inline-block; margin: 0 auto;">
									<img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUQ9pRZvmScqICRjNBvAHEjIawnL1erY-AcQ&s" alt="Telegram" style="width: 32px; height: 32px; vertical-align: middle;">
								</a>
							</div>
						</div>
				
						<!-- Footer Section -->
						<div style="background-color: #f7f8fa; padding: 20px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #eeeeee; margin-top: 20px;">
							<p style="margin: 0;">@2024 Fox Funded. All Rights Reserved.</p>
						</div>
					</div>
				</body>
				</html>`;

                await sendEmailSingleRecipient(
                    accountDetails?.email,
                    `Foxx Funded - Maximum risk per trade exposure Breach`,
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
            await MTwoPercentRiskModel.updateMany(
                { account: account },
                { $set: { isDisabled: true } }
            );
        }

        // Return a success message but add a warning about email failure
        return {
            success: true,
            message: `The account "${account}" has been successfully disabled due to exceeding the 2% risk limit. ${
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

const sendWarningEmail = async (account, accountDetails) => {
    try {
        const htmlContent = `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Account Breach Notification</title>
		</head>
		<body style="font-family: Arial, sans-serif; background-color: #f7f8fa; margin: 0; padding: 20px; color: #333;">
			<div style="background-color: #ffffff; border-radius: 12px; max-width: 800px; margin: 0 auto; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1); border: 1px solid #e0e0e0; overflow: hidden;">
				
				<!-- Header Section with Gradient Background -->
				<div style="background: linear-gradient(135deg, #f57c00, #ffa726); color: #ffffff; padding: 40px 20px; text-align: center;">
					<img src="https://i.ibb.co.com/34qjbqp/Fox-Funded-Logo.png" alt="Company Logo" style="width: 90px; height: 90px; display: block; margin: 0 auto 15px;">
					<h1 style="font-size: 28px; font-weight: bold; margin: 0; letter-spacing: 0.5px; text-transform: uppercase;">Maximum Risk Per Trade Exposure Warning</h1>
				</div>
				
				<!-- Content Section -->
				<div style="padding: 30px 20px; font-size: 16px; line-height: 1.6; color: #444;">
					<p>Dear Trader,</p>
					<p>We hope this message finds you well.</p>
					
					<p>We are writing to inform you that your recent trading activity on your simulated trading account <strong>${account}</strong> has traits of gambling/punting. We urge you to stick within industry standards of risking no more than 1-2% of risk per trade idea. Below we’ll provide you with a few examples:</p>
		
					<!-- Warning Box -->
					<div style="background-color: #fff3e0; color: #d32f2f; border-left: 4px solid #f57c00; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
						<p style="margin: 0; font-weight: bold;">
							Taking a 1.5% risk position on the EU is considered fine.<br>
							Adding another 1.5% on GBPJPY is also fine.<br>
							However, if you proceed to open a 2.1% or higher risk on any pair/assets class, for example (XAUUSD/Gold), that is an indication of over-risking.<br>
							Lastly, splitting orders in multiple positions where the sum of the risk exceeds 2% is still considered gambling. For example, having 3 trades each with 1% risk on the same trade idea on any pair. The same trade made refers to trades opened in/around the same time and price point.
						</p>
					</div>
					
					<p>Exceeding this limit constitutes a breach of our trading rules. As this is your first violation, it will be considered a soft breach.</p>
		
					<p>Please be advised that a second violation of this rule will result in a hard breach, which will lead to your account being permanently marked as violated.</p>
		
					<p>We urge you to adhere strictly to our risk management guidelines to ensure the continued success and integrity of your trading activities. Should you have any questions or require further clarification, please do not hesitate to reach out.</p>
		
					<p>Thank you for your understanding and cooperation.</p>
		
					<p>Best regards,</p>
					<p style="font-weight: bold; color: #f57c00;">Foxx Funded Team</p>
		
					<!-- Contact Link -->
					<p style="font-size: 14px; color: #777; margin-top: 20px;">
						If you have any questions, feel free to
						<a href="https://foxx-funded.com/contact-us" target="_blank" rel="noopener noreferrer" style="color: #f57c00; text-decoration: none; font-weight: bold;">
							contact us or contact our support team
						</a>.
					</p>
		
					<!-- Social Links -->
					<div style="text-align: center; margin-top: 30px;">
						<a href="https://t.me/+2QVq5aChxiBlOWFk" style="text-decoration: none; display: inline-block;">
							<img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUQ9pRZvmScqICRjNBvAHEjIawnL1erY-AcQ&s" alt="Telegram" style="width: 40px; height: 40px;">
						</a>
					</div>
				</div>
				
				<!-- Footer Section -->
				<div style="background-color: #f7f8fa; padding: 20px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #eeeeee; margin-top: 20px;">
					<p>&copy; 2024 Foxx Funded. All Rights Reserved.</p>
				</div>
			</div>
		</body>
		</html>`;

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
                { $set: { emailSent: true } }
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
    getAccountRiskData,
    disableRiskedAccount,
    sendWarningEmail,
};
