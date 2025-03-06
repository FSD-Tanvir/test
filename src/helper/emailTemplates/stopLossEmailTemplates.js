const stopLossDisabledEmailTemplate = (account, accountDetails) => {
	const tickets = accountDetails.tickets.join(", ");
	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Breach Notification</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .email-container {
            background-color: #ffffff;
            border-radius: 8px;
            max-width: 800px;
            margin: 0 auto;
            padding: 10px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
            background-color: #d32f2f;
            color: #ffffff;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            position: relative; /* Allows positioning of child elements */
        }
        .logo-container {
            margin-bottom: 15px; /* Space between the logo and the text */
            text-align: center; /* Center the logo */
        }
        .logo {
            max-width: 150px; /* Limit the logo size */
            height: auto; /* Maintain aspect ratio */
            display: block; /* Remove extra space below the image */
            margin: 0 auto; /* Center the logo horizontally */
        }
        .animated-text {
            margin: 0; /* Remove default margins */
            line-height: 1.4; /* Improve spacing between lines */
        }
        .header h1.animated-text {
            font-size: 24px; /* Larger font size for the main heading */
            font-weight: bold;
            margin-bottom: 10px; /* Space between the heading and subheading */
        }
        .header p.animated-text {
            font-size: 16px; /* Smaller font size for the subheading */
            font-weight: normal;
            color: #ffccbc; /* Light red for contrast */
        }
        .content {
            padding: 20px;
            font-size: 16px;
            line-height: 1.6;
            color: #444;
        }
        .highlight {
            background-color: #ffebee;
            color: #d32f2f;
            border-left: 4px solid #d32f2f;
            padding: 10px;
            margin: 20px 0;
            border-radius: 4px;
            font-weight: bold;
        }
        .tickets {
            font-size: 12px;
            line-height: 1.4;
            max-height: 150px;
            overflow-y: auto;
            word-break: break-word;
            padding: 5px;
            background-color: #ffcdd2; /* Updated to light red */
            border: 1px solid #d32f2f; /* Red border to match the theme */
            border-radius: 4px;
            color: #d32f2f; /* Red text for better readability */
        }
        .cta-button {
            display: inline-block;
            background-color: #DB8112;
            color: #ffffff;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 20px;
        }
        .cta-button:hover {
            background-color: #DB8112;
        }
        .footer {
            text-align: center;
            font-size: 12px;
            color: #777;
            margin-top: 20px;
        }
        .footer a {
            color: #DB8112;
            text-decoration: none;
        }
        .footer a:hover {
            text-decoration: underline;
        }
        .social-links {
            margin-top: 20px;
            display: flex;
            justify-content: center;
            gap: 20px;
        }
        .social-links img {
            width: 32px;
            height: 32px;
        }
        .consequences {
            background-color: #ffebee; /* Light red background */
            border: 2px solid #d32f2f; /* Red border */
            border-radius: 8px; /* Rounded corners */
            padding: 15px; /* Padding inside the box */
            margin: 20px 0; /* Margin above and below the section */
            font-size: 16px; /* Larger font size for emphasis */
            line-height: 1.6; /* Improved readability */
            color: #d32f2f; /* Red text for contrast */
        }
        .consequences strong {
            color: #d32f2f; /* Ensure bold text is red */
            font-weight: bold; /* Bold font weight */
        }
        .consequences ul {
            margin-top: 10px; /* Space between the heading and the list */
            padding-left: 20px; /* Indentation for the list */
        }
        .consequences li {
            margin-bottom: 8px; /* Space between list items */
            color: #d32f2f; /* Red text for list items */
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header Section -->
        <div class="header">
            <div class="logo-container">
                <img src="https://i.ibb.co.com/34qjbqp/Fox-Funded-Logo.png" alt="Fox Funded Logo" class="logo">
            </div>
            <h1 class="animated-text">Your Account Has Been Disabled</h1>
            <p class="animated-text">Due to violating the Stop Loss Risk rule</p>
        </div>

        <!-- Content Section -->
        <div class="content">
            <p>Dear Trader,</p>
            <p>Following multiple warnings regarding the failure to comply with our stop-loss policy, we regret to inform you that your trading account with Foxx Funded is now permanently terminated due to continued violations.</p>

            <p style="font-size: 20px; font-weight: bold; color: #d32f2f; margin-top: 20px; margin-bottom: 15px; text-align: center;">
    Final Breach Details
</p>
<div class="highlight">
    <p><strong>Account Number:</strong> ${account}</p>
    <div>
         <p><strong>Trade Tickets (Breached Stop-Loss Risk):</strong></p>
        <div class="tickets">${tickets}</div>
    </div>
</div>

            <div class="consequences">
                <p><strong>Consequences of This Termination</strong></p>
                <p><strong>Effective immediately:</strong></p>
                <ul style="margin-left: 20px; list-style-type: disc;">
                    <li>Your trading account is permanently closed and will no longer be accessible.</li>
                    <li>Any profits from non-compliant trades have been deducted in accordance with our policies.</li>
                    <li>You can try to pass a new challenge with promo code « RETRY40 » -40% Off</li>
                </ul>
            </div>

            <p>This decision is final and irreversible. We urge all traders to follow risk management guidelines to ensure a fair and responsible trading environment.</p>

            <p>For further details on our policies and guidelines, please refer to our <a href="https://foxx-funded.com/faqs">FAQ</a> article.</p>

            <p>Best regards,</p>
            <p>Fox Funded Risk Team</p>

            <p style="font-size: 14px; color: #777; margin-top: 20px;">
                If you have any questions, feel free to
                <a href="https://foxx-funded.com/contact-us" style="color: #DB8112; text-decoration: none; font-weight: bold;">
                    contact us or contact our support team
                </a>.
            </p>

            <div class="social-links">
                <a href="https://t.me/+2QVq5aChxiBlOWFk">
                    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUQ9pRZvmScqICRjNBvAHEjIawnL1erY-AcQ&s" alt="Telegram">
                </a>
            </div>
        </div>

        <!-- Footer Section -->
        <div class="footer">
            <p>@2024 Fox Funded All Rights Reserved.</p>
        </div>
    </div>
</body>
</html>`;
};

// Function to send the warning email 1
const sendStopLossWarningEmail1 = (account, accountDetails) => {
	const tickets = accountDetails.tickets.join(", ");

	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Breach Notification</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            background-color: #ffff; /* Light red background */
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .email-container {
            background-color: #ffffff;
            border-radius: 12px;
            max-width: 600px;
            margin: 0 auto;
            padding: 0;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
            border: 2px solid #ffa726; /* Orange border for urgency */
            overflow: hidden;
        }
        .header {
            background-color: #f57c00; /* Strong orange for header */
            color: #ffffff;
            padding: 25px 20px;
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            border-bottom: 2px solid #ffa726;
        }
        .logo-container {
            margin-bottom: 15px; /* Space between the logo and the text */
            text-align: center; /* Center the logo */
        }
        .logo {
            max-width: 150px; /* Limit the logo size */
            height: auto; /* Maintain aspect ratio */
            display: block; /* Remove extra space below the image */
            margin: 0 auto; /* Center the logo horizontally */
        }
        .animated-text {
            margin: 0; /* Remove default margins */
            line-height: 1.4; /* Improve spacing between lines */
        }
        .header h1.animated-text {
            font-size: 24px; /* Larger font size for the main heading */
            font-weight: bold;
            margin-bottom: 10px; /* Space between the heading and subheading */
        }
        .header p.animated-text {
            font-size: 16px; /* Smaller font size for the subheading */
            font-weight: normal;
            color: #ffccbc; /* Light orange for contrast */
        }
        .content {
            padding: 25px;
            font-size: 16px;
            line-height: 1.6;
            color: #444;
        }
        .content p {
            margin: 0 0 15px 0;
        }
        .highlight {
            background-color: #fff3cd; /* Light orange background for warning */
            color: #856404; /* Dark orange text */
            border-left: 4px solid #ffc107; /* Bright orange border */
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-weight: bold;
        }
        .highlight .tickets {
            font-size: 12px; /* Smaller font size for trade tickets */
            line-height: 1.4;
            max-height: 150px; /* Restrict height */
            overflow-y: auto; /* Add scroll for long text */
            word-break: break-word; /* Handle long unbroken text */
            padding: 10px;
            background-color: #fff8e1; /* Slightly lighter background for the tickets section */
            border: 1px solid #ffc107;
            border-radius: 4px;
            margin-top: 10px;
        }
        .cta-button {
            display: inline-block;
            background-color: #f57c00; /* Orange button */
            color: #ffffff;
            padding: 12px 25px;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 20px;
            font-size: 16px;
            transition: background-color 0.3s ease;
        }
        .cta-button a {
            text-decoration: none;
            color: #ffffff;
        }
        .cta-button:hover {
            background-color: #ffb74d; /* Lighter orange on hover */
        }
        .footer {
            text-align: center;
            font-size: 12px;
            color: #777;
            padding: 20px;
            background-color: #f9f9f9;
            border-top: 1px solid #eee;
        }
        .social-links {
            margin-top: 20px;
            display: flex;
            justify-content: center;
            gap: 20px;
        }
        .social-links img {
            width: 32px;
            height: 32px;
            transition: transform 0.3s ease;
        }
        .social-links img:hover {
            transform: scale(1.1); /* Slight zoom on hover */
        }
        ul {
            margin: 10px 0 20px 0;
            padding-left: 20px;
        }
        ul li {
            margin-bottom: 10px;
        }
        a {
            color: #DB8112; /* Orange links */
            text-decoration: none;
            font-weight: bold;
        }
        a:hover {
            text-decoration: underline; /* Underline on hover */
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header Section -->
        <div class="header">
            <div class="logo-container">
                <img src="https://i.ibb.co.com/34qjbqp/Fox-Funded-Logo.png" alt="Fox Funded Logo" class="logo">
            </div>
            <h1 class="animated-text">Stop Loss Warning</h1>
        </div>

        <!-- Content Section -->
        <div class="content">
            <p>Dear Trader,</p>
            <p>I hope this email finds you well. We wanted to bring to your attention an issue that has been observed in your recent trading activities at Foxx Funded.</p>
            <p>Upon reviewing your trading history, we've noticed that you have not placed stop-loss orders on your trades, which constitutes a soft breach violation of our trading policies. While we understand that trading involves a certain level of risk, failure to implement stop-loss orders can significantly expose your account to unnecessary risks and potential losses.</p>
            <p>As a reminder, stop-loss orders are an essential risk management tool that helps protect your capital and mitigate potential losses in volatile market conditions. It's crucial to adhere to our trading guidelines to ensure the safety and integrity of your account. The profit(s) generated from the trades without a stop-loss will be deducted as per our rules, with details of the affected trades listed below. If the trade resulted in a loss, no deduction will be made.</p>

            <div class="highlight">
                <p><strong>Account Number:</strong> ${account}</p>
                <div>
                    <p><strong>Trade Tickets (Breached Stop-Loss Risk):</strong></p>
                    <div class="tickets">${tickets}</div>
                </div>
            </div>

            <p>We want to emphasize the seriousness of this matter and the importance of strict compliance with our policies. Failure to rectify this behavior and continue disregarding stop loss orders within the first 2 minutes of placing a simulated trade may result in more severe consequences, including the termination of your trading account with Foxx Funded. Please refer to the <a href="https://foxx-funded.com/faqs/"><strong>FAQ</strong></a> here.</p>
            <p>We highly encourage you to review and adjust your trading strategies to incorporate stop-loss orders effectively. If you have any questions or need assistance in implementing stop-loss orders, please don't hesitate to reach out to our support team for guidance.</p>
            <p>Thank you for your attention to this matter, and we appreciate your cooperation in maintaining a safe and responsible trading environment.</p>

            <p>Best regards,</p>
            <p>Foxx Funded Risk Team</p>

            <p style="font-size: 14px; color: #777; margin-top: 20px;">
                If you have any questions, feel free to
                <a href="https://foxx-funded.com/contact-us" style="color: #DB8112; text-decoration: none; font-weight: bold;">
                    contact us or contact our support team
                </a>.
            </p>

            <div class="social-links">
                <a href="https://t.me/+2QVq5aChxiBlOWFk">
                    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUQ9pRZvmScqICRjNBvAHEjIawnL1erY-AcQ&s" alt="Telegram">
                </a>
            </div>
        </div>

        <!-- Footer Section -->
        <div class="footer">
            <p>@2024 Fox Funded All Rights Reserved.</p>
        </div>
    </div>
</body>
</html>`;
};

// Function to send the warning email 2
const sendStopLossWarningEmail2 = (account, accountDetails) => {
	const tickets = accountDetails.tickets.join(", ");

	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Breach Notification</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            background-color: #ffff; /* Light red background */
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .email-container {
            background-color: #ffffff;
            border-radius: 8px;
            max-width: 600px;
            margin: 0 auto;
            padding: 0;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            border: 2px solid #ffa726;
            overflow: hidden;
        }
        .header {
            background-color: #f57c00;
            color: #ffffff;
            padding: 25px 20px;
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            border-bottom: 2px solid #ffa726;
        }
        .logo-container {
            margin-bottom: 15px;
            text-align: center;
        }
        .logo {
            max-width: 150px;
            height: auto;
            display: block;
            margin: 0 auto;
        }
        .animated-text {
            margin: 0;
            line-height: 1.4;
        }
        .header h1.animated-text {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .header p.animated-text {
            font-size: 16px;
            font-weight: normal;
            color: #ffccbc;
        }
        .content {
            padding: 25px;
            font-size: 16px;
            line-height: 1.6;
            color: #444;
        }
        .content p {
            margin: 0 0 15px 0;
        }
        .highlight {
            background-color: #fff3cd;
            color: #856404;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-weight: bold;
        }
        .highlight .tickets {
            font-size: 12px;
            line-height: 1.4;
            max-height: 150px;
            overflow-y: auto;
            word-break: break-word;
            padding: 10px;
            background-color: #fff8e1;
            border: 1px solid #ffc107;
            border-radius: 4px;
            margin-top: 10px;
        }
        .cta-button {
            display: inline-block;
            background-color: #f57c00;
            color: #ffffff;
            padding: 12px 25px;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 20px;
            font-size: 16px;
            transition: background-color 0.3s ease;
        }
        .cta-button a {
            text-decoration: none;
            color: #ffffff;
        }
        .cta-button:hover {
            background-color: #ffb74d;
        }
        .footer {
            text-align: center;
            font-size: 12px;
            color: #777;
            padding: 20px;
            background-color: #f9f9f9;
            border-top: 1px solid #eee;
        }
        .social-links {
            margin-top: 20px;
            display: flex;
            justify-content: center;
            gap: 20px;
        }
        .social-links img {
            width: 32px;
            height: 32px;
            transition: transform 0.3s ease;
        }
        .social-links img:hover {
            transform: scale(1.1);
        }
        ul {
            margin: 10px 0 20px 0;
            padding-left: 20px;
        }
        ul li {
            margin-bottom: 10px;
        }
        a {
            color: #DB8112;
            text-decoration: none;
            font-weight: bold;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header Section -->
        <div class="header">
            <div class="logo-container">
                <img src="https://i.ibb.co.com/34qjbqp/Fox-Funded-Logo.png" alt="Fox Funded Logo" class="logo">
            </div>
            <h1 class="animated-text">Stop Loss Warning </h1>
        </div>

        <!-- Content Section -->
        <div class="content">
            <p>Dear Trader,</p>
            <p>We hope this email finds you well. Unfortunately, we have observed a repeated violation of our trading policies at Foxx Funded, specifically regarding the absence of stop-loss orders on your trades.</p>
            <p>This is your second warning, and continued non-compliance may result in serious consequences, including the potential termination of your trading account.</p>

            <p><strong>Issue Identified</strong></p>
            <p>Our review of your recent trades indicates that stop-loss orders were not placed, violating our risk management policies. While we understand trading strategies vary, failing to use stop-loss orders significantly increases your exposure to risk and is against our guidelines.</p>

            <p><strong>Account Details</strong></p>
            <div class="highlight">
                <p><strong>Account Number:</strong> ${account}</p>
                <div>
                    <p><strong>Trade Tickets (Breached Stop-Loss Risk):</strong></p>
                    <div class="tickets">${tickets}</div>
                </div>
            </div>

            <p>As per our rules, any profits from non-compliant trades will be deducted. If the trade resulted in a loss, no deduction will be made.</p>

            <p><strong>Final Warning Before Further Action</strong></p>
            <p>Failure to immediately adjust your trading strategy to include stop-loss orders may lead to more severe consequences, including:</p>
            <ul>
                <li>Further profit deductions on non-compliant trades.</li>
                <li>Suspension or termination of your trading account with Foxx Funded.</li>
            </ul>

            <p>Please review our guidelines here: <a href="https://foxx-funded.com/faqs/"><strong>FAQ</strong></a>.</p>
            <p>If you need assistance in setting stop-loss orders, contact our support team immediately.</p>
            <p>This is your final warning before stricter actions are taken.</p>

            <p>Best regards,</p>
            <p>Foxx Funded Risk Team</p>

            <p style="font-size: 14px; color: #777; margin-top: 20px;">
                If you have any questions, feel free to
                <a href="https://foxx-funded.com/contact-us" style="color: #DB8112; text-decoration: none; font-weight: bold;">
                    contact us or contact our support team
                </a>.
            </p>

            <div class="social-links">
                <a href="https://t.me/+2QVq5aChxiBlOWFk">
                    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUQ9pRZvmScqICRjNBvAHEjIawnL1erY-AcQ&s" alt="Telegram">
                </a>
            </div>
        </div>

        <!-- Footer Section -->
        <div class="footer">
            <p>@2024 Fox Funded All Rights Reserved.</p>
        </div>
    </div>
</body>
</html>`;
};

module.exports = {
	stopLossDisabledEmailTemplate,
	sendStopLossWarningEmail1,
	sendStopLossWarningEmail2,
};
