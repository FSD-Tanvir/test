const { createRequester } = require("./becomeAffiliateRequester.services");


const createAffiliateRequester = async (req, res) => {
    try {
        const { fullName, email, whatsAppNumber } = req.body;

        // Validate manually if needed
        if (whatsAppNumber === undefined || whatsAppNumber === null) {
            return res.status(400).json({
                success: false,
                message: "whatsAppNumber is required"
            });
        }

        const requester = await createRequester({ fullName, email, whatsAppNumber });
        res.status(201).json({
            success: true,
            message: "Affiliate request submitted successfully",
            data: requester
        });
    } catch (error) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `${field} already exists`
            });
        }

        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message
        });
    }
};


module.exports = { createAffiliateRequester };
