const { mt5Constant, matchTraderConstant } = require("../../constants/commonConstants");
const {
	DisableAccountMatchTrader,
	DisableAccount,
} = require("../disableAccounts/disableAccounts.schema");
const { MOrder } = require("../orders/orders.schema");
const MUser = require("../users/users.schema");
const MWithDrawRequest = require("../withDrawRequests/withDrawRequests.schema");

const getMt5MetaData = async () => {
	try {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const yesterday = new Date(today);
		yesterday.setDate(today.getDate() - 1);

		const totalUsers = await MUser.countDocuments();

		// Get users with MT5 and MatchTrader accounts
		const usersWithMt5Accounts = await MUser.countDocuments({
			mt5Accounts: { $exists: true, $not: { $size: 0 } },
		});
		const usersWithMatchTraderAccounts = await MUser.countDocuments({
			matchTraderAccounts: { $exists: true, $not: { $size: 0 } },
		});

		// Total breached accounts per platform
		const totalBreachedAccountsMt5 = await DisableAccount.countDocuments({});
		const totalBreachedAccountsMatchTrader = await DisableAccountMatchTrader.countDocuments({});
		const totalBreachedAccounts = totalBreachedAccountsMt5 + totalBreachedAccountsMatchTrader;

		// Disabled account IDs per platform
		const disabledMt5AccountIds = (await DisableAccount.find({}).distinct("mt5Account")).map(
			Number
		);
		const disabledMatchTraderAccountIds = (
			await DisableAccountMatchTrader.find({}).distinct("matchTraderAccount")
		).map(Number);

		// Total account counts
		const totalMt5Accounts = await MUser.aggregate([
			{ $unwind: "$mt5Accounts" },
			{ $group: { _id: null, total: { $sum: 1 } } },
		]);
		const totalMatchTraderAccounts = await MUser.aggregate([
			{ $unwind: "$matchTraderAccounts" },
			{ $group: { _id: null, total: { $sum: 1 } } },
		]);

		const buildAggregation = (accountField, disabledIds) => [
			{
				$addFields: {
					[accountField]: {
						$filter: {
							input: `$${accountField}`,
							as: "account",
							cond: { $not: { $in: ["$$account.account", disabledIds] } },
						},
					},
				},
			},
			{ $unwind: `$${accountField}` },
			{
				$group: {
					_id: null,
					active: {
						$sum: { $cond: [{ $eq: [`$${accountField}.accountStatus`, "active"] }, 1, 0] },
					},
					inActive: {
						$sum: { $cond: [{ $eq: [`$${accountField}.accountStatus`, "inActive"] }, 1, 0] },
					},
					passedChallenge: {
						$sum: { $cond: [{ $eq: [`$${accountField}.challengeStatus`, "passed"] }, 1, 0] },
					},
					passedPhase1: {
						$sum: {
							$cond: [
								{
									$and: [
										{ $eq: [`$${accountField}.challengeStage`, "phase1"] },
										{ $eq: [`$${accountField}.challengeStatus`, "passed"] },
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
										{ $eq: [`$${accountField}.challengeStage`, "phase2"] },
										{ $eq: [`$${accountField}.challengeStatus`, "passed"] },
									],
								},
								1,
								0,
							],
						},
					},
					phase1Challenges: {
						$sum: { $cond: [{ $eq: [`$${accountField}.challengeStage`, "phase1"] }, 1, 0] },
					},
					phase2Challenges: {
						$sum: { $cond: [{ $eq: [`$${accountField}.challengeStage`, "phase2"] }, 1, 0] },
					},
					fundedChallenges: {
						$sum: { $cond: [{ $eq: [`$${accountField}.challengeStage`, "funded"] }, 1, 0] },
					},
					oneStepChallenges: {
						$sum: {
							$cond: [
								{
									$regexMatch: {
										input: `$${accountField}.challengeStageData.challengeName`,
										regex: /oneStep/i,
									},
								},
								1,
								0,
							],
						},
					},
					instantFundingChallenges: {
						$sum: {
							$cond: [
								{
									$regexMatch: {
										input: `$${accountField}.challengeStageData.challengeName`,
										regex: /instant funding/i,
									},
								},
								1,
								0,
							],
						},
					},
				},
			},
		];

		const [mt5Result, matchTraderResult] = await Promise.all([
			MUser.aggregate(buildAggregation("mt5Accounts", disabledMt5AccountIds)),
			MUser.aggregate(buildAggregation("matchTraderAccounts", disabledMatchTraderAccountIds)),
		]);

		const mergedResult = {
			activeMt5Accounts: mt5Result[0]?.active || 0,
			inActiveMt5Accounts: mt5Result[0]?.inActive || 0,
			activeMatchTraderAccounts: matchTraderResult[0]?.active || 0,
			passedChallenge:
				(mt5Result[0]?.passedChallenge || 0) + (matchTraderResult[0]?.passedChallenge || 0),
			passedPhase1: (mt5Result[0]?.passedPhase1 || 0) + (matchTraderResult[0]?.passedPhase1 || 0),
			passedPhase2: (mt5Result[0]?.passedPhase2 || 0) + (matchTraderResult[0]?.passedPhase2 || 0),
			phase1Challenges:
				(mt5Result[0]?.phase1Challenges || 0) + (matchTraderResult[0]?.phase1Challenges || 0),
			phase2Challenges:
				(mt5Result[0]?.phase2Challenges || 0) + (matchTraderResult[0]?.phase2Challenges || 0),
			fundedChallenges:
				(mt5Result[0]?.fundedChallenges || 0) + (matchTraderResult[0]?.fundedChallenges || 0),
			oneStepChallenges:
				(mt5Result[0]?.oneStepChallenges || 0) + (matchTraderResult[0]?.oneStepChallenges || 0),
			instantFundingChallenges:
				(mt5Result[0]?.instantFundingChallenges || 0) +
				(matchTraderResult[0]?.instantFundingChallenges || 0),
		};

		const todaysNewSignup = await MUser.countDocuments({ createdAt: { $gte: today } });

		const yesterdaysNewSignup = await MUser.countDocuments({
			createdAt: { $gte: yesterday, $lt: today },
		});

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
			{ $group: { _id: null, total: { $sum: 1 } } },
		]);

		const totalMatchTraderAccountsLastMonth = await MUser.aggregate([
			{ $unwind: "$matchTraderAccounts" },
			{
				$match: {
					"matchTraderAccounts.createdAt": {
						$gte: new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth(), 1),
						$lt: new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 1),
					},
				},
			},
			{ $group: { _id: null, total: { $sum: 1 } } },
		]);

		const lastMonthUserCount = await MUser.countDocuments({
			createdAt: {
				$gte: new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth(), 1),
				$lt: new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 1),
			},
		});

		const totalPayoutRequests = await MWithDrawRequest.countDocuments();
		const approvedPayouts = await MWithDrawRequest.aggregate([
			{ $match: { status: "approved" } },
			{
				$group: {
					_id: null,
					totalApprovedRequests: { $sum: 1 },
					totalApprovedAmount: { $sum: "$amount" },
				},
			},
		]);

		const totalMt5AccountsCount = totalMt5Accounts[0]?.total || 0;
		const totalMatchTraderAccountsCount = totalMatchTraderAccounts[0]?.total || 0;
		const totalAccountsCombined = totalMt5AccountsCount + totalMatchTraderAccountsCount;

		const mt5LastMonth = totalMt5AccountsLastMonth[0]?.total || 0;
		const matchTraderLastMonth = totalMatchTraderAccountsLastMonth[0]?.total || 0;

		const accountsChangeFromLastMonth =
			totalAccountsCombined - (mt5LastMonth + matchTraderLastMonth);
		const matchTraderChangeFromLastMonth = totalMatchTraderAccountsCount - matchTraderLastMonth;
		const mt5AccountsChangeFromLastMonth = totalMt5AccountsCount - mt5LastMonth;
		const usersChange = totalUsers - lastMonthUserCount;
		const signupChange = todaysNewSignup - yesterdaysNewSignup;

		return {
			...mergedResult,
			totalUsers,
			usersWithMt5Accounts,
			usersWithMatchTraderAccounts,
			totalMt5Accounts: totalMt5AccountsCount,
			totalMatchTraderAccounts: totalMatchTraderAccountsCount,
			totalBreachedAccounts,
			totalBreachedAccountsMt5,
			totalBreachedAccountsMatchTrader,
			totalNonBreachedAccounts: totalAccountsCombined - totalBreachedAccounts,
			accountsChangeFromLastMonth,
			mt5AccountsChangeFromLastMonth,
			matchTraderChangeFromLastMonth,
			usersChangeFromLastMonth: usersChange,
			signupChangeFromYesterday: signupChange,
			todaysNewSignup,
			lastMonthUserCount,
			totalPayoutRequests,
			totalApprovedRequests: approvedPayouts[0]?.totalApprovedRequests || 0,
			totalApprovedAmount: approvedPayouts[0]?.totalApprovedAmount || 0,
		};
	} catch (error) {
		throw new Error(error.message);
	}
};

/* ------------  get the count mt5 and match trader accounts created on that day ----------- */
const getCombinedAccountsOverTime = async (startDate, endDate) => {
	try {
		const getAggregation = (accountField, startDate, endDate) => {
			const matchStage = {};

			if (startDate && endDate) {
				const adjustedEndDate = new Date(endDate);
				adjustedEndDate.setHours(23, 59, 59, 999);
				matchStage[`${accountField}.createdAt`] = {
					$gte: new Date(startDate),
					$lte: adjustedEndDate,
				};
			} else if (startDate) {
				matchStage[`${accountField}.createdAt`] = { $gte: new Date(startDate) };
			}

			return [
				{ $unwind: `$${accountField}` },
				{
					$addFields: {
						[`${accountField}.createdAt`]: {
							$toDate: `$${accountField}.createdAt`,
						},
					},
				},
				{ $match: matchStage },
				{
					$group: {
						_id: {
							$dateToString: {
								format: "%Y-%m-%d",
								date: `$${accountField}.createdAt`,
							},
						},
						count: { $sum: 1 },
					},
				},
				{
					$project: {
						_id: 0,
						createdDay: "$_id",
						count: 1,
					},
				},
				{ $sort: { createdDay: 1 } },
			];
		};

		const [mt5Data, matchTraderData] = await Promise.all([
			MUser.aggregate(getAggregation("mt5Accounts", startDate, endDate)),
			MUser.aggregate(getAggregation("matchTraderAccounts", startDate, endDate)),
		]);

		const dateMap = new Map();

		// Merge MT5 data
		for (const entry of mt5Data) {
			if (!dateMap.has(entry.createdDay)) {
				dateMap.set(entry.createdDay, { createdDay: entry.createdDay, mt5: 0, matchTrader: 0 });
			}
			dateMap.get(entry.createdDay).mt5 = entry.count;
		}

		// Merge MatchTrader data
		for (const entry of matchTraderData) {
			if (!dateMap.has(entry.createdDay)) {
				dateMap.set(entry.createdDay, { createdDay: entry.createdDay, mt5: 0, matchTrader: 0 });
			}
			dateMap.get(entry.createdDay).matchTrader = entry.count;
		}

		// Convert to array and compute total count renamed as 'count'
		const combinedData = Array.from(dateMap.values())
			.map((entry) => ({
				...entry,
				count: entry.mt5 + entry.matchTrader,
			}))
			.sort((a, b) => new Date(a.createdDay) - new Date(b.createdDay));

		const totalCount = combinedData.reduce((acc, cur) => acc + cur.count, 0);

		return {
			data: combinedData,
			totalCount,
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

const getSpecificChallengeSalesMeta = async (startDate, endDate, accountType = "all") => {
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

		const challengeNames = Object.values(challenges);

		const getAccountCounts = async (accountField) => {
			return Promise.all(
				Object.entries(challenges).map(async ([key, name]) => {
					const matchCriteria = {
						[`${accountField}.challengeStageData.challengeName`]: {
							$regex: `^${name}(?:\\s*\\(.*\\))?$`,
							$options: "i",
						},
					};

					if (startDate || endDate) {
						matchCriteria[`${accountField}.createdAt`] = {};
						if (startDate) matchCriteria[`${accountField}.createdAt`].$gte = new Date(startDate);
						if (endDate) matchCriteria[`${accountField}.createdAt`].$lt = new Date(endDate);
					}

					const accountCount = await MUser.aggregate([
						{ $unwind: `$${accountField}` },
						{ $match: matchCriteria },
						{ $count: "count" },
					]);

					const count = accountCount.length > 0 ? accountCount[0].count : 0;
					return [name, count];
				})
			);
		};

		let mt5CountsArr = [],
			matchTraderCountsArr = [];

		if (accountType === "all" || accountType === "mt5") {
			mt5CountsArr = await getAccountCounts("mt5Accounts");
		}
		if (accountType === "all" || accountType === "matchTrader") {
			matchTraderCountsArr = await getAccountCounts("matchTraderAccounts");
		}

		const mt5CountsMap = new Map(mt5CountsArr);
		const matchTraderCountsMap = new Map(matchTraderCountsArr);

		const matchStage = {
			orderStatus: "Delivered",
			paymentStatus: "Paid",
			$or: [{ isGiveAway: false }, { isGiveAway: { $exists: false } }],
			$and: [
				{
					$or: challengeNames.map((name) => ({
						"orderItems.challengeName": {
							$regex: `^${name}(?:\\s*\\(.*\\))?$`,
							$options: "i",
						},
					})),
				},
			],
		};

		if (startDate) matchStage.createdAt = { $gte: new Date(startDate) };
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

		const combinedResults = challengeNames.reduce((acc, name) => {
			acc[name] = {
				count: (mt5CountsMap.get(name) || 0) + (matchTraderCountsMap.get(name) || 0),
				totalSales: 0,
			};
			return acc;
		}, {});

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
	getCombinedAccountsOverTime,
	getOrdersOverTime,
	getMetaSales,
	getSpecificChallengeSalesMeta,
};
