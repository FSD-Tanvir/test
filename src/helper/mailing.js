const nodemailer = require("nodemailer");
const fs = require("node:fs");
const path = require("node:path");

// Create a transporter object using the default SMTP transport with Gmail service
const transporter = nodemailer.createTransport({
	// service: 'gmail',
	host: "smtp-relay.brevo.com",

	auth: {
		user: process.env.user, // Your Gmail address from environment variables
		pass: process.env.pass, // Your Gmail password from environment variables
	},
});

/**
 * Function to send an email with an OTP
 * @param {string} to - Recipient email address
 * @param {string} subject - Subject of the email
 * @param {string} text - Text content of the email
 * @returns {Promise} - Promise representing the result of the email send operation
 */
const sendMailForOTP = async (to, subject, text, html = "") => {
	const mailOptions = {
		from: "Contact@foxx-funded.com", // Sender address
		// from: process.env.user, // Sender address

		to, // Recipient address
		subject, // Subject line
		text, // Plain text body
		html, // HTML body
	};

	// Log mail options for debugging purposes

	try {
		// Send mail using the transporter object
		const info = await transporter.sendMail(mailOptions);
		return info; // Return the result of the send operation
	} catch (error) {
		// Throw error if sending fails
		// biome-ignore lint/complexity/noUselessCatch: <explanation>
		throw error;
	}
};

const sendEmailSingleRecipient = async (to, subject, text, html = "") => {
	const mailOptions = {
		from: "Contact@foxx-funded.com", // sender address
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

const sendEmailWithAttachment = async (to, subject, text, html = "", attachments = []) => {
	const mailOptions = {
		from: "Contact@foxx-funded.com", // Sender address
		to, // List of receivers
		subject, // Subject line
		text, // Plain text body
		html, // HTML body
		attachments, // Attachments
	};

	try {
		const info = await transporter.sendMail(mailOptions);
		return info.response;
	} catch (error) {
		throw error;
	}
};

const sendEmailWithPdf = async (to, subject, textContent) => {
	try {
		// Read the PDF file
		const pdfData = fs.readFileSync("../../src/assets/Trader_Agreement.pdf");

		// Define email options
		const mailOptions = {
			from: "Contact@foxx-funded.com", // Sender address
			// from: process.env.user, // Sender address
			to: to, // list of receivers
			subject: subject, // Subject line
			text: textContent, // Plain text body
			attachments: [
				{
					filename: path.basename(pdfPath), // Extracts the filename from the path
					content: pdfData,
				},
			],
		};

		// Send mail with defined transport object
		const info = await transporter.sendMail(mailOptions);
		return info;
	} catch (error) {
		throw new Error(`Failed to send email: ${error.message}`);
	}
};

// Export the sendMailForOTP function as a module
module.exports = {
	sendMailForOTP,
	sendEmailSingleRecipient,
	sendEmailWithPdf,
	sendEmailWithAttachment,
};
