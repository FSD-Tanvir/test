const { sendEmailSingleRecipient } = require("../../helper/mailing");
const { OrderCloseAll, accountUpdate } = require("../../thirdPartyMt5Api/thirdPartyMt5Api");
const { saveRealTimeLog } = require("../disableAccounts/disableAccounts.services");
const { MNewsTradingRisk } = require("./newsTradingRisk.schema");



const getEconomicEvents = async (filters = {}) => {
	const match = {};

	// Filter by country
	if (filters.country) match.country = filters.country;

	// Filter by impact
	if (filters.impact && ["Low", "Medium", "High"].includes(filters.impact)) {
		match.impact = filters.impact;
	}

	const pipeline = [];

	// Day-of-week filter (calculate based on UTC-6)
	if (filters.day) {
		const daysMap = {
			Sunday: 1,
			Monday: 2,
			Tuesday: 3,
			Wednesday: 4,
			Thursday: 5,
			Friday: 6,
			Saturday: 7,
		};
		const targetDay = daysMap[filters.day];

		if (targetDay) {
			pipeline.push({
				$addFields: {
					dateAsDate: { $toDate: "$date" }, // convert string to Date if needed
				},
			});
			pipeline.push({
				$addFields: {
					dayOfWeek: {
						$dayOfWeek: { $add: ["$dateAsDate", -6 * 60 * 60 * 1000] },
					},
				},
			});
			pipeline.push({ $match: { dayOfWeek: targetDay } });
		}
	} else {
		// If no day filter, still convert date to Date type for safe subtraction
		pipeline.push({
			$addFields: {
				dateAsDate: { $toDate: "$date" },
			},
		});
	}

	// Apply other filters
	if (Object.keys(match).length > 0) {
		pipeline.push({ $match: match });
	}

	// Subtract 6 hours for frontend display
	pipeline.push({
		$addFields: {
			date: { $add: ["$dateAsDate", -6 * 60 * 60 * 1000] },
		},
	});

	// Sort by date ascending
	pipeline.push({ $sort: { date: 1 } });

	// Remove temporary fields if needed
	pipeline.push({ $project: { dateAsDate: 0, dayOfWeek: 0 } });

	const data = await MNewsTradingRisk.aggregate(pipeline);
	return data;
};





const getAccountDetailsByAccountNumber = async (accountNumber) => {
	const data = await MNewsTradingRisk.aggregate([
		{ $unwind: "$newsTradingRiskAccountDetails" },
		{ $match: { "newsTradingRiskAccountDetails.account": accountNumber } },
		{
			$group: {
				_id: "$newsTradingRiskAccountDetails.account",
				entries: { $push: "$newsTradingRiskAccountDetails" },
				count: { $sum: 1 },
			},
		},
		{
			$project: {
				_id: 0,
				account: "$_id",
				entries: 1,
				flag: "$count",
			},
		},
	]);

	return data.length > 0 ? data[0] : null;
};

const sendWarningEmailForNewsTrading = async (account, accountDetails) => {
	try {
		const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>News Trading Violation Warning</title>
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
			background-color: #fce4ec; /* Subtle pink for highlights */
			color: #d32f2f;
			border-left: 4px solid #d32f2f;
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
			Foxx Funded - News Trading Warning
		</div>
		
		<!-- Content Section -->
		<div class="content">
			<p>Dear Trader,</p>
			<p>We hope this message finds you well.</p>
			
			<p>We would like to bring to your attention that on the following date(s): <strong>${accountDetails.openTime}</strong>, you executed trades that violated our News-Trading Rule. The specific tickets that breached this rule are as follows:</p>

			<p>
				TICKET(S):
				<strong>${accountDetails.ticket}</strong>
			</p>
			
			<p>Please review the News Trading rules carefully. This message is to inform you that the profit made during this time is deducted from your account. For more information, please refer to the relevant article in our Knowledge Center: https://foxx-funded.com/en/faqs#faq-section
            </p>

			<p>We will deduct the profits made from these trades and adjust your account balance accordingly.  This message serves as a warning; this is your second violation. Should there be another infraction, your Funded Account will be breached
            </p>

			<p>We appreciate your understanding and patience in this matter and wish you continued success with Foxx Fund.</p>

			<p>Thank you for your understanding and cooperation.</p>

			<p>Best regards,</p>
			<p>Foxx Funded Risk Team</p>

		<p>Please keep this information secure and do not share it with anyone.</p>
            <div class="download-links">
                <p>Download the MT5 for:</p>
                <a href="https://play.google.com/store/apps/details?id=net.metaquotes.metatrader5" target="_blank" rel="noopener noreferrer">Android</a>
                <a href="https://apps.apple.com/us/app/metatrader-5/id413251709" target="_blank" rel="noopener noreferrer">iOS</a>
                <a href="https://download.mql5.com/cdn/web/metaquotes.software.corp/mt5/metatrader5.apk?utm_source=www.metatrader5.com&utm_campaign=install.metaquotes" target="_blank" rel="noopener noreferrer">Desktop</a>
            </div>

		
		</div>
		
		<!-- Footer Section -->
		<div class="footer">
			<p>@2024 Foxx Funded All Rights Reserved.</p>
		</div>
	</div>
</body>
</html>

`;

		const info = await sendEmailSingleRecipient(
			accountDetails?.email,
			"Foxx Funded - News Trading Warning",
			null,
			htmlContent
		);
		if (typeof info === "string" && info.includes("OK")) {
			const updateResult = await MNewsTradingRisk.updateOne(
				{
					"newsTradingRiskAccountDetails.account": Number(account),
					"newsTradingRiskAccountDetails.ticket": Number(accountDetails.ticket),
				},
				{
					$set: {
						"newsTradingRiskAccountDetails.$.emailSent": true,
						"newsTradingRiskAccountDetails.$.emailCount": 1,
					},
				}
			);
		}

		return {
			success: true,
			message: `Warning email successfully sent to ${accountDetails?.email}`,
			emailInfo: info,
		};
	} catch (error) {
		throw new Error(`Error sending email: ${error.message}`);
	}
};

const disableRiskedAccountForNewsTrading = async (account, accountDetails) => {
	try {
		const message = "News Trading Violation";

		const userDisableDetails = {
			Rights: "USER_RIGHT_TRADE_DISABLED",
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
			(initialBalance = 0),
			(equity = 0),
			message
		);
		if (result.success) {
			console.log(`Log entry saved successfully for ${account}`);
		}
		let emailSent = true;
		(async () => {
			try {
				const tickets = accountDetails.tickets
					.map(
						(ticket) =>
							`<li>Ticket: ${ticket.ticket}, Open Time: ${new Date(
								ticket.openTime
							).toLocaleString()}</li>`
					)
					.join("");
				const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Breach Notification</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            background-color: #e57373;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .email-container {
            background-color: #ffffff;
            border-radius: 8px;
			border: 3px solid #d32f2f;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
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
            Subject: Summit Strike Capital - Breach of Account: News Trading Violation 
        </div>
        
        <!-- Content Section -->
        <div class="content">
            <p>Dear Trader,</p>
            <p>We hope this message finds you well.</p>

            <p>We wish to inform you that on the following date and ticket(s): <strong>${tickets}</strong> You executed trades that violated the News-Trading Rule. 
             </p>
            <p>This is your second(2) violation of the News-Trading Rule, resulting in the breach of your account as previously communicated. For more details, please refer to the News-Trading article in our Knowledge Center.
           </p>
            <p>We hope to see you trading with us again in the future. We appreciate your patience and wish you continued success with Summit Strike Capital.
           </p>

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
  				<a style="margin-left: 20px;" href="https://discord.com/invite/XTwRAEVm4G">
    				<img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRILFgGb5Qgu-Lc9kkKFcnjKso7EI85qQcy8A&s" alt="Discord">
  				</a>
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
					`Summit Strike Capital - Summit Strike Capital - Breach of Account: News Trading Violation Warning`,
					"",
					htmlContent
				);
			} catch (emailError) {
				emailSent = false;
				console.error(`Failed to send email to ${accountDetails?.email}: ${emailError.message}`);
			}
		})();

		if (emailSent) {
			await MNewsTradingRisk.updateMany({ account: account }, { $set: { isDisabled: true } });
		}
		return {
			success: true,
			message: `The account "${account}" has been successfully disabled due to exceeding the News Trading Risk. ${emailSent ? "An email notification has been sent." : "However, email notification failed."
				}`,
			emailSent,
		};
	} catch (error) {
		throw new Error(`Error disabling risked account: ${error.message}`);
	}
};

module.exports = {
	sendWarningEmailForNewsTrading,
	disableRiskedAccountForNewsTrading,
	getEconomicEvents,
	getAccountDetailsByAccountNumber,
};
