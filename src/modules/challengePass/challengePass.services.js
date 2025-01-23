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
						Group: "real\\Bin-P",
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
						Group: "real\\Bin-P",
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

		//! Check if the user have passed the trial account
		if (
			challengeStage === "phase1" &&
			account.challengeStatus === "passed" &&
			account.accountStatus === "inActive" &&
			challengeStageData.challengeType === "Trial"
		) {
			const passedHTMLTemplate = `<!DOCTYPE html>
		<html>
		<head>
			<style>
				body {
					font-family: Arial, sans-serif;
					background-color: #f4f4f4;
					margin: 0;
					padding: 20px;
content: center;
				}
				.email-container {
					background-color: #ffffff;
					padding: 20px;
					border-radius: 5px;
					box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
					max-width: 600px;
					margin: auto;
				}
				.header {
					background-color: #007bff;
					color: #ffffff;
					padding: 10px;
					border-radius: 5px 5px 0 0;
					text-align: center;
				}
				.content {
					padding: 20px;
					color: #333333;
				}
.message-warning {
text-align: center;
background-color: #fff3cd;
border: 1px solid #ffeeba;
padding: 10px 15px;
border-radius: 5px;
font-family: Arial, sans-serif;
color: #856404;
font-size: 14px;
line-height: 1.5;
max-width: 450px;
margin: 10px 0;
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}


				.highlight {
					background-color: #e0f7fa;
					color: #007bff;
					border: 1px solid #007bff;
					margin: 0px 4px;
					padding: 8px 40px;
					border-radius: 3px;
					display: inline-block;
					font-weight: bold;
				}



				.footer {
					text-align: center;
					font-size: 12px;
					color: #aaaaaa;
					margin-top: 20px;
				}
			</style>
		</head>
		<body>
			<div class="email-container">
				<div class="header">
					<h2>🎉 Congratulations! 🎉</h2>
				</div>
				<div class="content">
					<p>Dear User,</p>
					<p>You have passed the  <strong>${account?.challengeStageData?.challengeName}</strong>.<br> Keep up the great work! 🌟</p>

<p>Download the MT5 for Android <a href="https://download.mql5.com/cdn/mobile/mt5/android?server=HavenCapitalGroup-Server">MT5 Platform Application for Android</a></p>
<p>Download the MT5 for iOS <a href="https://download.mql5.com/cdn/mobile/mt5/ios?server=HavenCapitalGroup-Server"> MT5 Platform Application for iOS</a></p>
<p>Download the MT5 for Desktop <a href="https://download.mql5.com/cdn/web/haven.capital.group/mt5/havencapitalgroup5setup.exe">MT5 Platform Application for Desktop</a></p>
				</div>
				<div class="footer">
<p>⚠ <strong>Warning:</strong><br>
Please ensure that you are familiar with all the 
<a href="https://summitstrike.com/faq" target="_blank" rel="noopener noreferrer">rules and regulations</a> of <strong>Summit Strike Capital</strong>. Failure to comply may result in breach or disqualification. Stay informed and follow the guidelines closely to ensure your progress! 🚨</p>
<p>Thank you for choosing our services.</p>
				</div>
			</div>
		</body>
		</html>`;

			await sendEmailSingleRecipient(
				user.email,
				`🎉 Congratulations! 🎉 for passing the challenge`,
				"",
				passedHTMLTemplate
			);
		}

		const purchasedProduct = user.purchasedProducts.get(productId);

		// Check if the user is moving from phase1 to phase2
		if (
			challengeStage === "phase1" &&
			account.challengeStatus === "passed" &&
			account.accountStatus === "inActive" &&
			challengeStageData.challengeType === "twoStep"
		) {
			// Check if there is an existing MT5 account for phase2
			const phase2Account = await findMT5Account(user, productId, "phase2");

			// Assign a new MT5 account if phase2 account doesn't exist
			if (!phase2Account) {
				await assignNewMT5Account(account, user, acc, purchasedProduct, "phase1", "phase2");
			} else {
				// Log or handle if the account already exists and continue the loop.
				console.log(`Phase 2 account already exists for user`);
			}
		}
		// Check if the user is moving from phase2 to funded stage
		else if (
			challengeStage === "phase2" &&
			account.challengeStatus === "passed" &&
			account.accountStatus === "inActive" &&
			challengeStageData.challengeType === "twoStep"
		) {
			// Check if there is an existing MT5 account for funded stage
			const fundedAccount = await findMT5Account(user, productId, "funded");

			// Assign a new MT5 account if funded account doesn't exist
			if (!fundedAccount) {
				await assignNewMT5Account(account, user, acc, purchasedProduct, "phase2", "funded");
			} else {
				// Log or handle if the account already exists and continue the loop.
				console.log(`Funded account already exists for user`);
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

		const isMiniChallenge =
			account.challengeStageData &&
			account.challengeStageData.challengeName.includes("Mini Challenge");
		if (typeof group === "string") {
			const isSwap = group.includes("swap");

			if (isMiniChallenge && newChallengeStage === "phase2") {
				group = isSwap ? "demo\\ecn-demo-swap-1-R1" : "demo\\ecn-demo-1-R1";
			} else if (isMiniChallenge && newChallengeStage === "funded") {
				group = isSwap ? "demo\\ecn-demo-swap-1-R3" : "ecn-real-3-R3";
			} else if (
				newChallengeStage === "phase2" &&
				account.challengeStageData.accountSize >= 50000
			) {
				group = isSwap ? "demo\\ecn-demo-swap-1-R3" : "demo\\ecn-demo-1-R3"; //! group to be updated
			} else if (newChallengeStage === "phase2" && account.challengeStageData.accountSize < 50000) {
				group = isSwap ? "demo\\ecn-demo-swap-2" : "demo\\ecn-demo-2";
			} else if (
				newChallengeStage === "funded" &&
				account.challengeStageData.accountSize >= 100000
			) {
				group = isSwap ? "ecn-real-swap-3-R3" : "ecn-real-3-R3"; //! group to be updated
			} else if (
				newChallengeStage === "funded" &&
				account.challengeStageData.accountSize == 50000
			) {
				group = isSwap ? "ecn-real-swap-3-R3" : "ecn-real-3-R3"; //! group to be updated
			} else if (newChallengeStage === "funded" && account.challengeStageData.accountSize < 50000) {
				group = isSwap ? "ecn-real-swap-3" : "ecn-real-3";
			}
		}

		// Prepare data for creating a new MT5 account.
		const mt5SignUpData = {
			EMail: user.email,
			master_pass: generatePassword(),
			investor_pass: generatePassword(),
			amount: account.challengeStageData.accountSize,
			FirstName: `summitstrike - ${
				account?.challengeStageData?.challengeName
			} (${newChallengeStage}) ${user.first ? user.first : ""}`,
			LastName: user.last,
			Country: user.country,
			Address: user.addr,
			City: user.city,
			ZIPCode: user.zipCode,
			Phone: user.phone,
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
									maxDailyDrawdown: isMiniChallenge ? 4 : 5,
									maxDrawdown: isMiniChallenge ? 8 : 12,
									tradingPeriod: "unlimited",
									profitTarget: isMiniChallenge ? 4 : 5,
									minTradingDays: isMiniChallenge ? 3 : 5,
									newsTrading: true,
									weekendHolding: true,
									drawdownType: isMiniChallenge ? "Balance" : "Equity/balance",
									consistencyRule: true,
									leverage: 30,
									stage: "phase2",
							  }
							: null,
					funded:
						newChallengeStage === "funded"
							? {
									maxDailyDrawdown: isMiniChallenge ? 4 : 5,
									maxDrawdown: isMiniChallenge ? 8 : 12,
									tradingPeriod: "unlimited",
									profitTarget: null,
									minTradingDays: isMiniChallenge ? 3 : 5,
									newsTrading: true,
									weekendHolding: true,
									drawdownType: isMiniChallenge ? "Balance" : "Equity/balance",
									consistencyRule: true,
									leverage: 30,
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
				body {
					font-family: Arial, sans-serif;
					background-color: #f4f4f4;
					margin: 0;
					padding: 20px;
content: center;
				}
				.email-container {
					background-color: #ffffff;
					padding: 20px;
					border-radius: 5px;
					box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
					max-width: 600px;
					margin: auto;
				}
				.header {
					background-color: #007bff;
					color: #ffffff;
					padding: 10px;
					border-radius: 5px 5px 0 0;
					text-align: center;
				}
				.content {
					padding: 20px;
					color: #333333;
				}
.message-warning {
text-align: center;
background-color: #fff3cd;
border: 1px solid #ffeeba;
padding: 10px 15px;
border-radius: 5px;
font-family: Arial, sans-serif;
color: #856404;
font-size: 14px;
line-height: 1.5;
max-width: 450px;
margin: 10px 0;
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}


				.highlight {
					background-color: #e0f7fa;
					color: #007bff;
					border: 1px solid #007bff;
					margin: 0px 4px;
					padding: 8px 40px;
					border-radius: 3px;
					display: inline-block;
					font-weight: bold;
				}



				.footer {
					text-align: center;
					font-size: 12px;
					color: #aaaaaa;
					margin-top: 20px;
				}
			</style>
		</head>
		<body>
			<div class="email-container">
				<div class="header">
					<h2>🎉 Congratulations! 🎉</h2>
				</div>
				<div class="content">
					<p>Dear User,</p>
					<p>You have passed the <strong>${previousChallengeStage}</strong> of <strong>${account?.challengeStageData?.challengeName}</strong>.<br>
And you are now in the <strong>${newChallengeStage}</strong> of <strong>${account?.challengeStageData?.challengeName}</strong>.<br> Keep up the great work! 🌟</p>

					<p><strong>Account:</strong> <span class="highlight">${newMt5Account?.account}</span></p>
					<p><strong>Password:</strong> <span class="highlight">${newMt5Account?.masterPassword}</span></p>
					<p><strong>Platform:</strong> <span class="highlight">MT5</span></p>
					<p><strong>Server:</strong> <span class="highlight">Haven Capital Group Ltd </span></p>
					<p class="message-warning">Please keep this information secure and do not share it with anyone.</p>

<p>Download the MT5 for Android <a href="https://download.mql5.com/cdn/mobile/mt5/android?server=HavenCapitalGroup-Server">MT5 Platform Application for Android</a></p>
<p>Download the MT5 for iOS <a href="https://download.mql5.com/cdn/mobile/mt5/ios?server=HavenCapitalGroup-Server"> MT5 Platform Application for iOS</a></p>
<p>Download the MT5 for Desktop <a href="https://download.mql5.com/cdn/web/haven.capital.group/mt5/havencapitalgroup5setup.exe">MT5 Platform Application for Desktop</a></p>
				</div>
				<div class="footer">
<p>⚠ <strong>Warning:</strong><br>
Please ensure that you are familiar with all the 
<a href="https://summitstrike.com/faq" target="_blank" rel="noopener noreferrer">rules and regulations</a> of <strong>Summit Strike Capital</strong>. Failure to comply may result in breach or disqualification. Stay informed and follow the guidelines closely to ensure your progress! 🚨</p>
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
};
