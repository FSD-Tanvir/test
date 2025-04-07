// services/affiliate.services.js
const MAffiliate = require("./affiliate.schema.js");
const nodemailer = require("nodemailer");




const createAffiliate = async (affiliateData) => {
	const affiliate = new MAffiliate(affiliateData);

	const savedAffiliateRequest = await affiliate.save();

	const htmlTemplate = `
	<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #DB8112; border-radius: 10px; background-color: #ffffff; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
	  <div style="text-align: center; margin-bottom: 15px;">
		<img src="https://i.ibb.co.com/34qjbqp/Fox-Funded-Logo.png" alt="Company Logo" style="max-width: 120px; height: auto;">
	  </div>
  
	  <p style="font-size: 16px; color: #333; text-align: left; margin-bottom: 6px;">
		Hi Admin,
	  </p>
  
	  <p style="font-size: 16px; color: #333; text-align: left; margin-bottom: 6px;">
		You have received a new affiliate request. Please find the details below:
	  </p>
  
	  <p style="font-size: 16px; color: #333; text-align: left; margin-bottom: 5px;">
		<strong>Email:</strong> ${savedAffiliateRequest?.email}
	  </p>
  
	  <p style="font-size: 16px; color: #333; text-align: left; margin-bottom: 10px;">
		<strong>WhatsApp:</strong> ${savedAffiliateRequest?.whatsAppNumber}
	  </p>
  
	  <p style="font-size: 16px; color: #333; text-align: left;">
		Please review and take the necessary action.
	  </p>
  
	  <p style="font-size: 16px; color: #333; text-align: left; margin-top: 10px;">
		Best regards,<br>
		<strong>Foxxx Funded</strong>
	  </p>
  	<p style="font-size: 14px; color: #777; margin-top: 20px;">
		  If you have any questions, feel free to
		  <a href="https://foxx-funded.com/contact-us" style="color: #DB8112; text-decoration: none; font-weight: bold;">
			contact our support team
		  </a>.
		</p>
	  <div style="margin-top: 20px; text-align: center;">
		<a href="https://t.me/+2QVq5aChxiBlOWFk" style="margin-right: 10px;">
		  <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUQ9pRZvmScqICRjNBvAHEjIawnL1erY-AcQ&s" alt="Telegram" style="width: 32px; height: 32px;">
		</a>
	  </div>
	</div>
  
	<style>
	  @media only screen and (max-width: 600px) {
		div[style] {
		  padding: 10px !important;
		}
		p[style], a[style] {
		  font-size: 16px !important;
		}
	  }
	</style>
  `;

	const transporter = nodemailer.createTransport({
		// service: 'gmail',
		host: "smtp-relay.brevo.com",

		auth: {
			user: process.env.user, // Your Gmail address from environment variables
			pass: process.env.pass, // Your Gmail password from environment variables
		},
	});

	const sendEmailSingleRecipientFromCustomer = async (to, subject, text, html = "") => {
		const mailOptions = {
			from: savedAffiliateRequest?.email, // sender address
			// from: process.env.user, // Sender address
			to, // list of receivers
			subject, // Subject line
			text, // plain text body
			html, // html body
		};

		try {
			const info = await transporter.sendMail(mailOptions);
			return info.response;
		} catch (error) {
			throw error;
		}
	};
	if (savedAffiliateRequest) {
		await sendEmailSingleRecipientFromCustomer(
			"Contact@foxx-funded.com",
			`You have received a new affiliate request. ${savedAffiliateRequest.email}`,
			htmlTemplate
		);
	}


	return savedAffiliateRequest;
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
			throw new Error("Affiliate not found");
		}
		return affiliate;
	} catch (error) {
		throw error;
	}
};

const updateAffiliate = async (id, affiliateData) => {
	try {
		const currentAffiliate = await MAffiliate.findById(id);

		if (!currentAffiliate) {
			console.log(`No affiliate found with ID: ${id}`);
			return null;
		}
		const updatedAffiliate = await MAffiliate.findByIdAndUpdate(id, affiliateData, {
			new: true,
			runValidators: true,
		});

		// Check if status has changed to 'approved' and was not previously 'approved'
		if (updatedAffiliate.status === "approved" && currentAffiliate.status !== "approved") {
			const htmlTemplate = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #DB8112; border-radius: 10px; background-color: #ffffff; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); text-align: center;">
		<div style="text-align: center; margin-bottom: 15px;">
		  <img src="https://i.ibb.co.com/34qjbqp/Fox-Funded-Logo.png" alt="Company Logo" style="max-width: 120px; height: auto;">
		</div>
		<h2 style="color: #DB8112; text-align: center; margin-bottom: 20px;">Dear ${updatedAffiliate.fullName},</h2>
		<p style="font-size: 16px; color: #333; text-align: center; margin-bottom: 10px;">
		 Congratulations! We are excited to inform you that your affiliate application for Fox Funded has been approved.
		</p>
		<p style="font-size: 20px; color: #333; font-weight: bold; text-align: center; margin-bottom: 20px;">
		 We look forward to partnering with you and helping you succeed as a valued affiliate. With our exclusive financial services and tools, you'll be well-equipped to promote and earn through our program.
		</p>
		<p style="font-size: 16px; color: #333; text-align: center; margin-bottom: 10px;">
		  Next Steps:
		</p>
		</p>
		<p style="font-size: 16px; color: #333; margin-bottom: 5px; text-align: center;">
		  <strong>Here is your referral link::</strong> <span style="color: #DB8112; font-weight: bold;"><a href="${updatedAffiliate.referralLink}">${updatedAffiliate.referralLink}</a></span>
		</p>
		<div style="text-align: center; margin-bottom: 20px;">
		  <a href="https://foxx-funded.com/login" style="display: inline-block; padding: 12px 25px; background-color: #DB8112; color: #fff; text-decoration: none; border-radius: 5px; font-size: 18px; font-weight: bold;">
			Login to your affiliate account and see your affiliate dashboard
		  </a>
		</div>
		<p style="font-size: 14px; color: #777; margin-top: 20px;">
		  If you have any questions, feel free to
		  <a href="https://foxx-funded.com/contact-us" target="_blank" rel="noopener noreferrer" style="color: #DB8112; text-decoration: none; font-weight: bold;">
			contact our support team
		  </a>.
		</p>
		<div style="margin-top: 20px; text-align: center;">
		  <a href="https://t.me/+2QVq5aChxiBlOWFk" style="margin-right: 10px;">
			<img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUQ9pRZvmScqICRjNBvAHEjIawnL1erY-AcQ&s" alt="Telegram" style="width: 32px; height: 32px;">
		  </a>
		</div>
	  </div>
	  
	  <style>
		@media only screen and (max-width: 600px) {
		  div[style] {
			padding: 10px !important;
		  }
		  h2[style] {
			font-size: 22px !important;
		  }
		  p[style], a[style] {
			font-size: 16px !important;
		  }
		  a[style] {
			padding: 10px 20px !important;
		  }
		}
	  </style>
	  `;
			await sendEmailSingleRecipient(
				updatedAffiliate.email,
				"Your affiliate application has been approved",
				htmlTemplate
			);
		}

		return updatedAffiliate;
	} catch (error) {
		console.error("Error updating affiliate:", error);
		throw error;
	}
};

module.exports = {
	createAffiliate,
	getAffiliateData,
	getAllAffiliates,
	updateAffiliate,
	getAffiliateByReferralCode,
};
