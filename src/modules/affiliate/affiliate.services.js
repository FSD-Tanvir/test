// services/affiliate.services.js
const { sendEmailSingleRecipient } = require("../../helper/mailing.js");
const MAffiliate = require("./affiliate.schema.js");

const createAffiliate = async (affiliateData) => {
	const affiliate = new MAffiliate(affiliateData);
	return await affiliate.save();
};

// Function to find an affiliate by referralCode and increment the click count
const clickUpdateByReferralCode = async (referralCode) => {
	// Find the affiliate by their referralCode
	const affiliate = await MAffiliate.findOne({ referralCode });

	if (!affiliate) {
		throw new Error("Affiliate not found");
	}

	// Increment the click count
	affiliate.click += 1;

	// Save the updated affiliate document
	return await affiliate.save();
};

const getAffiliateData = async (email) => {
	const affiliate = await MAffiliate.findOne({ email });
	return affiliate;
};

const getAllAffiliates = async () => {
	const affiliates = await MAffiliate.find();
	return affiliates;
};

// Function to find an affiliate by referral code
const getAffiliateByReferralCode = async (referralCode) => {
    try {
        const affiliate = await MAffiliate.findOne({ referralCode });
        if (!affiliate) {
            throw new Error('Affiliate not found');
        }
        return affiliate;
    } catch (error) {
        throw error;
    }
};

const updateAffiliate = async (id, affiliateData) => {
	try {
		// Find the current affiliate data
		const currentAffiliate = await MAffiliate.findById(id);

		if (!currentAffiliate) {
			console.log(`No affiliate found with ID: ${id}`);
			return null; // or handle the case as needed
		}

		// Update the affiliate data
		const updatedAffiliate = await MAffiliate.findByIdAndUpdate(id, affiliateData, {
			new: true,
			runValidators: true, // This option ensures that validation rules are applied
		});

		// Check if status has changed to 'approved' and was not previously 'approved'
		if (updatedAffiliate.status === "approved" && currentAffiliate.status !== "approved") {
			const emailSubject = `Affiliate Program Approval – Welcome to Summit Strike Capital`;
			const emailBody = `
                <p>Dear ${updatedAffiliate.fullName},</p>
                <p>Congratulations! We are excited to inform you that your affiliate application for Summit Strike Capital has been approved.</p>
                <p>We look forward to partnering with you and helping you succeed as a valued affiliate. With our exclusive financial services and tools, you'll be well-equipped to promote and earn through our program.</p>
                <p><strong>Next Steps:</strong></p>
                <ol>
                    <li><strong>Here is your referral link:</strong> <a href="${updatedAffiliate.referralLink}">${updatedAffiliate.referralLink}</a></li>
                <p>If you have any questions or need assistance, don’t hesitate to reach out to our affiliate support team at <a href="mailto:support@summitstrike.com">support@summitstrike.com</a>.</p>
                <p>Once again, welcome aboard! We’re excited to see the results we can achieve together.</p>
                <p>Best regards, <br>Affiliate Manager<br>Summit Strike Capital</p>
            `;

			// Send the approval email
			await sendEmailSingleRecipient(
				updatedAffiliate.email,
				emailSubject,
				"Your affiliate application has been approved",
				emailBody
			);
		}

		return updatedAffiliate;
	} catch (error) {
		console.error("Error updating affiliate:", error);
		throw error; // rethrow or handle the error as needed
	}
};


module.exports = {
	createAffiliate,
	clickUpdateByReferralCode,
	getAffiliateData,
	getAllAffiliates,
	updateAffiliate,
	getAffiliateByReferralCode
};
