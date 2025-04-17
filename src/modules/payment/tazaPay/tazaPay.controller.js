const MTazaPay = require("./tazaPay.schema");
const {
    createTazaPayCheckout,
    getTazaPayCheckout,
    checkMt5AccountService,
} = require("./tazaPay.services");

const createCheckout = async (req, res) => {
    const {
        customerName,
        customerEmail,
        customerCountry,
        amount,
        invoiceCurrency,
        transactionDescription,
        orderId,
    } = req.body;

    try {
        // Call the service to create a checkout in Tazapay
        const tazapayResponse = await createTazaPayCheckout({
            customerName,
            customerEmail,
            customerCountry,
            amount,
            invoiceCurrency: invoiceCurrency || "USD", // Default to USD if not provided
            transactionDescription,
            orderId,
        });

        // Respond with Tazapay's response
        res.status(200).json({
            message: "Checkout created successfully",
            data: tazapayResponse,
        });
    } catch (error) {
        console.error("Error creating checkout:", error);
        res.status(500).json({ message: "Error creating checkout", error: error.message });
    }
};

const sendToZapierHandler = async (req, res) => {
    try {
        const result = await sendToZapier(req.body);
        return res.status(200).json({ message: "Data sent to Zapier successfully", data: result });
    } catch (error) {
        console.error("Error sending data to Zapier:", error);
        return res
            .status(500)
            .json({ message: "Error sending data to Zapier", error: error.message });
    }
};

const getCheckout = async (req, res) => {
    const { orderId } = req.params;

    try {
        const result = await getTazaPayCheckout(orderId);
        if (!result) {
            return res.status(404).json({ message: "Checkout not found" });
        }
        return res.status(200).json({ message: "Checkout fetched successfully", data: result });
    } catch (error) {
        console.error("Error fetching checkout:", error);
        return res.status(500).json({ message: "Error fetching checkout", error: error.message });
    }
};

const checkMt5Account = async (req, res) => {
    const { orderId } = req.params;

    try {
        const result = await checkMt5AccountService(orderId);
        if (!result) {
            return res.status(404).json({ message: "Checkout not found" });
        }
        return res.status(200).json({ message: "Account data fetched successfully", data: result });
    } catch (error) {
        console.error("Error fetching data:", error);
        return res.status(500).json({ message: "Error fetching data", error: error.message });
    }
};

module.exports = { createCheckout, getCheckout, checkMt5Account, sendToZapierHandler };

// Deceyven90!
