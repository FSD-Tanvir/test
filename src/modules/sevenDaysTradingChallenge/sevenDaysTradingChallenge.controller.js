
const moment = require("moment");
const { getActiveAccounts } = require("./sevenDaysTradingChallenge.services");
const { orderHistories } = require("../../thirdPartyMt5Api/thirdPartyMt5Api");
const SevenDaysTradingChallenge = require("./sevenDaysTradingChallenge.schema");



// Function to check and save inactive accounts with last open time
const checkAndSaveInactiveAccounts = async () => {
    try {
        // Step 1: Fetch all active accounts
        const activeAccounts = await getActiveAccounts();
// console.log(activeAccounts)
        // Step 2: Iterate through each active account
        for (const account of activeAccounts) {
            const { account: accountNumber, email } = account; // Destructure account number and email
            const startDate = "970-01-01"
            const endDate = "2100-01-01"
            // Step 3: Fetch the full order history to determine the last open time
            const fullHistory = await orderHistories(accountNumber, startDate, endDate); 


            if (!Array.isArray(fullHistory)) {
                console.warn(`Invalid response for account ${accountNumber}. Expected an array.`);
                continue; // Skip to the next account
            }
            
            // Step 4: Extract all open times from the order history
            const openTimes = fullHistory
                .filter((order) => order.openTime) // Filter orders with valid openTime
                .map((order) => new Date(order.openTime)); // Convert openTime to Date objects

            // Step 5: Determine the last open time (most recent open time)
            const lastOpenTime = openTimes.length > 0 ? new Date(Math.max(...openTimes)) : null;

            // Step 6: If there is a last open time, define the 7-day window
            if (lastOpenTime) {
                const startDate1 = moment(lastOpenTime).format("YYYY-MM-DD");
                const endDate2 = moment(lastOpenTime).add(2, "days").format("YYYY-MM-DD");

                // Step 7: Fetch order history for the 7-day window
                const history = await orderHistories(accountNumber, startDate1, endDate2);

                if (!Array.isArray(history)) {
                    console.warn(`Invalid response for account ${accountNumber} in the 7-day window. Expected an array.`);
                    continue; // Skip to the next account
                }
                // Step 8: Check if there are any open times in the 7-day window
                const hasOpenTime = history.some((order) => order.openTime);

                if (!hasOpenTime) {
                    // Step 9: Check if the account already exists in the SevenDaysTradingChallenge collection
                    let existingAccount = await SevenDaysTradingChallenge.findOne({ account: accountNumber });

                    if (existingAccount) {
                        // Increment the countdown if the account exists
                        existingAccount.lastOpenTime = lastOpenTime;
                        existingAccount.countdown += 1;
                        await existingAccount.save();
                        console.log(
                            `Account ${accountNumber} (Email: ${email}) updated in the database. Countdown: ${existingAccount.countdown}`
                        );
                    } else {
                        // Save the account in the database if it doesn't exist
                        await SevenDaysTradingChallenge.create({
                            email,
                            account: accountNumber,
                            lastOpenTime: lastOpenTime,
                            countdown: 1,
                        });
                        console.log(
                            `Account ${accountNumber} (Email: ${email}) saved in the database with countdown: 1`
                        );
                    }
                } else {
                    console.log(
                        `Account ${accountNumber} (Email: ${email}) has open time in the last 7 days. No action taken.`
                    );
                }
            } else {
                console.log(
                    `Account ${accountNumber} (Email: ${email}) has no open time in its history. No action taken.`
                );
            }
        }
    } catch (error) {
        console.error("Error processing inactive accounts:", error);
    }
};

module.exports = { checkAndSaveInactiveAccounts };