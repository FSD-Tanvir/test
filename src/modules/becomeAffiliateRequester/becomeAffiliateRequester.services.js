const MBecomeAffiliateRequester = require("./becomeAffiliateRequester.schema");
const nodemailer = require("nodemailer")

const createRequester = async (data) => {
    const newRequester = new MBecomeAffiliateRequester(data);
    const savedRequester = await newRequester.save();
    console.log("savedRequester", savedRequester);
    const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 15px; border: 2px solid #DB8112; border-radius: 10px; background-color: #ffffff; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
      <div style="text-align: center; margin-bottom: 10px;">
        <img src="https://i.ibb.co.com/34qjbqp/Fox-Funded-Logo.png" alt="Company Logo" style="max-width: 100px; height: auto;">
      </div>
  
      <p style="font-size: 15px; color: #333; margin: 0 0 5px;">
        Hi Admin,
      </p>
  
      <p style="font-size: 15px; color: #333; margin: 0 0 2px;">
        You have received a new affiliate request. Please find the details below:
      </p>
  
      <p style="font-size: 15px; color: #333; margin: 0 0 2px;">
        <strong>Email:</strong> ${savedRequester?.email}
      </p>
  
      <p style="font-size: 15px; color: #333; margin: 0 0 4px;">
        <strong>WhatsApp:</strong> ${savedRequester?.whatsAppNumber}
      </p>
  
      <p style="font-size: 15px; color: #333; margin: 0 0 4px;">
        Please review and take the necessary action.
      </p>
  
      <p style="font-size: 15px; color: #333; margin: 0 0 5px;">
        Best regards,<br><strong>Foxxx Funded</strong>
      </p>
  
      <p style="font-size: 13px; color: #777; margin: 8px 0 5px;">
        If you have any questions, feel free to
        <a href="https://foxx-funded.com/contact-us" style="color: #DB8112; text-decoration: none; font-weight: bold;">contact our support team</a>.
      </p>
  
      <div style="text-align: center;">
        <a href="https://t.me/+2QVq5aChxiBlOWFk" style="margin-right: 10px;">
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUQ9pRZvmScqICRjNBvAHEjIawnL1erY-AcQ&s" alt="Telegram" style="width: 28px; height: 28px;">
        </a>
      </div>
    </div>
  
    <style>
      @media only screen and (max-width: 600px) {
        div[style] { padding: 10px !important; }
        p[style], a[style] { font-size: 15px !important; }
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
            from: savedRequester?.email, // sender address
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
    if (savedRequester) {
        await sendEmailSingleRecipientFromCustomer(
            "Contact@foxx-funded.com",
            `You have received a new affiliate request. `,
            htmlTemplate
        );
    }


    return savedRequester;
};

module.exports = { createRequester };
