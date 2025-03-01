const moment = require("moment");
const { getActiveAccounts } = require("./sevenDaysTradingChallenge.services");
const { orderHistories } = require("../../thirdPartyMt5Api/thirdPartyMt5Api");
const SevenDaysTradingChallenge = require("./sevenDaysTradingChallenge.schema");

const fetchAndValidateOrderHistory = async (accountNumber, startDate, endDate) => {
    const history = await orderHistories(accountNumber, startDate, endDate);
    if (!Array.isArray(history)) {
        throw new Error(`Invalid response for account ${accountNumber}. Expected an array.`);
    }
    return history.filter(order => order.openTime && !isNaN(new Date(order.openTime).getTime()));
};

const getLastOpenTime = (orders) => {
    const openTimes = orders.map(order => moment(order.openTime));
    return openTimes.length > 0 ? moment.max(openTimes) : null;
};

// const checkInactivityInWindow = (history, startDate, endDate) => {
//     return !history.some(order => {
//         const orderTime = moment(order.openTime);
//         return orderTime.isBetween(startDate, endDate, null, '[]');
//     });
// };

const checkAndSaveInactiveAccounts = async () => {
    try {
        const activeAccounts = await getActiveAccounts();

        for (const account of activeAccounts) {
            try {
                const { account: accountNumber, email } = account;

                // Step 1: Fetch the full order history
                const fullHistory = await fetchAndValidateOrderHistory(accountNumber, "970-01-01", "2100-01-01");

                // Skip accounts with no valid order history
                if (!Array.isArray(fullHistory) || fullHistory.length === 0) {
                    console.log(`Account ${accountNumber} has no valid order history. Skipping.`);
                    continue;
                }

                // Step 2: Calculate the last open time
                const lastOpenTime = getLastOpenTime(fullHistory);

                if (!lastOpenTime) {
                    console.log(`Account ${accountNumber} has no valid open times in its history. Skipping.`);
                    continue;
                }

                // Step 3: Define a 2-day window starting from the last open time
                const startDate = moment(lastOpenTime).format("YYYY-MM-DD");
                const endDate = moment(lastOpenTime).add(2, "days").endOf("day").format("YYYY-MM-DD");

                // Step 4: Fetch order history for the 2-day window
                const recentHistory = await fetchAndValidateOrderHistory(accountNumber, startDate, endDate);

                // Step 5: Check if there are any trades in the 2-day window
                const hasOpenTime = recentHistory.some(order => moment(order.openTime).isBetween(startDate, endDate, null, '[]'));

                if (!hasOpenTime) {
                    // Case: No trades in the last 2 days (or more)
                    console.log(`Account ${accountNumber} has no open time in the last 2 days. Marking as inactive.`);

                    let existingAccount = await SevenDaysTradingChallenge.findOne({ account: accountNumber });

                    if (existingAccount) {
                        existingAccount.countdown += 1;
                        await existingAccount.save();
                        console.log(
                            `Account ${accountNumber} updated in the database. Countdown: ${existingAccount.countdown}`
                        );
                    } else {
                        await SevenDaysTradingChallenge.create({
                            email,
                            account: accountNumber,
                            countdown: 1,
                        });
                        console.log(
                            `Account ${accountNumber} saved in the database with countdown: 1`
                        );
                    }
                } else {
                    console.log(
                        `Account ${accountNumber} has open time in the last 2 days. No action taken.`
                    );
                }
            } catch (accountError) {
                console.error(`Error processing account ${account.account}:`, accountError);
            }
        }
    } catch (error) {
        console.error("Error processing inactive accounts:", error);
    }
};

module.exports = { checkAndSaveInactiveAccounts };