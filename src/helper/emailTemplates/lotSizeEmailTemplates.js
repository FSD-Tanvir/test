const lotSizeDisabledEmailTemplate = (account, accountDetails) => {
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
            background-color: #f5f5f5;
        }
        .email-container {
            background-color: #ffffff;
            border: 3px solid red;
            border-radius: 12px;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .email-container:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }
        .header {
            background: linear-gradient(135deg, #d32f2f, #f44336);
            color: #ffffff;
            padding: 40px 20px;
            text-align: center;
            position: relative;
            border-bottom: 2px solid #eeeeee;
            border-radius: 8px 8px 0 0;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .header img {
            width: 80px;
            margin-bottom: 15px;
            transition: transform 0.3s ease;
        }
        .header img:hover {
            transform: scale(1.1);
        }
        .header h1 {
            font-size: 24px;
            font-weight: 700;
            margin: 0;
            letter-spacing: -0.5px;
        }
        .header p {
            font-size: 16px;
            margin-top: 10px;
            opacity: 0.9;
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
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-weight: bold;
            transition: background-color 0.3s ease;
        }
        .highlight:hover {
            background-color: #ffcdd2;
        }
        .trade-details {
            margin-top: 20px;
        }
        .trade {
            background-color: #f9f9f9;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .trade:hover {
            transform: translateY(-3px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        .trade h3 {
            font-size: 18px;
            margin: 0 0 10px;
            color: #d32f2f;
        }
        .trade p {
            margin: 5px 0;
            font-size: 14px;
            color: #555;
        }
        .trade p strong {
            color: #333;
        }
        .footer {
            text-align: center;
            font-size: 12px;
            color: #777;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #eee;
        }
        .footer a {
            color: #DB8112;
            text-decoration: none;
            font-weight: bold;
            transition: color 0.3s ease;
        }
        .footer a:hover {
            color: #ff9800;
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
            transition: transform 0.3s ease;
        }
        .social-links img:hover {
            transform: scale(1.2);
        }
        .animated-text {
            animation: fadeIn 1s ease-in-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header Section with Logo -->
        <div class="header">
            <img src="https://i.ibb.co.com/34qjbqp/Fox-Funded-Logo.png" alt="Fox Funded Logo">
            <h1 class="animated-text">Your Account Has Been Disabled</h1>
            <p class="animated-text">Due to violating the Lot Size Risk rule</p>
        </div>
        
        <!-- Content Section -->
        <div class="content">
            <p>Dear Trader,</p>
            <p>We regret to inform you that we have observed continued violations of our Lot Size Rules at Foxx Funded. </p>
            <p>Breach Details:</p>
    
            <div class="highlight">
                <p><strong>Account Number:</strong> ${account}</p>
                <p><strong>Initial Account Balance:</strong> $${accountDetails?.accountSize}</p>
                <p><strong>Lot Size Limit:</strong> ${accountDetails?.totalLotSizeLimit}</p>
            </div>
    
            <!-- Trade Details Section -->
            <div class="trade-details">
                ${accountDetails?.trades
									?.map((trade) => {
										const isViolation = trade.lotSize > accountDetails?.totalLotSizeLimit;
										return `
                    <div class="trade" ${isViolation ? 'style="border: 2px solid red;"' : ""}>
                        <h3>Trade Ticket: ${trade.ticket}</h3>
                        <p><strong>Lot Size:</strong> ${trade.lotSize}</p>
                        <p><strong>Profit:</strong> $${trade.profit}</p>
                    </div>
                `;
									})
									.join("")}
            </div>

            <p>Lot Size Rules:</p>

            <p>To ensure responsible trading and prevent excessive risk-taking, the number of lots opened must be proportional to the account size:
</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                    <tr style="background-color: #ff6f61; color: #ffffff; text-align: left;">
                        <th style="padding: 10px; border: 1px solid #e0e0e0;">Account Size</th>
                        <th style="padding: 10px; border: 1px solid #e0e0e0;">Max Recommended Lot Size (Forex)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="background-color: #fff5e1;">
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">$5,000</td>
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">0.5 lot</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">$10,000</td>
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">1 lot</td>
                    </tr>
                    <tr style="background-color: #fff5e1;">
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">$25,000</td>
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">2.5 lots</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">$50,000</td>
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">5 lots</td>
                    </tr>
                    <tr style="background-color: #fff5e1;">
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">$100,000</td>
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">10 lots</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">$200,000</td>
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">20 lots</td>
                    </tr>
                    <tr style="background-color: #fff5e1;">
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">$300,000</td>
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">30 lots</td>
                    </tr>
                </tbody>
            </table>

            <p>Example: A trader with a $10K account opening a 5-lot trade on EUR/USD is taking excessive risk and violating this rule.
</p>

            <p style="font-size: 18px; font-weight: bold; color: #d32f2f; margin-bottom: 10px;">Final Consequences</p>
<p style="font-size: 16px; color: #444; margin-bottom: 20px;">Due to this breach, the following actions will be taken:</p>

<div style="background-color: #fff3e0; border-left: 6px solid #ff9800; padding: 15px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
    <p style="margin: 10px 0; font-size: 14px; color: #333;">
        <span style="font-weight: bold; color: #d32f2f;">• Profit Deduction:</span> Any profits generated from non-compliant trades will be deducted per our rules.
    </p>
    <p style="margin: 10px 0; font-size: 14px; color: #333;">
        <span style="font-weight: bold; color: #d32f2f;">• Final Account Review:</span> Your account is now under final review by our Risk Team.
    </p>
    <p style="margin: 10px 0; font-size: 14px; color: #333;">
        <span style="font-weight: bold; color: #d32f2f;">• Potential Termination:</span> Any further violations will result in the permanent closure of your trading account with Foxx Funded.
    </p>
</div>
    
            <p>We’d love to see you try again — you can restart a new challenge with 40% off using the code:
                <span style="font-weight: bold; color: #d32f2f;">RETRY40</span>
            </p>
            <p>For further details on our policies and guidelines, please refer to our <a href="https://foxx-funded.com/faqs">FAQ</a> article.</p>
    
            <p>Best regards,</p>
            <p>Fox Funded Risk Team</p>
    
                <p style="font-size: 14px; color: #777; margin-top: 20px;">
                     <!-- Help Message -->
    <p style="font-size: 14px; color: #333; margin-top: 20px; line-height: 1.6;">
        If you need any help or have questions about your account, please contact our team at 
        <a href="mailto:contact@foxx-funded.com" style="color: #DB8112; text-decoration: none; font-weight: bold;">contact@foxx-funded.com</a>.
    </p>

    
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

const sendLotSizeWarningEmailTemplate = (account, accountDetails) => {
	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lot Size Risk Warning Notification ${accountDetails.emailCount} </title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            background-color: #f9f9f9; /* Light gray background */
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .email-container {
            background-color: #ffffff;
            border-radius: 12px;
            max-width: 600px;
            margin: 0 auto;
            padding: 30px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            border: 1px solid #e0e0e0; /* Subtle border */
        }
        .header {
            background-color: #ff6f61; /* Vibrant red-orange header */
            color: #ffffff;
            padding: 25px;
            border-radius: 12px 12px 0 0;
            text-align: center;
            font-size: 28px;
            font-weight: bold;
            letter-spacing: 1px;
        }
        .header img {
            max-width: 150px;
            margin-bottom: 15px;
        }
        .content {
            padding: 25px;
            font-size: 16px;
            line-height: 1.7;
            color: #444;
        }
        .highlight {
            background-color: #fff5e1; /* Soft cream background */
            color: #000;
            border-left: 5px solid #ff6f61; /* Matching vibrant border */
            padding: 15px;
            margin: 25px 0;
            border-radius: 8px;
            font-weight: bold;
        }
        .cta-button {
            display: inline-block;
            background-color: #ff6f61; /* Vibrant red-orange button */
            color: #ffffff;
            padding: 12px 25px;
            text-decoration: none;
            border-radius: 8px;
            margin-top: 25px;
            font-size: 16px;
            transition: background-color 0.3s ease;
        }
        .cta-button a {
            text-decoration: none;
            color: #ffffff;
        }
        .cta-button:hover {
            background-color: #ff9a8b; /* Slightly lighter hover effect */
        }
        .footer {
            text-align: center;
            font-size: 12px;
            color: #777;
            margin-top: 30px;
        }
        .social-links {
            margin-top: 25px;
            display: flex;
            justify-content: center;
            gap: 20px;
        }
        .social-links img {
            width: 36px;
            height: 36px;
            transition: transform 0.3s ease;
        }
        .social-links img:hover {
            transform: scale(1.1); /* Slight zoom effect on hover */
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header Section -->
        <div class="header">
            <img src="https://i.ibb.co.com/34qjbqp/Fox-Funded-Logo.png" alt="Fox Funded Logo">
            <br>
            Lot Size Risk Breach Notification 
        </div>
        
        <!-- Content Section -->
        <div class="content">
            <p>Dear Trader,</p>
            <p>I hope this email finds you well. We wanted to bring to your attention an issue that has been observed in your recent trading activities at <strong>Foxx Funded</strong>.</p>
            
            <p>Upon reviewing your trading history, we've noticed that some of your trades have violated our <strong>Lot Size Rules</strong>, which constitutes a soft breach of our trading policies. While we understand that trading strategies vary, failing to adhere to these rules can expose your account to unnecessary risks and potential compliance issues.</p>
            
            <p>As a reminder, our <strong>Lot Size Rules</strong> are designed to ensure responsible trading and prevent excessive risk-taking:</p>
            
            <p><strong>Lot Size Rules</strong></p>
            <div>
                <p><strong>- The number of lots opened must be proportional to the account size.</strong></p>
                <p><strong>- Excessive lot sizes relative to the risk taken will not be allowed.</strong></p>
            </div>
            
            <p>Below are the <strong>maximum recommended lot sizes</strong> for compliance:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                    <tr style="background-color: #ff6f61; color: #ffffff; text-align: left;">
                        <th style="padding: 10px; border: 1px solid #e0e0e0;">Account Size</th>
                        <th style="padding: 10px; border: 1px solid #e0e0e0;">Max Recommended Lot Size (Forex)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="background-color: #fff5e1;">
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">$5,000</td>
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">0.5 lot</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">$10,000</td>
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">1 lot</td>
                    </tr>
                    <tr style="background-color: #fff5e1;">
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">$25,000</td>
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">2.5 lots</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">$50,000</td>
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">5 lots</td>
                    </tr>
                    <tr style="background-color: #fff5e1;">
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">$100,000</td>
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">10 lots</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">$200,000</td>
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">20 lots</td>
                    </tr>
                    <tr style="background-color: #fff5e1;">
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">$300,000</td>
                        <td style="padding: 10px; border: 1px solid #e0e0e0;">30 lots</td>
                    </tr>
                </tbody>
            </table>
            
            <p><strong>Example:</strong> A trader with a $10K account opening a <strong>5-lot</strong> trade on EUR/USD is taking excessive risk and violating this rule.</p>
            
            <p>Any profit(s) generated from trades that exceed the allowed lot size will be deducted as per our rules, with details of the affected trades listed below. If the trade resulted in a loss, no deduction will be made.</p>
            
            <p>The details of the violating trades are as follows:</p>
            
            <div class="highlight">
                <p><strong>Account Number:</strong> ${account}</p>
                <p><strong>Initial Account Balance:</strong> $${accountDetails.accountSize}</p>
                <p><strong>Lot Size Limit:</strong> ${accountDetails.totalLotSizeLimit}</p>
                <p><strong>Exceeding Trades:</strong></p>
                <div>
                    ${accountDetails.trades
											.map(
												(trade) =>
													`<p><strong>Ticket:</strong> ${trade.ticket}, <strong>Lot Size:</strong> ${trade.lotSize}</p>`
											)
											.join("")}
                </div>
            </div>
            
            <p>We want to emphasize the seriousness of this matter and the importance of strict compliance with our policies. Failure to follow the <strong>Lot Size Rules</strong> may result in further consequences, including the termination of your trading account with <strong>Foxx Funded</strong>. Please refer to our FAQ article here: <a href="https://foxx-funded.com/faqs">FAQ</a></p>
            
            <p>If you have any questions or need further clarification on the <strong>Lot Size Rules</strong>, please don’t hesitate to reach out to our support team for guidance.</p>
            
            <p>Thank you for your attention to this matter, and we appreciate your cooperation in maintaining a safe and responsible trading environment.</p>
            
            <p>Best regards,</p>
            <p><strong>Fox Funded Risk Team</strong></p>
            
                <p style="font-size: 14px; color: #777; margin-top: 20px;">
                     <!-- Help Message -->
    <p style="font-size: 14px; color: #333; margin-top: 20px; line-height: 1.6;">
        If you need any help or have questions about your account, please contact our team at 
        <a href="mailto:contact@foxx-funded.com" style="color: #DB8112; text-decoration: none; font-weight: bold;">contact@foxx-funded.com</a>.
    </p>

    
            </p>
            
            <div class="social-links">
                <a href="https://t.me/+2QVq5aChxiBlOWFk">
                    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSUQ9pRZvmScqICRjNBvAHEjIawnL1erY-AcQ&s" alt="Telegram">
                </a>
            </div>
        </div>
        
        <!-- Footer Section -->
        <div class="footer">
            <p>@2024 <strong>Fox Funded</strong> All Rights Reserved.</p>
        </div>
    </div>
</body>
</html>`;
};

module.exports = {
	lotSizeDisabledEmailTemplate,
	sendLotSizeWarningEmailTemplate,
};
