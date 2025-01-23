const MUser = require("../../modules/users/users.schema");
const { accountUpdate } = require("../../thirdPartyMt5Api/thirdPartyMt5Api");

const makeTrialAccountInactiveAndDelete = async () => {
	try {
		// Calculate the date 14 days ago (ignoring the time)
		const today = new Date();
		const fourteenDaysAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 14);
		const thirtyDaysAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30); // Date 30 days ago

		console.log("Date 14 days ago (ignoring time):", fourteenDaysAgo);
		console.log("Date 30 days ago (ignoring time):", thirtyDaysAgo);

		// Fetch all trial accounts created 14 days ago
		const usersWithTrialAccounts = await MUser.find({
			"mt5Accounts.isTrialAccount": true,
			"mt5Accounts.createdAt": { $lte: fourteenDaysAgo },
		});

		if (!usersWithTrialAccounts || usersWithTrialAccounts.length === 0) {
			console.log("No users with trial accounts found.");
			return; // Stop execution if no trial accounts are found
		}

		// Loop through the users and update the trial account status to inactive
		for (const user of usersWithTrialAccounts) {
			for (const account of user.mt5Accounts) {
				if (account.isTrialAccount && new Date(account.createdAt) <= fourteenDaysAgo) {
					const changeGroupDetails = {
						Group: "real\\Bin-B",
					};

					const changeGroup = await accountUpdate(account.account, changeGroupDetails);

					if (changeGroup === "OK") {
						account.group = changeGroupDetails.Group;

						// Disable trading rights for the MT5 account
						const userDisableDetails = {
							Rights: "USER_RIGHT_TRADE_DISABLED",
							enabled: true,
						};

						const disableMT5Account = await accountUpdate(account.account, userDisableDetails);

						if (disableMT5Account === "OK") {
							account.accountStatus = "inActive";
							await user.save();
						} else {
							console.error(`Failed to disable trading for account: ${account.account}`);
						}
					} else {
						console.error(`Failed to change group for account: ${account.account}`);
					}

					// Delete the entire mt5Accounts object if it's older than 30 days
					if (new Date(account.createdAt) <= thirtyDaysAgo) {
						await MUser.updateOne(
							{ _id: user._id },
							{
								$pull: { mt5Accounts: { account: account.account } },
								$set: { hadTrial: true },
							}
						);
						console.log(
							`Deleted account object for account: ${account.account} and set hadTrial to true for user: ${user._id}`
						);
					}
				}
			}
		}

		console.log(
			"Trial accounts older than 14 days have been made inactive and accounts older than 30 days have been deleted."
		);
	} catch (error) {
		console.error("Error updating trial accounts:", error);
	}
};

module.exports = { makeTrialAccountInactiveAndDelete };
