const DisableAccount = require("../disableAccounts/disableAccounts.schema");
const { MOrder } = require("../orders/orders.schema");
const MUser = require("../users/users.schema");
const MWithDrawRequest = require("../withDrawRequests/withDrawRequests.schema");

const getMt5MetaData = async () => {
	try {
		const today = new Date();
		today.setHours(0, 0, 0, 0); // Set the time to midnight for today's start

		const yesterday = new Date(today);
		yesterday.setDate(today.getDate() - 1); // Set the date to yesterday

		// Get the total count of users
		const totalUsers = await MUser.countDocuments();

		// Get the count of breached accounts
		const totalBreachedAccounts = await DisableAccount.countDocuments();

		// Get the count of users with mt5Accounts
		const usersWithMt5Accounts = await MUser.countDocuments({
			mt5Accounts: { $exists: true, $not: { $size: 0 } },
		});

		const totalMt5Accounts = await MUser.aggregate([
			{ $unwind: "$mt5Accounts" },
			{
				$group: {
					_id: null,
					totalMt5Accounts: { $sum: 1 },
				},
			},
		]);

		const disabledAccountIds = (await DisableAccount.distinct("mt5Account")).map((id) =>
			Number(id)
		);

		// Aggregation pipeline to calculate the counts directly in MongoDB
		const result = await MUser.aggregate([
			{
				// Filter out mt5Accounts that match disabledAccountIds directly within the mt5Accounts array
				$addFields: {
					mt5Accounts: {
						$filter: {
							input: "$mt5Accounts",
							as: "account",
							cond: { $not: { $in: ["$$account.account", disabledAccountIds] } },
						},
					},
				},
			},

			{ $unwind: "$mt5Accounts" },

			{
				$group: {
					_id: null,
					// totalMt5Accounts: { $sum: 1 },
					activeMt5Accounts: {
						$sum: { $cond: [{ $eq: ["$mt5Accounts.accountStatus", "active"] }, 1, 0] },
					},
					inActiveMt5Accounts: {
						$sum: { $cond: [{ $eq: ["$mt5Accounts.accountStatus", "inActive"] }, 1, 0] },
					},
					passedChallenge: {
						$sum: { $cond: [{ $eq: ["$mt5Accounts.challengeStatus", "passed"] }, 1, 0] },
					},
					passedPhase1: {
						$sum: {
							$cond: [
								{
									$and: [
										{ $eq: ["$mt5Accounts.challengeStage", "phase1"] },
										{ $eq: ["$mt5Accounts.challengeStatus", "passed"] },
									],
								},
								1,
								0,
							],
						},
					},
					passedPhase2: {
						$sum: {
							$cond: [
								{
									$and: [
										{ $eq: ["$mt5Accounts.challengeStage", "phase2"] },
										{ $eq: ["$mt5Accounts.challengeStatus", "passed"] },
									],
								},
								1,
								0,
							],
						},
					},
					phase1Challenges: {
						$sum: { $cond: [{ $eq: ["$mt5Accounts.challengeStage", "phase1"] }, 1, 0] },
					},
					phase2Challenges: {
						$sum: { $cond: [{ $eq: ["$mt5Accounts.challengeStage", "phase2"] }, 1, 0] },
					},
					fundedChallenges: {
						$sum: { $cond: [{ $eq: ["$mt5Accounts.challengeStage", "funded"] }, 1, 0] },
					},
					instantFundingChallenges: {
						$sum: {
							$cond: [
								{
									$regexMatch: {
										input: "$mt5Accounts.challengeStageData.challengeName",
										regex: "Instant Funding",
									},
								},
								1,
								0,
							],
						},
					},
					oneStepChallenges: {
						$sum: {
							$cond: [
								{
									$regexMatch: {
										input: "$mt5Accounts.challengeStageData.challengeName",
										regex: "oneStep",
									},
								},
								1,
								0,
							],
						},
					},
					twoStepChallenges: {
						$sum: {
							$cond: [
								{
									$regexMatch: {
										input: "$mt5Accounts.challengeStageData.challengeName",
										regex: "twoStep",
									},
								},
								1,
								0,
							],
						},
					},
				},
			},
		]);

		// Get the total count of today's new signups based on user.createdAt
		const todaysNewSignup = await MUser.countDocuments({
			createdAt: {
				$gte: today,
			},
		});

		// Get the total count of yesterday's new signups
		const yesterdaysNewSignup = await MUser.countDocuments({
			createdAt: {
				$gte: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()),
				$lt: today,
			},
		});

		// Get the total count of mt5Accounts from last month
		const lastMonthDate = new Date();
		lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
		const totalMt5AccountsLastMonth = await MUser.aggregate([
			{ $unwind: "$mt5Accounts" },
			{
				$match: {
					"mt5Accounts.createdAt": {
						$gte: new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth(), 1),
						$lt: new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 1),
					},
				},
			},
			{
				$group: {
					_id: null,
					totalMt5Accounts: { $sum: 1 },
				},
			},
		]);

		// Get the total count of users from last month
		const lastMonthUserCount = await MUser.countDocuments({
			createdAt: {
				$gte: new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth(), 1),
				$lt: new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 1),
			},
		});

		// --- New Payout Section ---
		// Get the total number of payout requests
		const totalPayoutRequests = await MWithDrawRequest.countDocuments();

		// Get the total number of approved payout requests and sum of approved amounts
		const approvedPayouts = await MWithDrawRequest.aggregate([
			{
				$match: { status: "approved" },
			},
			{
				$group: {
					_id: null,
					totalApprovedRequests: { $sum: 1 },
					totalApprovedAmount: { $sum: "$amount" },
				},
			},
		]);

		const totalApprovedRequests =
			approvedPayouts.length > 0 ? approvedPayouts[0].totalApprovedRequests : 0;
		const totalApprovedAmount =
			approvedPayouts.length > 0 ? approvedPayouts[0].totalApprovedAmount : 0;

		const totalMt5AccountsCurrent = totalMt5Accounts[0].totalMt5Accounts;
		const totalMt5AccountsLastMonthCount =
			totalMt5AccountsLastMonth.length > 0 ? totalMt5AccountsLastMonth[0].totalMt5Accounts : 0;
		const accountsChange = totalMt5AccountsCurrent - totalMt5AccountsLastMonthCount;

		const usersChange = totalUsers - lastMonthUserCount;

		// Calculate the change in signups from yesterday to today
		const signupChange = todaysNewSignup - yesterdaysNewSignup;

		// Calculate the change in MT5 accounts from last month
		const mt5AccountsChangeFromLastMonth = totalMt5AccountsCurrent - totalMt5AccountsLastMonthCount;

		// Return the counts (if result array is not empty), including totalBreachedAccounts and the computed values
		return result.length > 0
			? {
					...result[0],
					totalMt5Accounts: totalMt5Accounts.length > 0 ? totalMt5Accounts[0].totalMt5Accounts : 0,
					totalUsers,
					usersWithMt5Accounts,
					totalBreachedAccounts,
					totalNonBreachedAccounts: totalMt5Accounts[0].totalMt5Accounts - totalBreachedAccounts,
					accountsChangeFromLastMonth: accountsChange,
					usersChangeFromLastMonth: usersChange,
					signupChangeFromYesterday: signupChange, // Change in signups from yesterday
					todaysNewSignup, // Today's new signup based on user.createdAt
					mt5AccountsChangeFromLastMonth, // Change in MT5 accounts from last month
					lastMonthUserCount, // **Added this line**

					// Payout stats
					totalPayoutRequests, // Total number of payout requests
					totalApprovedRequests, // Total approved payout requests
					totalApprovedAmount, // Total approved payout amount
			  }
			: {
					totalUsers,
					usersWithMt5Accounts,
					totalBreachedAccounts,
					totalNonBreachedAccounts: 0,
					totalMt5Accounts: 0,
					activeMt5Accounts: 0,
					inActiveMt5Accounts: 0,
					passedChallenge: 0,
					passedPhase1: 0, // Default value for passedPhase1
					passedPhase2: 0, // Default value for passedPhase2
					phase1Challenges: 0,
					phase2Challenges: 0,
					fundedChallenges: 0,
					instantFundingChallenges: 0,
					oneStepChallenges: 0,
					twoStepChallenges: 0,
					accountsChangeFromLastMonth: 0,
					usersChangeFromLastMonth: 0,
					signupChangeFromYesterday: 0, // Default value if no results
					todaysNewSignup: 0, // Default value if no results
					mt5AccountsChangeFromLastMonth: 0, // Default value if no results
					lastMonthUserCount: 0, // **Added this line**

					// Default payout stats
					totalPayoutRequests: 0,
					totalApprovedRequests: 0,
					totalApprovedAmount: 0,
			  };
	} catch (error) {
		throw new Error(error.message);
	}
};

/* ------------  get the count mt5 accounts created on that day ----------- */
const getAccountsOverTime = async (startDate, endDate) => {
	try {
		// Define the match stage with an empty object by default
		const matchStage = {};

		// If only startDate is provided, filter for accounts created from startDate onwards
		if (startDate) {
			matchStage["mt5Accounts.createdAt"] = { $gte: new Date(startDate) };
		}

		// If both startDate and endDate are provided, filter between them
		if (startDate && endDate) {
			const adjustedEndDate = new Date(endDate);
			adjustedEndDate.setHours(23, 59, 59, 999); // Include the entire end day

			matchStage["mt5Accounts.createdAt"] = {
				$gte: new Date(startDate),
				$lte: adjustedEndDate,
			};
		}

		// Get all users' mt5Accounts grouped by date, with optional date filtering
		const result = await MUser.aggregate([
			// Unwind mt5Accounts to access each account
			{ $unwind: "$mt5Accounts" },

			// Convert createdAt to a date object in case it's a string
			{
				$addFields: {
					"mt5Accounts.createdAt": {
						$toDate: "$mt5Accounts.createdAt",
					},
				},
			},

			// Add the match stage for filtering by date if startDate or endDate is provided
			{ $match: matchStage },

			// Group by the createdAt date (day level)
			{
				$group: {
					_id: {
						$dateToString: {
							format: "%Y-%m-%d",
							date: "$mt5Accounts.createdAt",
						},
					}, // Group by day
					count: { $sum: 1 }, // Count the number of accounts per day
				},
			},

			// Project to rename _id to createdDay and remove _id
			{
				$project: {
					_id: 0, // Remove the _id field
					createdDay: "$_id", // Rename _id to createdDay
					count: 1, // Keep the count field
				},
			},

			// Sort by date in descending order to get the latest records
			{ $sort: { createdDay: -1 } },

			// Limit to the latest 100 records
			{ $limit: 100 },

			// Optional: Sort the data back in ascending order (if needed)
			{ $sort: { createdDay: 1 } },
		]);

		// Calculate the total count of the documents that match the criteria
		const totalCount = await MUser.aggregate([
			// Unwind mt5Accounts to access each account
			{ $unwind: "$mt5Accounts" },

			// Convert createdAt to a date object in case it's a string
			{
				$addFields: {
					"mt5Accounts.createdAt": {
						$toDate: "$mt5Accounts.createdAt",
					},
				},
			},

			// Add the match stage for filtering by date if startDate or endDate is provided
			{ $match: matchStage },

			// Count the total number of accounts
			{ $count: "totalCount" },
		]);

		// Return both the result and total count
		return {
			data: result,
			totalCount: totalCount.length > 0 ? totalCount[0].totalCount : 0, // If no documents match, return 0
		};
	} catch (error) {
		throw new Error(error.message);
	}
};

/* -------------------------------------------------------------------------- */
/*                  get the count orders created on that day                */
/* -------------------------------------------------------------------------- */
const getOrdersOverTime = async (startDate, endDate) => {
	try {
		// Aggregating the order count by the created date
		const matchStage = {
			orderStatus: "Delivered",
			paymentStatus: "Paid",
			$or: [{ isGiveAway: false }, { isGiveAway: { $exists: false } }],
		};

		// If startDate is provided but endDate is not, use current date as endDate
		if (startDate) {
			matchStage.createdAt = {
				$gte: new Date(startDate), // Greater than or equal to startDate
			};
		}

		// If both startDate and endDate are provided, use them for filtering
		if (startDate && endDate) {
			const adjustedEndDate = new Date(endDate);
			adjustedEndDate.setHours(23, 59, 59, 999); // Include the entire end day

			matchStage.createdAt = {
				$gte: new Date(startDate), // Greater than or equal to startDate
				$lte: adjustedEndDate, // Less than or equal to adjusted endDate
			};
		}

		const ordersOverTime = await MOrder.aggregate([
			{
				// If matchStage has filtering, it will apply it, otherwise, no filtering by date
				$match: matchStage,
			},
			{
				// Extract the date part (year, month, day) from the createdAt field
				$project: {
					date: {
						$dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
					},
					totalPrice: 1, // Include totalPrice in the projection
				},
			},
			{
				// Group the results by the date and count the number of orders
				$group: {
					_id: "$date",
					count: { $sum: 1 },
					totalSum: { $sum: "$totalPrice" },
				},
			},
			{
				// Sort the result by date in descending order to get the latest dates first
				$sort: { _id: -1 },
			},
			{
				// Limit the results to the latest 100 entries
				$limit: 100,
			},
			{
				// Sort the result again by date in ascending order after limiting
				$sort: { _id: 1 },
			},
			{
				// Rename _id to createdDate
				$project: {
					_id: 0, // Remove the _id field
					createdDay: "$_id", // Rename _id to createdDate
					count: 1, // Keep the count field
					totalSum: 1, // Keep the totalSum field
				},
			},
		]);

		// Calculate the total count of orders in the selected date range
		const totalCount = ordersOverTime.reduce((total, entry) => total + entry.count, 0);
		const totalSum = ordersOverTime.reduce((total, entry) => total + entry.totalSum, 0);

		// Return the same structure but add the total count to the data array
		return {
			success: true,
			data: ordersOverTime,
			totalCount: totalCount,
			totalSum: totalSum,
		};
	} catch (error) {
		throw new Error("Failed to retrieve order data: " + error.message);
	}
};

const getMetaSales = async (startDate, endDate) => {
	try {
		const roundToTwo = (num) => Math.round(num * 100) / 100;

		const now = new Date();
		const startOfToday = new Date(now.setHours(0, 0, 0, 0));
		const endOfToday = new Date(now.setHours(23, 59, 59, 999));
		const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
		const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
		const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

		const totalSalesPipeline = [
			{
				$match: {
					paymentStatus: "Paid",
					orderStatus: "Delivered",
					$or: [{ isGiveAway: false }, { isGiveAway: { $exists: false } }],
				},
			},
			{ $group: { _id: null, totalSales: { $sum: "$totalPrice" } } },
		];

		const todaySalesPipeline = [
			{
				$match: {
					paymentStatus: "Paid",
					orderStatus: "Delivered",
					$or: [{ isGiveAway: false }, { isGiveAway: { $exists: false } }],
					createdAt: { $gte: startOfToday, $lt: endOfToday },
				},
			},
			{ $group: { _id: null, totalSalesToday: { $sum: "$totalPrice" } } },
		];

		const yesterdaySalesPipeline = [
			{
				$match: {
					paymentStatus: "Paid",
					orderStatus: "Delivered",
					$or: [{ isGiveAway: false }, { isGiveAway: { $exists: false } }],
					createdAt: { $gte: startOfYesterday, $lt: startOfToday },
				},
			},
			{ $group: { _id: null, totalSalesYesterday: { $sum: "$totalPrice" } } },
		];

		const lastMonthSalesPipeline = [
			{
				$match: {
					paymentStatus: "Paid",
					orderStatus: "Delivered",
					$or: [{ isGiveAway: false }, { isGiveAway: { $exists: false } }],
					createdAt: { $gte: startOfLastMonth, $lt: startOfCurrentMonth },
				},
			},
			{
				$group: {
					_id: null,
					totalSalesLastMonth: { $sum: "$totalPrice" },
					totalOrdersLastMonth: { $sum: 1 },
				},
			},
		];

		const currentMonthSalesPipeline = [
			{
				$match: {
					paymentStatus: "Paid",
					orderStatus: "Delivered",
					$or: [{ isGiveAway: false }, { isGiveAway: { $exists: false } }],
					createdAt: { $gte: startOfCurrentMonth, $lt: startOfNextMonth },
				},
			},
			{
				$group: {
					_id: null,
					totalSalesCurrentMonth: { $sum: "$totalPrice" },
					totalOrdersCurrentMonth: { $sum: 1 },
				},
			},
		];

		const lastMonthOrdersPipeline = [
			{ $match: { createdAt: { $gte: startOfLastMonth, $lt: startOfCurrentMonth } } },
			{ $group: { _id: null, totalOrdersLastMonth: { $sum: 1 } } },
		];

		const currentMonthOrdersPipeline = [
			{ $match: { createdAt: { $gte: startOfCurrentMonth, $lt: startOfNextMonth } } },
			{ $group: { _id: null, totalOrdersCurrentMonth: { $sum: 1 } } },
		];

		// Create date filter for orders by country
		const dateFilter = {};
		if (startDate) {
			dateFilter.$gte = new Date(startDate);
		}
		if (endDate) {
			dateFilter.$lt = new Date(endDate);
		}

		// Orders by Country Pipeline with date filter
		const ordersByCountryPipeline = [
			{
				$match: {
					paymentStatus: "Paid",
					orderStatus: "Delivered",
					$or: [{ isGiveAway: false }, { isGiveAway: { $exists: false } }],
					...(startDate || endDate ? { createdAt: dateFilter } : {}),
				},
			},
			{
				$group: {
					_id: "$buyerDetails.country",
					count: { $sum: 1 },
					totalSales: { $sum: "$totalPrice" },
				},
			},
			{
				$project: {
					country: "$_id",
					count: 1,
					totalSales: 1,
					_id: 0,
				},
			},
		];

		// Count all the orders in the collection with filters
		const totalOrdersResult = await MOrder.countDocuments();

		// Run all aggregation pipelines concurrently
		const [
			totalSalesResult,
			todaySalesResult,
			yesterdaySalesResult,
			lastMonthSalesResult,
			currentMonthSalesResult,
			lastMonthOrdersResult,
			currentMonthOrdersResult,
			ordersByCountryResult,
		] = await Promise.all([
			MOrder.aggregate(totalSalesPipeline),
			MOrder.aggregate(todaySalesPipeline),
			MOrder.aggregate(yesterdaySalesPipeline),
			MOrder.aggregate(lastMonthSalesPipeline),
			MOrder.aggregate(currentMonthSalesPipeline),
			MOrder.aggregate(lastMonthOrdersPipeline),
			MOrder.aggregate(currentMonthOrdersPipeline),
			MOrder.aggregate(ordersByCountryPipeline),
		]);

		// Extract sales data
		const totalSales = totalSalesResult[0]?.totalSales || 0;
		const lastMonthSales = lastMonthSalesResult[0]?.totalSalesLastMonth || 0;
		const currentMonthSales = currentMonthSalesResult[0]?.totalSalesCurrentMonth || 0;
		const yesterdaySales = yesterdaySalesResult[0]?.totalSalesYesterday || 0;

		// Calculate total orders in the filtered date range for percentage calculation
		const totalFilteredOrders = ordersByCountryResult.reduce(
			(sum, country) => sum + country.count,
			0
		);

		// Process orders by country data - EXCLUDE Unknown countries entirely
		const ordersWithPercentage = ordersByCountryResult
			.filter((countryData) => countryData.country) // Filter out entries with no country
			.map((countryData) => ({
				country: countryData.country.charAt(0).toUpperCase() + countryData.country.slice(1),
				count: countryData.count,
				totalSales: roundToTwo(countryData.totalSales || 0),
				percentage: totalFilteredOrders
					? Math.round((countryData.count / totalFilteredOrders) * 10000) / 100
					: 0,
			}));

		// Calculate total filtered sales of known countries only
		const totalFilteredSalesKnownCountries = ordersWithPercentage.reduce(
			(sum, country) => sum + country.totalSales,
			0
		);

		// Calculate total orders of known countries only
		const totalKnownCountryOrders = ordersWithPercentage.reduce(
			(sum, country) => sum + country.count,
			0
		);

		// Determine the top country based on SALES (totalPrice) rather than count
		const topCountryBySales = ordersWithPercentage.reduce((max, country) => {
			return country.totalSales > (max?.totalSales || 0) ? country : max;
		}, null);

		// Also keep the top country by count if needed
		const topCountryByCount = ordersWithPercentage.reduce((max, country) => {
			return country.count > (max?.count || 0) ? country : max;
		}, null);

		return {
			totalSales: roundToTwo(totalSales),
			todaySales: roundToTwo(todaySalesResult[0]?.totalSalesToday || 0),
			yesterdaySales: roundToTwo(yesterdaySales),
			lastMonthSales: roundToTwo(lastMonthSales),
			currentMonthSales: roundToTwo(currentMonthSales),
			lastMonthOrders: lastMonthOrdersResult[0]?.totalOrdersLastMonth || 0,
			currentMonthOrders: currentMonthOrdersResult[0]?.totalOrdersCurrentMonth || 0,
			totalOrders: totalOrdersResult || 0,
			ordersByCountry: ordersWithPercentage,
			topCountry: topCountryBySales, // Now based on sales amount
			topCountryByCount, // Also include top by count if needed
			totalFilteredOrders: totalKnownCountryOrders,
			totalFilteredSales: roundToTwo(totalFilteredSalesKnownCountries),
		};
	} catch (error) {
		console.error("Error calculating order sales:", error.message);
		throw new Error("Failed to calculate order sales");
	}
};

const getSpecificChallengeSalesMeta = async (startDate, endDate) => {
	try {
		const challenges = {
			FF5KOneStep: "Foxx Funded 5k oneStep",
			FF10KOneStep: "Foxx Funded 10k oneStep",
			FF25KOneStep: "Foxx Funded 25k oneStep",
			FF50KOneStep: "Foxx Funded 50k oneStep",
			FF100KOneStep: "Foxx Funded 100k oneStep",
			FF200KOneStep: "Foxx Funded 200k oneStep",
			FF300KOneStep: "Foxx Funded 300k oneStep",
			FF5KTwoStep: "Foxx Funded 5k twoStep",
			FF10KTwoStep: "Foxx Funded 10k twoStep",
			FF25KTwoStep: "Foxx Funded 25k twoStep",
			FF50KTwoStep: "Foxx Funded 50k twoStep",
			FF100KTwoStep: "Foxx Funded 100k twoStep",
			FF200KTwoStep: "Foxx Funded 200k twoStep",
			FF300KTwoStep: "Foxx Funded 300k twoStep",
			FFIF5K: "Foxx Funded 5k Instant Funding",
			FFIF10K: "Foxx Funded 10k Instant Funding",
			FFIF25K: "Foxx Funded 25k Instant Funding",
			FFIF50K: "Foxx Funded 50k Instant Funding",
			FFIF100K: "Foxx Funded 100k Instant Funding",
		};

		// Step 1: Fetch counts for challenges
		const counts = await Promise.all(
			Object.entries(challenges).map(async ([key, name]) => {
				const matchCriteria = {
					"mt5Accounts.challengeStageData.challengeName": {
						$regex: `^${name}(?:\\s*\\(.*\\))?$`, // Match name with possible suffixes (e.g., "Phase-1")
						$options: "i", // Case-insensitive match
					},
				};

				// Apply date filtering if applicable

				if (startDate || endDate) {
					matchCriteria["mt5Accounts.createdAt"] = {};
					if (startDate) matchCriteria["mt5Accounts.createdAt"].$gte = new Date(startDate);
					if (endDate) matchCriteria["mt5Accounts.createdAt"].$lt = new Date(endDate);
				}

				const mt5AccountCount = await MUser.aggregate([
					{ $unwind: "$mt5Accounts" },
					{ $match: matchCriteria },
					{ $count: "count" },
				]);

				const count = mt5AccountCount.length > 0 ? mt5AccountCount[0].count : 0;
				return [name, { count }];
			})
		);

		// Step 2: Fetch total sales for challenges
		const challengeNames = Object.values(challenges);

		// Build the match stage for total sales aggregation
		const matchStage = {
			orderStatus: "Delivered",
			paymentStatus: "Paid",
			$or: [{ isGiveAway: false }, { isGiveAway: { $exists: false } }],
			$and: [
				{
					$or: challengeNames.map((name) => ({
						"orderItems.challengeName": {
							$regex: `^${name}(?:\\s*\\(.*\\))?$`, // Match names with potential suffixes
							$options: "i", // Case-insensitive
						},
					})),
				},
			],
		};

		if (startDate) {
			matchStage.createdAt = { $gte: new Date(startDate) };
		}

		if (endDate) {
			matchStage.createdAt = matchStage.createdAt
				? { ...matchStage.createdAt, $lte: new Date(endDate) }
				: { $lte: new Date(endDate) };
		}

		const pipeline = [
			{ $match: matchStage },
			{ $unwind: "$orderItems" },
			{
				$match: {
					"orderItems.challengeName": { $in: challengeNames },
				},
			},
			{
				$group: {
					_id: "$orderItems.challengeName",
					totalSales: { $sum: "$totalPrice" },
				},
			},
		];

		const salesResults = await MOrder.aggregate(pipeline);

		// Combine counts and sales into one object
		const combinedResults = challengeNames.reduce((acc, name) => {
			acc[name] = {
				count: 0,
				totalSales: 0,
			};
			return acc;
		}, {});

		// Populate counts
		counts.forEach(([name, { count }]) => {
			if (combinedResults[name]) {
				combinedResults[name].count = count;
			}
		});

		// Populate total sales
		salesResults.forEach(({ _id, totalSales }) => {
			if (combinedResults[_id]) {
				combinedResults[_id].totalSales = totalSales;
			}
		});

		return combinedResults;
	} catch (error) {
		console.error("Error fetching challenge sales meta:", error);
		return { success: false, error: error.message };
	}
};

module.exports = {
	getMt5MetaData,
	getAccountsOverTime,
	getOrdersOverTime,
	getMetaSales,
	getSpecificChallengeSalesMeta,
};
