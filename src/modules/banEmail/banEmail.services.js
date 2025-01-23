const banEmailSchema = require("./banEmail.schema");


// Function to save a new email to the database
const saveBannedEmail = async (email) => {
    try {
        const newBan = new banEmailSchema({ email });
        await newBan.save();
        return newBan;
    } catch (error) {
        throw new Error(`Could not save email: ${error.message}`);
    }
}

// Function to get all banned emails from the database
const getAllBannedEmails = async () => {
    try {
        const bannedEmails = await banEmailSchema.find({});
        return bannedEmails;
    } catch (error) {
        throw new Error(`Could not retrieve emails: ${error.message}`);
    }
};


module.exports = { saveBannedEmail,getAllBannedEmails };
