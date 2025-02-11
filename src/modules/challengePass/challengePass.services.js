const { sendEmailSingleRecipient } = require("../../helper/mailing");
const {
	getUniqueTradingDays,
	getDateBeforeDays,
	formatDateTime,
} = require("../../helper/utils/dateUtils");
const generatePassword = require("../../helper/utils/generatePasswordForMt5");
const {
	accountUpdate,
	accountCreateAndDeposit,
	orderHistories,
	accountDetails,
} = require("../../thirdPartyMt5Api/thirdPartyMt5Api");
const MUser = require("../users/users.schema");
const StoreDataModel = require("../breach/breach.schema");

// Helper function to find existing MT5 account with the same productId and challengeStage
const findMT5Account = async (user, productId, stage) => {
	try {
		// Assuming you have a collection or database call to find accounts
		const existingAccount = user.mt5Accounts.find(
			(acc) => acc.productId === productId && acc.challengeStage === stage
		);

		return existingAccount;
	} catch (error) {
		console.error("Error in finding MT5 account:", error.message);
		return null;
	}
};

const getPhasedUsersForAPI = async (acc) => {
	try {
		// Query to find all MUser documents where at least one mt5Account meets all three conditions
		const users = await MUser.find(
			{
				"mt5Accounts.account": acc,
				mt5Accounts: {
					$elemMatch: {
						challengeStage: { $ne: "funded" },
						challengeStatus: { $ne: "passed" },
						accountStatus: { $eq: "active" },
					},
				},
			},
			{
				mt5Accounts: 1, // Project all mt5Accounts to filter in application logic
				email: 1, // Include email or other identifying fields if necessary
				_id: 1,
			}
		).exec();

		// Flatten the array of matched mt5Accounts and inject user email and _id
		const filteredAccounts = users.flatMap((user) =>
			user.mt5Accounts
				.filter(
					(account) =>
						account.challengeStage !== "funded" &&
						account.challengeStatus !== "passed" &&
						account.accountStatus === "active"
				)
				.map((account) => ({
					...account.toObject(), // Convert the Mongoose document to a plain object if necessary
					email: user.email,
					userId: user._id,
				}))
		);

		return filteredAccounts;
	} catch (err) {
		console.error("Error fetching filtered mt5Accounts:", err);
		throw err;
	}
};

const passingChallengeUsingAPI = async (mt5Account) => {
	try {
		const startDate = "1990-12-07 12:33:12";
		const endDate = formatDateTime(new Date());

		// Retrieve the list of users currently in the phased challenge.
		const accounts = await getPhasedUsersForAPI(mt5Account);

		// If no accounts are found, log an error message and exit the function.
		if (accounts.length === 0) {
			console.error("No accounts found for processing manually.");
			return;
		}

		// Iterate over each account to check and update their challenge status.
		for (const acc of accounts) {
			const { challengeStage, challengeStageData, userId, account: accNumber } = acc;

			// Check if accNumber is available
			if (!accNumber) {
				console.log("Account number is missing, skipping this account.");
				continue; // Skip to the next iteration if accNumber is not available
			}

			// Check if challengeStageData and challengeStages are defined and valid
			if (
				!challengeStageData ||
				!challengeStageData.challengeStages ||
				!challengeStageData.challengeStages[challengeStage]
			) {
				continue; // Skip to the next iteration if data is undefined
			}

			const { minTradingDays, profitTarget } = challengeStageData.challengeStages[challengeStage];
			const calculatedProfitTarget = challengeStageData.accountSize * (profitTarget / 100);
			const accountSize = challengeStageData.accountSize;

			let tradeHistories, traderProfitTarget;

			try {
				// Getting trade histories & account details from MT5
				[tradeHistories, traderProfitTarget] = await Promise.all([
					orderHistories(accNumber, startDate, endDate),
					accountDetails(accNumber),
				]);
				// Ensure tradeHistories is an array
				if (!Array.isArray(tradeHistories)) {
					tradeHistories = []; // Fallback to an empty array
				}
			} catch (error) {
				console.error(`Error fetching data for account ${accNumber}:`, error.message);

				continue; // Skip to the next account if there is an error
			}

			// get unique trading days
			const tradingDays = getUniqueTradingDays(tradeHistories);
			const balance = traderProfitTarget.balance;
			const traderProfit = Number(balance - accountSize);

			// check if trading days are greater than minTradingDays and traderProfit is greater than calculatedProfitTarget
			const checkPassed = tradingDays >= minTradingDays && traderProfit >= calculatedProfitTarget;

			if (checkPassed) {
				// Fetch the user document from the database using userId.
				const user = await MUser.findById(userId);

				// If the user is not found, log an error and skip to the next account.
				if (!user) {
					console.error(`User not found for userId: ${userId}`);
					continue;
				}

				// Find the MT5 account associated with this user.
				const account = user.mt5Accounts.find((a) => a.account === accNumber);

				if (account) {
					const changeGroupDetails = {
						Group: "demo\\forex-hedge-usd-01",
					};

					const changeGroup = await accountUpdate(account.account, changeGroupDetails);

					if (changeGroup === "OK") {
						// Update the user's account status in the database.
						account.group = changeGroupDetails.Group;
						await user.save();

						// Disable trading rights for the MT5 account.
						const userDisableDetails = {
							Rights: "USER_RIGHT_TRADE_DISABLED",
							enabled: true,
						};

						// API call to disable MT5 account and verify the response.
						const disableMT5Account = await accountUpdate(account.account, userDisableDetails);

						if (disableMT5Account === "OK") {
							// Update the user's account status in the database.
							account.challengeStatus = "passed";
							account.accountStatus = "inActive";
							await user.save();

							// Check if the user needs to be assigned a new MT5 account based on their challenge progress.
							await handleNextChallengeStage(account, user, acc);
						} else {
							console.error(`Failed to disable the account in MT5. : ${accNumber}`);
						}
					}
				} else {
					console.warn(`Account not found for accNumber: ${accNumber}`);
				}
			} else {
				console.log(`Account - ${accNumber} has not passed the challenge yet.`);
			}
		}

		// Return the processed accounts.
		return accounts;
	} catch (error) {
		console.error("An error occurred in the passingChallenge function:", error.message);
		throw new Error("Failed to process the passing challenge due to an unexpected error.");
	}
};

/* ---------------------------------------------------------------------------------------------- */
/*                                   //! AUTOMATIC CHALLENGE PASS                                  */
/* ---------------------------------------------------------------------------------------------- */
const getPhasedUsers = async () => {
	try {
		// Query to find all MUser documents where at least one mt5Account meets all three conditions
		const users = await MUser.find(
			{
				mt5Accounts: {
					$elemMatch: {
						challengeStage: { $ne: "funded" },
						challengeStatus: { $ne: "passed" },
						accountStatus: { $eq: "active" },
					},
				},
			},
			{
				mt5Accounts: 1, // Project all mt5Accounts to filter in application logic
				email: 1, // Include email or other identifying fields if necessary
				_id: 1,
			}
		).exec();

		// Flatten the array of matched mt5Accounts and inject user email and _id
		const filteredAccounts = users.flatMap((user) =>
			user.mt5Accounts
				.filter(
					(account) =>
						account.challengeStage !== "funded" &&
						account.challengeStatus !== "passed" &&
						account.accountStatus === "active"
				)
				.map((account) => ({
					...account.toObject(), // Convert the Mongoose document to a plain object if necessary
					email: user.email,
					userId: user._id,
				}))
		);

		return filteredAccounts;
	} catch (err) {
		console.error("Error fetching filtered mt5Accounts:", err);
		throw err;
	}
};

const passingChallenge = async () => {
	try {
		const startDate = "1990-12-07 12:33:12";
		const endDate = formatDateTime(new Date());

		// Retrieve the list of users currently in the phased challenge.
		const accounts = await getPhasedUsers();

		// If no accounts are found, log an error message and exit the function.
		if (accounts.length === 0) {
			console.error("No accounts found for processing.");
			return;
		}

		// Iterate over each account to check and update their challenge status.
		for (const acc of accounts) {
			const { challengeStage, challengeStageData, userId, account: accNumber } = acc;

			// Check if accNumber is available
			if (!accNumber) {
				console.log("Account number is missing, skipping this account.");
				continue; // Skip to the next iteration if accNumber is not available
			}

			// Check if challengeStageData and challengeStages are defined and valid
			if (
				!challengeStageData ||
				!challengeStageData.challengeStages ||
				!challengeStageData.challengeStages[challengeStage]
			) {
				continue; // Skip to the next iteration if data is undefined
			}

			const { minTradingDays, profitTarget } = challengeStageData.challengeStages[challengeStage];
			const calculatedProfitTarget = challengeStageData.accountSize * (profitTarget / 100);
			const accountSize = challengeStageData.accountSize;

			let tradeHistories, traderProfitTarget;

			try {
				// Getting trade histories & account details from MT5
				[tradeHistories, traderProfitTarget] = await Promise.all([
					orderHistories(accNumber, startDate, endDate),
					accountDetails(accNumber),
				]);
				// Ensure tradeHistories is an array
				if (!Array.isArray(tradeHistories)) {
					tradeHistories = []; // Fallback to an empty array
				}
			} catch (error) {
				console.error(`Error fetching data for account ${accNumber}:`, error.message);
				continue; // Skip to the next account if there is an error
			}

			// get unique trading days
			const tradingDays = getUniqueTradingDays(tradeHistories);
			const balance = traderProfitTarget.balance;
			const traderProfit = Number(balance - accountSize);

			// check if trading days are greater than minTradingDays and traderProfit is greater than calculatedProfitTarget
			const checkPassed = tradingDays >= minTradingDays && traderProfit >= calculatedProfitTarget;

			if (checkPassed) {
				// Fetch the user document from the database using userId.
				const user = await MUser.findById(userId);

				// If the user is not found, log an error and skip to the next account.
				if (!user) {
					console.error(`User not found for userId: ${userId}`);
					continue;
				}

				// Find the MT5 account associated with this user.
				const account = user.mt5Accounts.find((a) => a.account === accNumber);

				if (account) {
					const changeGroupDetails = {
						Group: "demo\\forex-hedge-usd-01", //! TODO : Change the group
					};

					const changeGroup = await accountUpdate(account.account, changeGroupDetails);

					if (changeGroup === "OK") {
						// Update the user's account status in the database.
						account.group = changeGroupDetails.Group;
						await user.save();

						// Disable trading rights for the MT5 account.
						const userDisableDetails = {
							// Rights: "USER_RIGHT_TRADE_DISABLED",
							Rights: "USER_RIGHT_TRADE_DISABLED",
							enabled: true,
							// Group: "demo\\real\\Bin-P",
						};

						// API call to disable MT5 account and verify the response.
						const disableMT5Account = await accountUpdate(account.account, userDisableDetails);

						if (disableMT5Account === "OK") {
							// Update the user's account status in the database.
							account.challengeStatus = "passed";
							account.accountStatus = "inActive";
							await user.save();

							// Check if the user needs to be assigned a new MT5 account based on their challenge progress.
							await handleNextChallengeStage(account, user, acc);
						} else {
							console.error(`Failed to disable the account in MT5. : ${accNumber}`);
						}
					}
				} else {
					console.warn(`Account not found for accNumber: ${accNumber}`);
				}
			} else {
				// console.log(`Account - ${accNumber} has not passed the challenge yet.`);
			}
		}

		// Return the processed accounts.
		return accounts;
	} catch (error) {
		console.error("An error occurred in the passingChallenge function:", error.message);
		throw new Error("Failed to process the passing challenge due to an unexpected error.");
	}
};

// Function to determine and assign the next challenge stage for the user if applicable.
const handleNextChallengeStage = async (account, user, acc) => {
	try {
		const { challengeStageData, productId, challengeStage } = account;
		const purchasedProduct = user.purchasedProducts.get(productId);
		if (
			challengeStage === "phase1" &&
			account.challengeStatus === "passed" &&
			account.accountStatus === "inActive" &&
			challengeStageData.challengeType === "twoStep"
		) {
			const phase2Account = await findMT5Account(user, productId, "phase2");
			if (!phase2Account) {
				await assignNewMT5Account(account, user, acc, purchasedProduct, "phase1", "phase2");
			} else {
				console.log("Phase 2 account already exists for user");
			}
		} else if (
			challengeStage === "phase2" &&
			account.challengeStatus === "passed" &&
			account.accountStatus === "inActive" &&
			challengeStageData.challengeType === "twoStep"
		) {
			const fundedAccount = await findMT5Account(user, productId, "funded");
			if (!fundedAccount) {
				await assignNewMT5Account(account, user, acc, purchasedProduct, "phase2", "funded");
			} else {
				console.log("Funded account already exists for user");
			}
		} else if (
			challengeStage === "phase1" &&
			account.challengeStatus === "passed" &&
			account.accountStatus === "inActive" &&
			challengeStageData.challengeType === "oneStep"
		) {
			const fundedAccount = await findMT5Account(user, productId, "funded");
			if (!fundedAccount) {
				await assignNewMT5Account(account, user, acc, purchasedProduct, "phase1", "funded");
			} else {
				console.log("Funded account already exists for user");
			}
		}
	} catch (error) {
		console.error("Error in handling next challenge stage:", error.message);
	}
};

// Function to assign a new MT5 account when the user progresses to the next challenge stage.
const assignNewMT5Account = async (
	account,
	user,
	acc,
	purchasedProduct,
	previousChallengeStage,
	newChallengeStage
) => {
	try {
		let group = acc.group;
		if (newChallengeStage === "phase2") {
			group = "demo\\phase2";
		} else if (newChallengeStage === "funded") {
			group = "demo\\phase3";
		}

		// Prepare data for creating a new MT5 account.
		const mt5SignUpData = {
			EMail: user.email,
			master_pass: generatePassword(),
			investor_pass: generatePassword(),
			amount: account.challengeStageData.accountSize,
			FirstName: `Foxx Funded - ${
				account?.challengeStageData?.challengeName
			} (${newChallengeStage}) ${user.first ? user.first : ""}`,
			LastName: user?.last,
			Country: user?.country,
			Address: user?.addr,
			City: user?.city,
			ZIPCode: user?.zipCode,
			Phone: user?.phone,
			Leverage: 30,
			Group: group,
			Rights: newChallengeStage === "funded" && "USER_RIGHT_TRADE_DISABLED",
		};

		// API call to create a new MT5 account.
		const createUser = await accountCreateAndDeposit(mt5SignUpData);

		// If account creation fails, throw an error.
		if (!createUser.login) {
			throw new Error("Failed to create user in MT5");
		}

		await StoreDataModel.findOneAndUpdate(
			{},
			{
				$push: {
					dailyData: {
						mt5Account: createUser?.login,
						asset: mt5SignUpData.amount,
						dailyStartingBalance: mt5SignUpData.amount,
						dailyStartingEquity: mt5SignUpData.amount,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				},
			},
			{
				sort: { _id: -1 }, // Sort by _id in descending order to get the last document
				new: true,
			}
		);

		// Construct the new MT5 account object based on the new challenge stage.
		const newMt5Account = {
			account: createUser.login,
			investorPassword: createUser.investor_pass,
			masterPassword: createUser.master_pass,
			productId: purchasedProduct.productId,
			challengeStage: newChallengeStage,
			challengeStageData: {
				...purchasedProduct.product,
				challengeStages: {
					phase1: null,
					phase2:
						newChallengeStage === "phase2"
							? {
									maxDailyDrawdown: 4,
									maxDrawdown: 8,
									tradingPeriod: "360 Days",
									profitTarget: 7,
									minTradingDays: 5,
									drawdownType: "equity-based",
									profitSpilt: "90/10",
									payouts: false,
									leverage: 100,
									stage: "phase2",
							  }
							: null,
					funded:
						newChallengeStage === "funded"
							? {
									maxDailyDrawdown: 4,
									maxDrawdown: 8,
									tradingPeriod: "Unlimited",
									profitTarget: null,
									minTradingDays: 1,
									drawdownType: "equity-based",
									profitSpilt: "90/10",
									payouts: true,
									leverage: 100,
									stage: "funded",
							  }
							: null,
				},
			},
			group: group,
		};

		const passedHTMLTemplate = `<!DOCTYPE html>
<html>
<head>
	<style>
		/* Basic reset for email clients */
		body, table, td, a {
			-webkit-text-size-adjust: 100%;
			-ms-text-size-adjust: 100%;
		}
		table, td {
			mso-table-lspace: 0pt;
			mso-table-rspace: 0pt;
		}
		img {
			-ms-interpolation-mode: bicubic;
			border: 0;
			height: auto;
			line-height: 100%;
			outline: none;
			text-decoration: none;
		}
		body {
			font-family: Arial, sans-serif;
			background-color: #f7f8fa;
			margin: 0;
			padding: 0;
			display: flex;
			justify-content: center;
			align-items: center;
			min-height: 100vh;
		}
		.email-container {
			background-color: #ffffff;
			border-radius: 12px;
			box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
			max-width: 600px;
			width: 100%;
			overflow: hidden;
			margin: 20px;
			border: 1px solid #e0e0e0;
		}
		.header {
			background: #DB8112; /* Fallback for older email clients */
			background: linear-gradient(135deg, #DB8112, #ffa64d);
			padding: 40px 20px;
			text-align: center;
			color: #ffffff;
		}
		.header img {
			width: 80px;
			margin-bottom: 15px;
		}
		.congrats-container {
			text-align: center;
			margin: 20px 0;
		}
		.congrats-text {
			color: #DB8112;
			font-size: 32px;
			font-weight: 700;
			margin: 0;
			text-transform: uppercase;
			letter-spacing: 1px;
		}
		.content {
			padding: 30px;
			color: #333333;
			line-height: 1.6;
		}
		.content p {
			margin: 0 0 15px;
		}
		.highlight {
			color: #DB8112;
			font-weight: 600;
		}
		.message-warning {
			text-align: center;
			background-color: #fff7e6;
			border: 1px solid #ffe0b3;
			padding: 15px;
			border-radius: 8px;
			font-size: 14px;
			color: #A35E04;
			margin: 20px 0;
		}
		.download-section {
			text-align: center;
			margin-top: 25px;
		}
		.download-text {
			font-size: 18px;
			font-weight: 600;
			color: #333333;
			margin-bottom: 15px;
		}
		.download-links {
			text-align: center;
		}
		.download-links a {
			display: inline-block;
			color: #ffffff;
			text-decoration: none;
			font-weight: 600;
			padding: 10px 20px;
			border-radius: 6px;
			background: #DB8112; /* Fallback for older email clients */
			background: linear-gradient(135deg, #DB8112, #ffa64d);
			transition: all 0.3s ease;
			margin: 5px;
			box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		}
		.download-links a:hover {
			background: #bf6e0f; /* Fallback for older email clients */
			background: linear-gradient(135deg, #bf6e0f, #e68a2e);
			box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
		}
		.footer {
			background-color: #f7f8fa;
			padding: 20px;
			text-align: center;
			font-size: 12px;
			color: #888888;
			border-top: 1px solid #eeeeee;
			margin-top: 20px;
		}
		.footer p {
			margin: 0 0 10px;
			line-height: 1.5;
		}
		.footer a {
			color: #DB8112;
			text-decoration: none;
			font-weight: 600;
		}
		.footer a:hover {
			text-decoration: underline;
		}

		/* Responsive styling */
		@media (max-width: 480px) {
			.congrats-text {
				font-size: 24px;
			}
			.content {
				padding: 20px;
			}
			.download-links a {
				display: block;
				width: 100%;
				box-sizing: border-box;
				margin: 5px 0;
			}
			.footer {
				font-size: 10px;
			}
		}
	</style>
</head>
<body>
	<div class="email-container">
		<!-- Header with Gradient Background -->
		<div class="header" style="background: #DB8112; background: linear-gradient(135deg, #DB8112, #ffa64d); padding: 40px 20px; text-align: center; color: #ffffff;">
			<img src="https://i.ibb.co.com/34qjbqp/Fox-Funded-Logo.png" alt="Company Logo" style="width: 80px; margin-bottom: 15px;">
		</div>

		<!-- Congratulations Section -->
		<div class="congrats-container">
			<h2 class="congrats-text" style="color: #DB8112; font-size: 32px; font-weight: 700; margin: 0; text-transform: uppercase; letter-spacing: 1px;">🎉 Congratulations! 🎉</h2>
		</div>

		<!-- Content Section -->
		<div class="content" style="padding: 30px; color: #333333; line-height: 1.6;">
			<p>Dear User,</p>
			<p>You have passed the <strong>${previousChallengeStage}</strong> of <strong>${account?.challengeStageData?.challengeName}</strong>. You are now in the <strong>${newChallengeStage}</strong> of <strong>${account?.challengeStageData?.challengeName}</strong>. Keep up the great work! 🌟</p>
			<p><strong>Account:</strong> <span class="highlight" style="color: #DB8112; font-weight: 600;">${newMt5Account?.account}</span></p>
			<p><strong>Password:</strong> <span class="highlight" style="color: #DB8112; font-weight: 600;">${newMt5Account?.masterPassword}</span></p>
			<p><strong>Platform:</strong> MT5</p>
			<p><strong>Broker:</strong> BizzTrade</p>
			<p class="message-warning" style="text-align: center; background-color: #fff7e6; border: 1px solid #ffe0b3; padding: 15px; border-radius: 8px; font-size: 14px; color: #A35E04; margin: 20px 0;">Please keep this information secure and do not share it with anyone.</p>

			<!-- Download Section with Gradient Buttons -->
			<div class="download-section" style="text-align: center; margin-top: 25px;">
				<div class="download-text" style="font-size: 18px; font-weight: 600; color: #333333; margin-bottom: 15px;">Download the MT5 for:</div>
				<div class="download-links" style="text-align: center;">
					<a href="https://play.google.com/store/apps/details?id=net.metaquotes.metatrader5" target="_blank" style="display: inline-block; color: #ffffff; text-decoration: none; font-weight: 600; padding: 10px 20px; border-radius: 6px; background: #DB8112; background: linear-gradient(135deg, #DB8112, #ffa64d); transition: all 0.3s ease; margin: 5px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">Android</a>
					<a href="https://apps.apple.com/us/app/metatrader-5/id413251709" target="_blank" style="display: inline-block; color: #ffffff; text-decoration: none; font-weight: 600; padding: 10px 20px; border-radius: 6px; background: #DB8112; background: linear-gradient(135deg, #DB8112, #ffa64d); transition: all 0.3s ease; margin: 5px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">iOS</a>
					<a href="https://download.mql5.com/cdn/web/metaquotes.software.corp/mt5/metatrader5.apk?utm_source=www.metatrader5.com&utm_campaign=install.metaquotes" target="_blank" style="display: inline-block; color: #ffffff; text-decoration: none; font-weight: 600; padding: 10px 20px; border-radius: 6px; background: #DB8112; background: linear-gradient(135deg, #DB8112, #ffa64d); transition: all 0.3s ease; margin: 5px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">Desktop</a>
				</div>
			</div>
		</div>

		<!-- Footer Section -->
		<div class="footer" style="background-color: #f7f8fa; padding: 20px; text-align: center; font-size: 12px; color: #888888; border-top: 1px solid #eeeeee; margin-top: 20px;">
			<p>⚠ <strong>Warning:</strong><br>Please ensure that you are familiar with all the <a href="https://foxx-funded.com/faqs" target="_blank" rel="noopener noreferrer" style="color: #DB8112; text-decoration: none; font-weight: 600;">rules and regulations</a> of <strong>Foxx Funded</strong>. Failure to comply may result in breach or disqualification. Stay informed and follow the guidelines closely to ensure your progress! 🚨</p>
			<p>Thank you for choosing our services.</p>
		</div>
	</div>
</body>
</html>`;

		await sendEmailSingleRecipient(
			user.email,
			`🎉 Congratulations! 🎉 for ${previousChallengeStage} passed`,
			"",
			passedHTMLTemplate
		);

		user.mt5Accounts.push(newMt5Account);
		await user.save();

		// Log success for new challenge stage.
		console.log(
			`New MT5 account ${newMt5Account.account} added for ${newChallengeStage} successfully!`
		);
	} catch (error) {
		// Log any errors during the account assignment process.
		console.error("Failed to assign new MT5 account:", error.message);
	}
};

setInterval(passingChallenge, 3600000); // 1 hour er= 60 * 60 * 1000 milliseconds

module.exports = {
	getPhasedUsers,
	passingChallenge,
	passingChallengeUsingAPI,
	handleNextChallengeStage,
};
