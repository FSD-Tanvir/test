// utils/zapierService.js
const axios = require("axios");

const ZAPIER_WEBHOOK_URL = "https://hooks.zapier.com/hooks/catch/22372245/2cj1ham/";

/**
 * Sends a payload to Zapier webhook
 * @param {Object} payload - The data to send to Zapier
 * @returns {Promise<Object>} - Response from Zapier
 */
const sendToZapier = async (payload) => {
    try {
        const response = await axios.post(ZAPIER_WEBHOOK_URL, payload, {
            headers: {
                "Content-Type": "application/json",
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error sending data to Zapier:", error.message);
        throw error;
    }
};

module.exports = { sendToZapier };
