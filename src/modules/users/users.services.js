const crypto = require("crypto");
const MOtp = require("../../helper/otpSchema.js");
const { sendMailForOTP, sendEmailSingleRecipient } = require("../../helper/mailing.js");
const { generateToken } = require("../../helper/utils/tokenUtils.js");

const MUser = require("./users.schema.js"); // Assuming the MUser model is in this path
const {
	accountCreateAndDeposit,
	userDetails,
	accountDetails,
	orderHistories,
	changePasswordInMt5,
	accountUpdate,
} = require("../../thirdPartyMt5Api/thirdPartyMt5Api.js");
const { getUniqueTradingDays } = require("../../helper/utils/dateUtils.js");
const { console } = require("node:inspector");
const { handleNextChallengeStage } = require("../challengePass/challengePass.services.js");
const {
	createTradingAccountAndDeposit,
	updateTradingAccount,
	getSingleTradingAccount,
	getClosedPositions,
} = require("../../thirdPartyMatchTraderApi/thirdPartyMatchTraderApi.js");
const { StoreData, StoreDataMatchTrader } = require("../breach/breach.schema.js");

// Function to handle MT5 account creation
const handleMt5AccountCreate = async (userDetails) => {
	// Attempt to create an MT5 account with the provided details
	try {
		const createMt5Account = await accountCreateAndDeposit(userDetails);
		const amount = userDetails.amount;

		const result = await StoreData.findOneAndUpdate(
			{}, // Empty filter to match all documents
			{
				// Push a new entry into the `dailyData` array
				$push: {
					dailyData: {
						mt5Account: createMt5Account?.login,
						asset: amount,
						dailyStartingBalance: amount,
						dailyStartingEquity: amount,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				},
			},
			{
				sort: { _id: -1 }, // Sort by `_id` in descending order to get the last document
				new: true, // Return the updated document
				upsert: true, // Create a new document if none exists
				setDefaultsOnInsert: true, // Set default values if inserting a new document
			}
		);
		console.log(result);
		return createMt5Account;
	} catch (error) {
		console.log(error);
	}
};

const handleMatchTraderAccountCreate = async (userDetails) => {
	// Attempt to create an match trader account with the provided details
	try {
		const createMatchTraderAccount = await createTradingAccountAndDeposit(userDetails);

		const amount = Number(userDetails?.depositAmount);

		if (!createMatchTraderAccount?.accountDetails?.normalAccount?.uuid) {
			throw new Error("Failed to create Match trader account");
		}

		// Find the last created document and update it by pushing a new entry into the dailyData array
		await StoreDataMatchTrader.findOneAndUpdate(
			{}, // Empty filter to select all documents
			{
				$push: {
					dailyData: {
						matchTraderAccount: Number(
							createMatchTraderAccount?.accountDetails?.tradingAccount?.login
						),
						asset: amount,
						dailyStartingBalance: amount,
						dailyStartingEquity: amount,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				},
			},
			{
				sort: { _id: -1 }, // Sort by _id in descending order to get the last document
				new: true, // Return the updated document
				upsert: true, // Create a new document if none exists
			}
		);

		return createMatchTraderAccount;
	} catch (error) {
		console.log(error);
		throw new Error(error.message || "Error creating Match Trader account");
	}
};

// Function to update MT5 account status (enabled/disabled) // (USER_RIGHT_DEFAULT / USER_RIGHT_TRADE_DISABLED)
const updateMt5AccountStatus = async (id, userDetails) => {
	try {
		const { status, ...restDetails } = userDetails;
		const result = await accountUpdate(id, restDetails);

		const user = await MUser.findOne({
			"mt5Accounts.account": id,
		});

		// Update the account status for the specific MT5 account
		const updatedUser = await MUser.findOneAndUpdate(
			{ "mt5Accounts.account": id },
			{ "mt5Accounts.$.accountStatus": status },
			{ new: true }
		);

		if (!updatedUser) {
			throw new Error("Failed to update account status.");
		}

		return result; // response ==> "OK"
	} catch (error) {
		console.log(error);
	}
};

// Function to update match trader account status
const updateMatchTraderAccountStatus = async (account, userDetails) => {
	try {
		const { status } = userDetails;

		const accStatus = status || "active";
		const access = userDetails.access;

		await updateTradingAccount(Number(account), {
			access,
		});

		// Update the account status for the specific match trader account
		const updatedUser = await MUser.findOneAndUpdate(
			{ "matchTraderAccounts.account": Number(account) },
			{ "matchTraderAccounts.$.accountStatus": accStatus },
			{ new: true }
		);

		if (!updatedUser) return null;

		return updatedUser;
	} catch (error) {
		console.log(error);
	}
};

// Function to find a user and get their MT5  & Match Trader account details
const findUserWithAllAccountDetails = async (id) => {
	try {
		const startDate = "1990-12-07 12:33:12";
		const endDate = "2100-12-07 12:33:12";

		const user = await MUser.findById(id);
		if (!user) {
			throw new Error("User not found.");
		}

		const results = [];

		// ─── Process MT5 Accounts ──────────────────────────────────────────────
		if (user.mt5Accounts && user.mt5Accounts.length > 0) {
			const mt5Promises = user.mt5Accounts.map(async (account) => {
				const accountNumber = account.account;

				try {
					const [userDetailsResult, accountDetailsResult, orderHistoriesResult] = await Promise.all(
						[
							userDetails(accountNumber).catch(() => null),
							accountDetails(accountNumber).catch(() => null),
							orderHistories(accountNumber, startDate, endDate).catch(() => null),
						]
					);

					const tradingDays =
						orderHistoriesResult && orderHistoriesResult.length > 0
							? getUniqueTradingDays(orderHistoriesResult)
							: "N/A";

					return {
						account: accountNumber,
						accountType: "Platform-5",
						mt5UserDetails: userDetailsResult,
						mt5AccountDetails: accountDetailsResult,
						mt5OrderHistories: orderHistoriesResult,
						tradingDays,
					};
				} catch (err) {
					return null;
				}
			});

			const mt5Info = await Promise.all(mt5Promises);
			results.push(...mt5Info.filter((info) => info !== null));
		}

		// ─── Process MatchTrader Accounts ──────────────────────────────────────
		if (user.matchTraderAccounts && user.matchTraderAccounts.length > 0) {
			const matchPromises = user.matchTraderAccounts.map(async (account) => {
				const accountNumber = account.account;

				try {
					const [accountDetails, orderHistories] = await Promise.all([
						getSingleTradingAccount(accountNumber).catch(() => null),
						getClosedPositions(accountNumber).catch(() => null),
					]);

					if (!accountDetails || !orderHistories) return null;

					const tradingDays = getUniqueTradingDays(orderHistories);

					return {
						account: accountNumber,
						accountType: "Match-trader",
						matchTraderAccountDetails: accountDetails,
						matchTraderOrderHistories: orderHistories,
						tradingDays,
					};
				} catch (err) {
					return null;
				}
			});

			const matchInfo = await Promise.all(matchPromises);
			results.push(...matchInfo.filter((info) => info !== null));
		}

		return {
			user,
			userInfo: results,
		};
	} catch (error) {
		console.error("Error in findUserWithAllAccountDetails:", error);
		throw error;
	}
};

// Function to find single user by _id, only user details in mongodb, not MT5 Details
const getOnlyUser = async (id) => {
	try {
		const user = await MUser.findById(id);
		if (!user) {
			throw new Error("User not found.");
		}
		return user;
	} catch (error) {
		console.log(error);
		throw error;
	}
};

const generateAllUsersCSV = async () => {
	try {
		// Select only necessary fields: email, first, last, mt5Accounts
		const users = await MUser.find({}, "email first last mt5Accounts createdAt").lean();

		if (!users.length) throw new Error("No users found");

		// Use map to process users in parallel, and extract required fields
		const userData = users.map((user) => {
			// Get all challenge names from the mt5Accounts
			const challengeNames = user.mt5Accounts
				? user.mt5Accounts.map((acc) => acc.challengeStageData?.challengeName || "N/A").join(" || ")
				: "N/A";

			// Format the createdAt date
			const formattedCreatedAt = new Date(user.createdAt).toLocaleDateString("en-US");

			return {
				email: user.email,
				firstName: user.first.trim(),
				lastName: user.last.trim(),
				createdAt: formattedCreatedAt, // Use the formatted date
				challengeNames,
			};
		});

		return userData;
	} catch (error) {
		console.error(error);
		throw error;
	}
};

const generateAllAccountsCSV = async (filters = {}) => {
	try {
		// Destructure filters for easier access
		const { challengeStage, startDate, endDate } = filters;

		// Fetch all users from the database
		const users = await MUser.find({}).lean();

		const filteredData = users.flatMap((user) => {
			const filteredAccounts = user.mt5Accounts.filter((account) => {
				const stageMatch = !challengeStage || account.challengeStage === challengeStage;

				const createdAt = new Date(account.createdAt);
				const dateMatch =
					(!startDate || createdAt >= new Date(startDate)) &&
					(!endDate || createdAt <= new Date(endDate));

				return stageMatch && dateMatch;
			});

			if (filteredAccounts.length === 0) return [];

			return {
				email: user.email,
				first: user.first.trim(),
				last: user.last.trim(),
				country: user.country,
				phone: user.phone,
				role: user.role,
				affiliate: user.affiliate,
				mt5Accounts: filteredAccounts,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
			};
		});

		// Return the filtered data
		return filteredData;
	} catch (error) {
		throw new Error(`Error generating CSV data: ${error.message}`);
	}
};

// get all user
const getAllUsers = async (page = 1, limit = 10, searchQuery = "", isVerified = null) => {
	try {
		const skip = (page - 1) * limit;
		const isVerifiedFilter = isVerified === "true" ? true : isVerified === "false" ? false : null;

		const regex = new RegExp(searchQuery, "i");

		// Initial match
		const preMatch = searchQuery
			? {
					$or: [{ email: regex }, { first: regex }, { last: regex }, { userId: regex }],
			  }
			: {};

		const pipeline = [
			{ $match: preMatch },

			// Lookup veriff sessions by email
			{
				$lookup: {
					from: "veriffs",
					localField: "email",
					foreignField: "person.email",
					as: "veriffSessions",
				},
			},

			// Lookup veriff decision statuses for all sessions
			{
				$lookup: {
					from: "veriffdecisionstatuses",
					let: { sessionIds: "$veriffSessions.person.sessionId" },
					pipeline: [
						{
							$match: {
								$expr: {
									$in: ["$verification.id", "$$sessionIds"],
								},
							},
						},
					],
					as: "decisionData",
				},
			},

			// Determine if the user is verified
			{
				$addFields: {
					isVerified: {
						$gt: [
							{
								$size: {
									$filter: {
										input: "$decisionData",
										as: "decision",
										cond: {
											$and: [
												{ $eq: ["$$decision.status", "success"] },
												{ $eq: ["$$decision.verification.status", "approved"] },
											],
										},
									},
								},
							},
							0,
						],
					},
				},
			},

			// Apply second level search if needed
			...(searchQuery
				? [
						{
							$match: {
								$or: [{ email: regex }, { first: regex }, { last: regex }, { userId: regex }],
							},
						},
				  ]
				: []),

			// Apply isVerified filter if provided
			...(isVerifiedFilter !== null ? [{ $match: { isVerified: isVerifiedFilter } }] : []),

			// Pagination
			{
				$facet: {
					users: [{ $sort: { _id: -1 } }, { $skip: skip }, { $limit: Number(limit) }],
					totalCount: [{ $count: "count" }],
				},
			},
		];

		const result = await MUser.aggregate(pipeline);

		const users = result[0]?.users || [];
		const totalUsers = result[0]?.totalCount[0]?.count || 0;
		const totalPages = Math.ceil(totalUsers / limit);

		return {
			users,
			totalPages,
			currentPage: Number(page),
			totalUsers,
		};
	} catch (error) {
		console.error("Error in getAllUsers:", error.message);
		throw new Error("Error fetching users: " + error.message);
	}
};

// get all user's mt5 accounts
const getAllAccounts = async (
	page,
	limit,
	searchQuery,
	challengeStage,
	isPending,
	accountStatus,
	accountType // Optional: 'mt5Accounts' | 'matchTraderAccounts' | undefined
) => {
	try {
		const skip = (page - 1) * limit;

		const validAccountTypes = ["mt5Accounts", "matchTraderAccounts"];

		// Default to show both account types
		const isAll = !accountType;

		if (!isAll && !validAccountTypes.includes(accountType)) {
			throw new Error("Invalid account type provided.");
		}

		const pipelines = [];

		// Helper function to build a pipeline for one account type
		const buildPipeline = (type) => {
			let matchQuery = {};

			// Search by email or account number
			if (searchQuery) {
				const isNumeric = /^\d+$/.test(searchQuery); // only true if it's *only* digits
				if (isNumeric) {
					matchQuery[`${type}.account`] = parseInt(searchQuery);
				} else {
					matchQuery["email"] = { $regex: searchQuery, $options: "i" };
				}
			}

			if (challengeStage) {
				matchQuery[`${type}.challengeStage`] = challengeStage;
			}
			if (isPending !== "") {
				matchQuery[`${type}.isPending`] = isPending === "true";
			}
			if (accountStatus) {
				matchQuery[`${type}.accountStatus`] = accountStatus;
			}

			const pipeline = [
				{ $unwind: `$${type}` },
				{ $match: matchQuery },
				{ $sort: { _id: -1 } },
				{
					$project: {
						email: 1,
						firstName: "$first",
						lastName: "$last",
						platform: { $literal: type },
						account: `$${type}.account`,
						accountStatus: `$${type}.accountStatus`,
						noStopLoss: `$${type}.noStopLoss`,
						noConsistency: `$${type}.noConsistency`,
						noNewsTrading: `$${type}.noNewsTrading`,
						productId: `$${type}.productId`,
						challengeStatus: `$${type}.challengeStatus`,
						createdAt: `$${type}.createdAt`,
						challengeStage: `$${type}.challengeStage`,
						challengeStageData: `$${type}.challengeStageData`,
						isPending: `$${type}.isPending`,
						challengePassDate: `$${type}.challengePassDate`,
					},
				},
			];

			return { pipeline, matchQuery };
		};

		let total = 0;
		let results = [];

		if (isAll) {
			// For both mt5Accounts and matchTraderAccounts
			for (const type of validAccountTypes) {
				const { pipeline, matchQuery } = buildPipeline(type);

				const countPipeline = [
					{ $unwind: `$${type}` },
					{ $match: matchQuery },
					{ $count: "total" },
				];

				const [countRes, dataRes] = await Promise.all([
					MUser.aggregate(countPipeline),
					MUser.aggregate([...pipeline, { $skip: skip }, { $limit: parseInt(limit) }]),
				]);

				total += countRes.length ? countRes[0].total : 0;
				results.push(...dataRes);
			}
		} else {
			const { pipeline, matchQuery } = buildPipeline(accountType);

			const countPipeline = [
				{ $unwind: `$${accountType}` },
				{ $match: matchQuery },
				{ $count: "total" },
			];

			const [countRes, dataRes] = await Promise.all([
				MUser.aggregate(countPipeline),
				MUser.aggregate([...pipeline, { $skip: skip }, { $limit: parseInt(limit) }]),
			]);

			total = countRes.length ? countRes[0].total : 0;
			results = dataRes;
		}

		return {
			total,
			page: parseInt(page),
			limit: parseInt(limit),
			usersWithAccounts: results,
		};
	} catch (error) {
		throw new Error("Error fetching accounts: " + error.message);
	}
};

// // get users based on phase

const getPhasedUsers = async (account) => {
	try {
		// Find the user where any MT5Accounts' Account field matches the provided account number
		const user = await MUser.findOne({ "mt5Accounts.account": account });

		if (!user) {
			console.log("No user found with the given account number.");
		}
		// Filter the Mt5Accounts array to find the matching account
		const mt5Account = user.mt5Accounts.find((acc) => acc.account === Number(account));

		const order = await MOrder.findOne({
			orderId: mt5Account.productId,
		});

		const accountWithOrders = {
			mt5Account,
			order,
		};

		return { user, accountWithOrders };
	} catch (error) {
		console.error("Error fetching user data:", error);
		throw error;
	}
};

// Function to update user role by email
const updateUserRole = async (email, newRole) => {
	try {
		const updateData = { role: newRole };
		const updatedUser = await MUser.findOneAndUpdate(
			{ email },
			{ $set: updateData },
			{
				projection: {
					role: 1,
					email: 1,
					first: 1,
					last: 1,
				},
				returnOriginal: false,
			}
		);

		if (!updatedUser) {
			throw new Error("User not found");
		}
		return updatedUser;
	} catch (error) {
		throw error;
	}
};

// Function to update user  id
const updateUser = async (id, userData) => {
	try {
		const updateFields = {};
		const pushFields = {};

		// Fetch the existing user to check for duplicates
		const user = await MUser.findById(id);
		if (!user) {
			throw new Error("User not found");
		}

		// ─── Push New Orders ───────────────────────────────
		if (userData.orders) {
			pushFields.orders = { $each: userData.orders };
		}

		// ─── Push New MT5 Accounts ─────────────────────────
		if (userData.mt5Accounts) {
			const newMt5Accounts = userData.mt5Accounts.filter(
				(newAcc) => !user.mt5Accounts.some((existingAcc) => existingAcc.account === newAcc.account)
			);

			if (newMt5Accounts.length > 0) {
				pushFields.mt5Accounts = { $each: newMt5Accounts };
			}
		}

		// ─── Push New MatchTrader Accounts ────────────────
		if (userData.matchTraderAccounts) {
			const newMatchAccounts = userData.matchTraderAccounts.filter(
				(newAcc) =>
					!user.matchTraderAccounts.some((existingAcc) => existingAcc.account === newAcc.account)
			);

			if (newMatchAccounts.length > 0) {
				pushFields.matchTraderAccounts = { $each: newMatchAccounts };
			}
		}

		// Attach $push if there are pushable fields
		if (Object.keys(pushFields).length > 0) {
			updateFields.$push = pushFields;
		}

		// ─── Direct Field Updates (exclude arrays and email) ──
		for (const key in userData) {
			if (
				key !== "orders" &&
				key !== "mt5Accounts" &&
				key !== "matchTraderAccounts" &&
				key !== "email"
			) {
				updateFields[key] = userData[key];
			}
		}

		// ─── Final Update ──────────────────────────────────
		const updatedUser = await MUser.findByIdAndUpdate(id, updateFields, {
			new: true,
		});
		if (!updatedUser) {
			throw new Error("Failed to update user");
		}

		return updatedUser;
	} catch (error) {
		throw error;
	}
};

// Function to generate a 6-digit OTP
const generateOtp = () => {
	return crypto.randomInt(100000, 999999).toString();
};

//  [✅][✅][✅] Todo:: send an email to the user for forget password  💬💬💬💬💬💬💬💬

const sendOtp = async (email) => {
	console.log(email, "users.services line 418");
	try {
		const otp = generateOtp();
		console.log(otp, "users.services line 421");
		const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes from now

		const record = new MOtp({ email, otp, expiresAt });
		await record.save();
		const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP Email</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f0f8ff;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .container {
            max-width: 600px;
            width: 100%;
            background-color: rgba(255, 255, 255, 0.7);
            padding: 20px;
            border-radius: 16px;
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            margin: 20px;
        }
        .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 1px solid #dddddd;
        }
        .header h1 {
            font-size: 24px;
            color: #333333;
        }
        .content {
            padding: 20px;
            text-align: center;
        }
        .content p {
            font-size: 18px;
            color: #555555;
        }
        .otp-box {
            display: inline-block;
            padding: 15px 30px;
            border-radius: 8px;
            background: linear-gradient(145deg, #e0f7fa, #ffffff);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin: 20px 0;
        }
        .otp {
            font-size: 24px;
            color: #333333;
            font-weight: bold;
            letter-spacing: 2px;
        }
        .footer {
            text-align: center;
            padding: 10px 0;
            border-top: 1px solid #dddddd;
            margin-top: 20px;
            color: #999999;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset OTP</h1>
        </div>
        <div class="content">
            <p>Your OTP for password reset is:</p>
            <div class="otp-box">
                <span class="otp">${otp}</span>
            </div>
            <p>This OTP is valid for 10 minutes. Please use it promptly.</p>
        </div>
        <div class="footer">
            <p>If you did not request this, please ignore this email.</p>
        </div>
    </div>
</body>
</html>`;

		await sendMailForOTP(email, "Password Reset OTP", `Your OTP is: ${otp}`, htmlTemplate);
		return otp;
	} catch (error) {
		console.error("Error in sendOtp:", error);
		throw new Error("Failed to generate or send OTP.");
	}
};

// Function to verify OTP for password reset
const verifyOtp = async (Email, otp) => {
	const record = await MOtp.findOne({ email: Email, otp });
	if (record && record.expiresAt > new Date()) {
		await MOtp.deleteOne({ _id: record._id });
		return true;
	}
	return false;
};

const resetPassword = async (email, newPassword) => {
	try {
		// Attempt to find and update the user
		const updatedUser = await MUser.findOneAndUpdate(
			{ email: email }, // Find the user by email
			{ password: newPassword }, // Update the password
			{ new: true } // Return the updated user document
		);

		if (!updatedUser) {
			// User not found
			return {
				status: 404, // Not found status code
				message: `User with email "${email}" not found.`,
				email: email,
				password: null,
			};
		}

		// Successfully updated the password
		return {
			status: 200, // Success status code
			message: "Password reset successfully.",
			email: updatedUser.email,
			password: "****", // Mask the password for security reasons
		};
	} catch (error) {
		console.error("Error resetting password:", error.message);

		// Handle specific error types (optional)
		if (error.name === "ValidationError") {
			return {
				status: 400, // Bad request
				message: "Invalid data provided.",
				email: email,
				password: null,
			};
		}

		// Generic error response
		return {
			status: 500, // Internal server error status code
			message: "An error occurred while resetting the password.",
			email: email,
			password: null,
		};
	}
};

const findUserWithEmail = async (email) => {
	try {
		const user = await MUser.findOne({ email: email });
		return user;
	} catch (error) {
		throw error;
	}
};
const normalRegister = async (data) => {
	try {
		// Normalize email to lowercase
		const email = data.email?.toLowerCase();
		const { ip } = data;

		if (email) {
			// Find user using the normalized lowercase email
			let user = await MUser.findOne({ email });

			if (user) {
				user = user.toObject();

				// Update IP if user exists
				await MUser.updateOne({ email }, { $set: { ip } });
				return user;
			}

			// Create new user with normalized email
			const newUser = new MUser({ ...data, email });
			const savedUser = await newUser.save();

			return savedUser;
		}
	} catch (error) {
		throw new Error(error.message);
	}
};

const normalLogin = async (data) => {
	try {
		const email = data.email?.toLowerCase();

		// Find user with case-insensitive email match
		const user = await MUser.findOne({
			email: { $regex: new RegExp(`^${email}$`, "i") },
		}).select("+password");

		if (!user) {
			throw new Error("Invalid email or password.");
		}

		if (user.password !== data.password) {
			throw new Error("Invalid password.");
		}

		// Update login IP (using same case-insensitive match)
		await MUser.updateOne(
			{ email: { $regex: new RegExp(`^${email}$`, "i") } },
			{ $set: { ip: data.ip } }
		);

		// Remove the password before returning
		const { password, ...userWithoutPassword } = user.toObject();

		const token = generateToken(user._id, user.role);
		return { token, role: user.role, user: userWithoutPassword };
	} catch (error) {
		throw new Error(error.message);
	}
};

/**
 * Updates the purchased products for a user.
 *
 * @param {String} userId - The ID of the user.
 * @param {Object} productData - The product data to update.
 * @returns {Object} - The updated user document.
 * @throws {Error} - Throws error if user is not found or update fails.
 */
const updatePurchasedProducts = async (userId, productData) => {
	try {
		// Validate that both `productId` and `product` fields are present in productData
		if (!productData.productId || !productData.product) {
			throw new Error("Both `productId` and `product` fields are required in the product data.");
		}

		// Fetch the user to check if the product already exists
		const user = await MUser.findById(userId);

		if (!user) {
			throw new Error("User not found");
		}

		// Check if the product already exists in purchasedProducts
		if (
			user.purchasedProducts instanceof Map &&
			user.purchasedProducts.has(productData.productId)
		) {
			// Break the process by throwing an error
			throw new Error(
				`Product with ID ${productData.productId} is already purchased and cannot be updated.`
			);
		} else {
			// Proceed to update only if the product does not exist
			const updatedUser = await MUser.findByIdAndUpdate(
				userId,
				{
					$set: {
						[`purchasedProducts.${productData.productId}`]: {
							productId: productData.productId,
							product: productData.product,
						},
					},
				},
				{ new: true, runValidators: true }
			);
			if (!updatedUser) {
				throw new Error("User not found after attempting to update.");
			}

			return updatedUser;
		}
	} catch (error) {
		// Error caught here breaks the process
		throw new Error(`Failed to update purchased products: ${error.message}`);
	}
};

const createUser = async (userData) => {
	try {
		const htmlContent = `
		<!DOCTYPE html>
		<html>
		<head>
			<style>
				body {
					font-family: Arial, sans-serif;
					background-color: #f4f4f4;
					margin: 0;
					padding: 20px;
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
					<h2>Your MT5 Account Credentials</h2>
				</div>
				<div class="content">
					<p>Dear User,</p>
					<p>Your MT5 account has been successfully created. Here are your credentials:</p>
					<p><strong> Your Mt5 Account:</strong> <span class="highlight">${userData?.account}</span></p>
					<p><strong>Your Mt5 Password:</strong> <span class="highlight">${userData?.masterPassword}</span></p>
					<p><strong>Platform:</strong> <span class="highlight">MT5</span></p>
					<p><strong>Server:</strong> <span class="highlight">Haven Capital Group LTD</span></p>
					<p> Here are your dashboard credentials:</p>
					<p><strong>Your Email:</strong> <span class="highlight">${userData?.email}</span></p>
					<p><strong> Your Dashboard Password:</strong> <span class="highlight">${userData?.password}</span></p>
					<p>Please keep this information secure and do not share it with anyone.</p>
					<p>Download the MT5 for Android <a href=" https://download.mql5.com/cdn/mobile/mt5/android?server=HavenCapitalGroup-Server">h https://download.mql5.com/cdn/mobile/mt5/android?server=HavenCapitalGroup-Server</a></p>
					<p>Download the MT5 for iOS <a href=" https://download.mql5.com/cdn/mobile/mt5/ios?server=HavenCapitalGroup-Server"> https://download.mql5.com/cdn/mobile/mt5/ios?server=HavenCapitalGroup-Server</a></p>
					<p>Download the MT5 for Desktop <a href="https://download.mql5.com/cdn/web/haven.capital.group/mt5/havencapitalgroup5setup.exe">https://download.mql5.com/cdn/web/haven.capital.group/mt5/havencapitalgroup5setup.exe</a></p>
				</div>
				<div class="footer">
					<p>Thank you for choosing our services.</p>
				</div>
			</div>
		</body>
		</html>
		`;

		const info = await sendEmailSingleRecipient(
			userData?.email,
			"Your MT5 Account Credentials From SSC",
			`Your MT5 account: ${userData?.account} and password: ${userData?.password}`,
			htmlContent
		);
		return info;
		// Send email and update order status if conditions are met
	} catch (error) {
		// biome-ignore lint/complexity/noUselessCatch: <explanation>
		throw error;
	}
};

const updatePassword = async (account, newPassword) => {
	try {
		const result = await changePasswordInMt5(account, newPassword);
		return result;
	} catch (error) {
		throw new Error("Service failed to change password: " + error.message);
	}
};

// Service function to find users with 'funded' challenge stage
const findFundedUsers = async () => {
	try {
		const fundedUsers = await MUser.aggregate([
			{
				$match: {
					"mt5Accounts.challengeStage": "funded",
				},
			},
			{
				$project: {
					email: 1,
					mt5Accounts: {
						$filter: {
							input: "$mt5Accounts",
							as: "account",
							cond: { $eq: ["$$account.challengeStage", "funded"] },
						},
					},
				},
			},
		]);
		return fundedUsers;
	} catch (error) {
		throw new Error("Error in finding funded users: " + error.message);
	}
};

const manualChallengePass = async (id) => {
	try {
		// Convert the id to a number
		const accountId = Number(id);

		// Find users with the specified account ID
		const users = await MUser.find(
			{
				"mt5Accounts.account": accountId,
				mt5Accounts: {
					$elemMatch: {
						account: accountId,
						challengeStage: { $ne: "funded" },
						challengeStatus: { $ne: "passed" },
						accountStatus: { $eq: "active" },
					},
				},
			},
			{
				mt5Accounts: 1,
				email: 1,
				_id: 1,
			}
		).exec();

		// Extract the specific account
		const singleAccount = users.flatMap((user) =>
			user.mt5Accounts
				.filter((account) => {
					const match =
						account.account === accountId &&
						account.challengeStage !== "funded" &&
						account.challengeStatus !== "passed" &&
						account.accountStatus === "active";

					return match;
				})
				.map((account) => ({
					...account.toObject(),
					email: user.email,
					userId: user._id,
				}))
		)[0]; // Get the first matched account.

		console.log(singleAccount);

		// Handle case where no account is found
		if (!singleAccount) {
			console.error("No matching accounts found for processing.");
			return {
				success: false,
				status: 404,
				message: "No matching accounts found for processing.",
			};
		}

		const { challengeStage, challengeStageData, userId, account } = singleAccount;

		if (!account) {
			console.log("Account number is missing, skipping this account.");
			return {
				success: false,
				status: 400,
				message: "Account number is missing.",
			};
		}

		if (
			!challengeStageData ||
			!challengeStageData.challengeStages ||
			!challengeStageData.challengeStages[challengeStage]
		) {
			return {
				success: false,
				status: 400,
				message: "Invalid challenge stage data.",
			};
		}

		const user = await MUser.findById(userId);

		if (!user) {
			console.error(`User not found for userId: ${userId}`);
			return {
				success: false,
				status: 404,
				message: `User not found for userId: ${userId}.`,
			};
		}

		const matchingAccount = user.mt5Accounts.find((a) => a.account === account);

		if (matchingAccount) {
			const changeGroupDetails = {
				Group: "demo\\EVPASSED",
			};

			const changeGroup = await accountUpdate(matchingAccount.account, changeGroupDetails);

			if (changeGroup === "OK") {
				matchingAccount.group = changeGroupDetails.Group;

				await user.save();

				// Disable trading rights for the MT5 account.
				const userDisableDetails = {
					// Rights: "USER_RIGHT_TRADE_DISABLED",
					Rights: "USER_RIGHT_TRADE_DISABLED",
					enabled: true,
				};

				// API call to disable MT5 account and verify the response.
				const disableMT5Account = await accountUpdate(matchingAccount.account, userDisableDetails);

				if (disableMT5Account === "OK") {
					matchingAccount.challengeStatus = "passed";
					matchingAccount.accountStatus = "inActive";
					matchingAccount.passedClaimed = true;
					await user.save();

					console.log(user);

					// Check if the user needs to be assigned a new MT5 account based on their challenge progress.
					await handleNextChallengeStage(matchingAccount, user, matchingAccount);
				}
			}
		} else {
			return {
				success: false,
				status: 404,
				message: `Account not found for account number: ${account}.`,
			};
		}

		return {
			success: true,
			status: 200,
			message: `Challenge passed for account ${account}`,
		};
	} catch (error) {
		return {
			success: false,
			status: 500,
			message: "An internal error occurred while processing the manual challenge pass.",
			error: error,
		};
	}
};

const getOnlyUserHandlerBYEmailService = async (email) => {
	try {
		const user = await MUser.findOne({ email: email });
		if (!user) {
			throw new Error("User not found.");
		}
		return user;
	} catch (error) {
		console.log(error);
		throw error;
	}
};

module.exports = {
	handleMt5AccountCreate,
	handleMatchTraderAccountCreate,
	updateMatchTraderAccountStatus,
	findUserWithAllAccountDetails,
	sendOtp,
	verifyOtp,
	resetPassword,
	getOnlyUser,
	getAllUsers,
	updateUserRole,
	normalLogin,
	normalRegister,
	updatePurchasedProducts,
	updateUser,
	getAllAccounts,
	getPhasedUsers,
	findUserWithEmail,
	createUser,
	updatePassword,
	updateMt5AccountStatus,
	findFundedUsers,
	manualChallengePass,
	getOnlyUserHandlerBYEmailService,
	generateAllUsersCSV,
	generateAllAccountsCSV,
};
