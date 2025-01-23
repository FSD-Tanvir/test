const { get } = require("mongoose");
const { getUsersWithFundedAccounts5kAndChallenge, getUsersWithFundedAccounts10kAndChallenge, getUsersWithFundedAccounts25kAndChallenge, getUsersWithFundedAccounts50kAndChallenge, getUsersWithFundedAccounts100kAndChallenge, getUsersWithFundedAccounts200kAndChallenge } = require("../../helper/utils/topAccount");
const { getSingleAccountSummery } = require("../../thirdPartyMt5Api/thirdPartyMt5Api");
const { getDisabledAccount } = require("../disableAccounst/disableAccounts.services");




const get5kAccount = async () => {
    try {
        // Step 1: Fetch account summary
        const FundedAccountsFor5k = await getUsersWithFundedAccounts5kAndChallenge();

        // Step 2: Create an array of promises and resolve them using Promise.all
        const resultArrayPromises = FundedAccountsFor5k.flatMap(user => {
            return user.mt5Accounts.map(async (mt5Account) => {
                const matchingAccount = await getSingleAccountSummery(mt5Account.account);

                if (matchingAccount.length > 0) {
                    const accountSummary = matchingAccount[0];
                    const equity = accountSummary.equity;

                    // Assuming mt5Account.accountSize holds the account size
                    if (equity > mt5Account.challengeStageData.accountSize) {
                        const disabledAccount = await getDisabledAccount(accountSummary.login);

                        if (!disabledAccount) {
                            // If the account is not disabled, return the account details
                            return {
                                challengeName: mt5Account.challengeStageData.challengeName, // Assuming this is the challenge name field
                                accountNumber: accountSummary.login,
                                balance: accountSummary.balance,
                                profit: accountSummary.profit,
                                equity: accountSummary.equity
                            };
                        }
                    }
                }
                return null;
            });
        });

        // Wait for all promises to resolve
        const resultArray = (await Promise.all(resultArrayPromises)).filter(account => account !== null);

        // Step 3: Sort by equity in descending order and slice the top 20
        const top20Accounts = resultArray
            .sort((a, b) => b.equity - a.equity) // Sort accounts by equity in descending order
            .slice(0, 20); // Take the top 20 accounts

        // console.log(top20Accounts); // Output the top 20 accounts based on equity
        return top20Accounts;

    } catch (error) {
        console.error("Error fetching account data:", error);
        throw error;
    }
};
const get10kAccount = async () => {
    try {
        // Step 1: Fetch account summary
        const FundedAccountsFor5k = await getUsersWithFundedAccounts10kAndChallenge();

        // Step 2: Create an array of promises and resolve them using Promise.all
        const resultArrayPromises = FundedAccountsFor5k.flatMap(user => {
            return user.mt5Accounts.map(async (mt5Account) => {
                const matchingAccount = await getSingleAccountSummery(mt5Account.account);

                if (matchingAccount.length > 0) {
                    const accountSummary = matchingAccount[0];
                    const equity = accountSummary.equity;

                    // Assuming mt5Account.accountSize holds the account size
                    if (equity > mt5Account.challengeStageData.accountSize) {
                        const disabledAccount = await getDisabledAccount(accountSummary.login);

                        if (!disabledAccount) {
                            // If the account is not disabled, return the account details
                            return {
                                challengeName: mt5Account.challengeStageData.challengeName, // Assuming this is the challenge name field
                                accountNumber: accountSummary.login,
                                balance: accountSummary.balance,
                                profit: accountSummary.profit,
                                equity: accountSummary.equity
                            };
                        }
                    }
                }
                return null;
            });
        });
        // Wait for all promises to resolve
        const resultArray = (await Promise.all(resultArrayPromises)).filter(account => account !== null);

        // Step 3: Sort by equity in descending order and slice the top 20
        const top20Accounts = resultArray
            .sort((a, b) => b.equity - a.equity) // Sort accounts by equity in descending order
            .slice(0, 20); // Take the top 20 accounts

        // console.log(top20Accounts); // Output the top 20 accounts based on equity
        return top20Accounts;

    } catch (error) {
        console.error("Error fetching account data:", error);
        throw error;
    }
};
const get50kAccount = async () => {
    try {
        // Step 1: Fetch account summary
        const FundedAccountsFor5k = await getUsersWithFundedAccounts50kAndChallenge();

        // Step 2: Create an array of promises and resolve them using Promise.all
        const resultArrayPromises = FundedAccountsFor5k.flatMap(user => {
            return user.mt5Accounts.map(async (mt5Account) => {
                const matchingAccount = await getSingleAccountSummery(mt5Account.account);

                if (matchingAccount.length > 0) {
                    const accountSummary = matchingAccount[0];
                    const equity = accountSummary.equity;

                    // Assuming mt5Account.accountSize holds the account size
                    if (equity > mt5Account.challengeStageData.accountSize) {
                        const disabledAccount = await getDisabledAccount(accountSummary.login);

                        if (!disabledAccount) {
                            // If the account is not disabled, return the account details
                            return {
                                challengeName: mt5Account.challengeStageData.challengeName, // Assuming this is the challenge name field
                                accountNumber: accountSummary.login,
                                balance: accountSummary.balance,
                                profit: accountSummary.profit,
                                equity: accountSummary.equity
                            };
                        }
                    }
                }
                return null;
            });
        });

        // Wait for all promises to resolve
        const resultArray = (await Promise.all(resultArrayPromises)).filter(account => account !== null);

        // Step 3: Sort by equity in descending order and slice the top 20
        const top20Accounts = resultArray
            .sort((a, b) => b.equity - a.equity) // Sort accounts by equity in descending order
            .slice(0, 20); // Take the top 20 accounts

        // console.log(top20Accounts); // Output the top 20 accounts based on equity
        return top20Accounts;

    } catch (error) {
        console.error("Error fetching account data:", error);
        throw error;
    }
};
const get100kAccount = async () => {
    try {
        // Step 1: Fetch account summary
        const FundedAccountsFor5k = await getUsersWithFundedAccounts100kAndChallenge();

        // Step 2: Create an array of promises and resolve them using Promise.all
        const resultArrayPromises = FundedAccountsFor5k.flatMap(user => {
            return user.mt5Accounts.map(async (mt5Account) => {
                const matchingAccount = await getSingleAccountSummery(mt5Account.account);

                if (matchingAccount.length > 0) {
                    const accountSummary = matchingAccount[0];
                    const equity = accountSummary.equity;

                    // Assuming mt5Account.accountSize holds the account size
                    if (equity > mt5Account.challengeStageData.accountSize) {
                        const disabledAccount = await getDisabledAccount(accountSummary.login);

                        if (!disabledAccount) {
                            // If the account is not disabled, return the account details
                            return {
                                challengeName: mt5Account.challengeStageData.challengeName, // Assuming this is the challenge name field
                                accountNumber: accountSummary.login,
                                balance: accountSummary.balance,
                                profit: accountSummary.profit,
                                equity: accountSummary.equity
                            };
                        }
                    }
                }
                return null;
            });
        });

        // Wait for all promises to resolve
        const resultArray = (await Promise.all(resultArrayPromises)).filter(account => account !== null);

        // Step 3: Sort by equity in descending order and slice the top 20
        const top20Accounts = resultArray
            .sort((a, b) => b.equity - a.equity) // Sort accounts by equity in descending order
            .slice(0, 20); // Take the top 20 accounts

        // console.log(top20Accounts); // Output the top 20 accounts based on equity
        return top20Accounts;

    } catch (error) {
        console.error("Error fetching account data:", error);
        throw error;
    }
};
const get200kAccount = async () => {
    try {
        // Step 1: Fetch account summary
        const FundedAccountsFor5k = await getUsersWithFundedAccounts200kAndChallenge();

        // Step 2: Create an array of promises and resolve them using Promise.all
        const resultArrayPromises = FundedAccountsFor5k.flatMap(user => {
            return user.mt5Accounts.map(async (mt5Account) => {
                const matchingAccount = await getSingleAccountSummery(mt5Account.account);

                if (matchingAccount.length > 0) {
                    const accountSummary = matchingAccount[0];
                    const equity = accountSummary.equity;

                    // Assuming mt5Account.accountSize holds the account size
                    if (equity > mt5Account.challengeStageData.accountSize) {
                        const disabledAccount = await getDisabledAccount(accountSummary.login);

                        if (!disabledAccount) {
                            // If the account is not disabled, return the account details
                            return {
                                challengeName: mt5Account.challengeStageData.challengeName, // Assuming this is the challenge name field
                                accountNumber: accountSummary.login,
                                balance: accountSummary.balance,
                                profit: accountSummary.profit,
                                equity: accountSummary.equity
                            };
                        }
                    }
                }
                return null;
            });
        });
        
        // Wait for all promises to resolve
        const resultArray = (await Promise.all(resultArrayPromises)).filter(account => account !== null);

        // Step 3: Sort by equity in descending order and slice the top 20
        const top20Accounts = resultArray
            .sort((a, b) => b.equity - a.equity) // Sort accounts by equity in descending order
            .slice(0, 20); // Take the top 20 accounts

        // console.log(top20Accounts); // Output the top 20 accounts based on equity
        return top20Accounts;

    } catch (error) {
        console.error("Error fetching account data:", error);
        throw error;
    }
};
const get25kAccount = async () => {
    try {
        // Step 1: Fetch account summary
        const FundedAccountsFor5k = await getUsersWithFundedAccounts25kAndChallenge();

        // Step 2: Create an array of promises and resolve them using Promise.all
        const resultArrayPromises = FundedAccountsFor5k.flatMap(user => {
            return user.mt5Accounts.map(async (mt5Account) => {
                const matchingAccount = await getSingleAccountSummery(mt5Account.account);

              
                if (matchingAccount.length > 0) {
                    const accountSummary = matchingAccount[0];
                    const equity = accountSummary.equity;

                    // Assuming mt5Account.accountSize holds the account size
                    if (equity > mt5Account.challengeStageData.accountSize) {
                        const disabledAccount = await getDisabledAccount(accountSummary.login);

                        if (!disabledAccount) {
                            // If the account is not disabled, return the account details
                            return {
                                challengeName: mt5Account.challengeStageData.challengeName, // Assuming this is the challenge name field
                                accountNumber: accountSummary.login,
                                balance: accountSummary.balance,
                                profit: accountSummary.profit,
                                equity: accountSummary.equity
                            };
                        }
                    }
                }
                return null;
            });
        });

        // Wait for all promises to resolve
        const resultArray = (await Promise.all(resultArrayPromises)).filter(account => account !== null);

        // Step 3: Sort by equity in descending order and slice the top 20
        const top20Accounts = resultArray
            .sort((a, b) => b.equity - a.equity) // Sort accounts by equity in descending order
            .slice(0, 20); // Take the top 20 accounts

        // console.log(top20Accounts); // Output the top 20 accounts based on equity
        return top20Accounts;

    } catch (error) {
        console.error("Error fetching account data:", error);
        throw error;
    }
};

module.exports = {
    get5kAccount, get10kAccount, get25kAccount, get200kAccount, get100kAccount, get50kAccount
};
