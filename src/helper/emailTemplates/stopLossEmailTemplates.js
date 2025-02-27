const stopLossDisabledEmailTemplate = (account, accountDetails) => {
    // Extract tickets and join them into a comma-separated string
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
                    <li>You are no longer eligible to participate in any future trading programs with Foxx Funded.</li>
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

module.exports = { stopLossDisabledEmailTemplate };
