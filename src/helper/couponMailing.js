const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.user,  // Your Gmail address from environment variables
        pass: process.env.pass   // Your Gmail password from environment variables
    }
});

const sendMail = (to, subject, text) => {
    const mailOptions = {
        from: process.env.user,
        to,
        subject,
        text
    };

    return transporter.sendMail(mailOptions);
};

module.exports = sendMail;