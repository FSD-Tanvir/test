const { get5kAccount, get10kAccount, get25kAccount, get50kAccount, get100kAccount, get200kAccount,
    get10kAccountTwoStep, get25kAccountTwoStep, get50kAccountTwoStep, get100kAccountTwoStep, get200kAccountTwoStep, get300kAccount,
    get300kAccountTwoStep, get10kAccountIF, get25kAccountIF, get50kAccountIF, get100kAccountIF, get5kAccountIF


} = require("./leaderBoard.services");

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
const fetchTop300kAccounts = async (req, res) => {
    try {
        const topAccounts = await get300kAccount();
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







const fetchTop25kAccountsTwoStep = async (req, res) => {
    try {
        const topAccounts = await get25kAccountTwoStep();
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
const fetchTop50kAccountsTwoStep = async (req, res) => {
    try {
        const topAccounts = await get50kAccountTwoStep();
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
const fetchTop100kAccountsTwoStep = async (req, res) => {
    try {
        const topAccounts = await get100kAccountTwoStep();
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
const fetchTop200kAccountsTwoStep = async (req, res) => {
    try {
        const topAccounts = await get200kAccountTwoStep();
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
const fetchTop10kAccountsTwoStep = async (req, res) => {
    try {
        const topAccounts = await get10kAccountTwoStep();
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
const fetchTop300kAccountsTwoStep = async (req, res) => {
    try {
        const topAccounts = await get300kAccountTwoStep();
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


const fetchTop25kAccountsIF = async (req, res) => {
    try {
        const topAccounts = await get25kAccountIF();
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


const fetchTop50kAccountsIF = async (req, res) => {
    try {
        const topAccounts = await get50kAccountIF();
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
const fetchTop100kAccountsIF = async (req, res) => {
    try {
        const topAccounts = await get100kAccountIF();
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
const fetchTop10kAccountsIF = async (req, res) => {
    try {
        const topAccounts = await get10kAccountIF();
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
const fetchTop5kAccountsIF = async (req, res) => {
    try {
        const topAccounts = await get5kAccountIF();
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
    fetchTop5kAccounts, fetchTop10kAccounts, fetchTop25kAccounts, fetchTop50kAccounts, fetchTop100kAccounts, fetchTop200kAccounts, fetchTop300kAccounts,
    fetchTop10kAccountsTwoStep, fetchTop25kAccountsTwoStep, fetchTop50kAccountsTwoStep, fetchTop100kAccountsTwoStep, fetchTop200kAccountsTwoStep,
    fetchTop300kAccountsTwoStep,
    fetchTop10kAccountsIF, fetchTop25kAccountsIF, fetchTop50kAccountsIF, fetchTop100kAccountsIF, fetchTop5kAccountsIF
};