const { saveBannedEmail, getAllBannedEmails } = require("./banEmail.services");

const banEmailController = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        const savedEmail = await saveBannedEmail(email);
        return res.status(201).json({ message: 'Email banned successfully', data: savedEmail });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

// Controller function to retrieve all banned emails
const getAllBannedEmailsController = async (req, res) => {
    try {
        const bannedEmails = await getAllBannedEmails();
        return res.status(200).json({ message: 'Banned emails retrieved successfully', data: bannedEmails });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = { banEmailController,getAllBannedEmailsController };