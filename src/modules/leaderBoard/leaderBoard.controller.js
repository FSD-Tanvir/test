const { get5kAccount,get10kAccount, get25kAccount, get50kAccount, get100kAccount, get200kAccount } = require("./leaderBoard.services");

const fetchTop5kAccounts = async (req, res) => {
    try {
        const topAccounts = await get5kAccount();
        return res.status(200).json({
            success: true,
            data: topAccounts,
        });
    } catch (error) {
        console.error("Error in fetching accounts:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching accounts. Please try again later.",
        });
    }
};
const fetchTop25kAccounts = async (req, res) => {
    try {
        const topAccounts = await get25kAccount();
        return res.status(200).json({
            success: true,
            data: topAccounts,
        });
    } catch (error) {
        console.error("Error in fetching accounts:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching accounts. Please try again later.",
        });
    }
};
const fetchTop50kAccounts = async (req, res) => {
    try {
        const topAccounts = await get50kAccount();
        return res.status(200).json({
            success: true,
            data: topAccounts,
        });
    } catch (error) {
        console.error("Error in fetching accounts:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching accounts. Please try again later.",
        });
    }
};
const fetchTop100kAccounts = async (req, res) => {
    try {
        const topAccounts = await get100kAccount();
        return res.status(200).json({
            success: true,
            data: topAccounts,
        });
    } catch (error) {
        console.error("Error in fetching accounts:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching accounts. Please try again later.",
        });
    }
};
const fetchTop200kAccounts = async (req, res) => {
    try {
        const topAccounts = await get200kAccount();
        return res.status(200).json({
            success: true,
            data: topAccounts,
        });
    } catch (error) {
        console.error("Error in fetching accounts:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching accounts. Please try again later.",
        });
    }
};
const fetchTop10kAccounts = async (req, res) => {
    try {
        const topAccounts = await get10kAccount();
        return res.status(200).json({
            success: true,
            data: topAccounts,
        });
    } catch (error) {
        console.error("Error in fetching accounts:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching accounts. Please try again later.",
        });
    }
};

module.exports = {
	fetchTop5kAccounts,fetchTop10kAccounts,fetchTop25kAccounts,fetchTop50kAccounts,fetchTop100kAccounts,fetchTop200kAccounts
};