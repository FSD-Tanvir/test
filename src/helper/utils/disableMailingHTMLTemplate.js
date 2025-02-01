const path = require("node:path");
const logo = path.resolve(__dirname, "../../assets/LOGO.png");

const disableMailingHTMLTemplate = async (
	account,
	causeOfBreach,
	LossPercentage,
	asset,
	equity
) => {
	const specificDate = new Date();
	const day = specificDate.getDate().toString().padStart(2, "0");
	const month = (specificDate.getMonth() + 1).toString().padStart(2, "0");
	const year = specificDate.getFullYear();
	const formattedDate = `${day}/${month}/${year}`;

	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Notification</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            background-color: #f8f9fa; /* Light gray background */
            color: #333;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            box-sizing: border-box;
        }
        .container {
            max-width: 600px;
            width: 100%;
            padding: 30px;
            background-color: #ffffff; /* White container */
            border-radius: 16px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
            text-align: center;
            box-sizing: border-box;
            border: 2px solid #d32f2f; /* Deep red border */
        }
        h1 {
            color: #d32f2f; /* Deep red for the heading */
            margin-bottom: 20px;
            font-size: 28px;
            font-weight: 700;
        }
        p {
            margin: 10px 0;
            font-size: 16px;
            line-height: 1.6;
        }
        .highlight {
            background-color: #fff3f3; /* Light red background for highlights */
            border-left: 5px solid #d32f2f; /* Deep red border for highlights */
            padding: 15px;
            margin: 20px 0;
            text-align: left;
            display: inline-block;
            width: 100%;
            box-sizing: border-box;
            border-radius: 8px;
        }
        .footer {
            font-size: 14px;
            color: #777;
            margin-top: 30px;
        }
        .thank-you, .encouragement {
            margin-top: 20px;
            font-size: 18px;
            color: #d32f2f; /* Deep red for messages */
            font-weight: 600;
        }
        .logo {
            width: 150px;
            height: 150px;
            margin-bottom: 20px;
        }
        .button {
            display: inline-block;
            margin-top: 20px;
            padding: 12px 24px;
            background-color: #d32f2f; /* Deep red button */
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            transition: background-color 0.3s ease;
        }
        .button:hover {
            background-color: #b71c1c; /* Darker red on hover */
        }
        
        /* Responsive design */
        @media (max-width: 768px) {
            .container {
                padding: 20px;
            }
            h1 {
                font-size: 24px;
            }
            .highlight {
                padding: 12px;
            }
            .thank-you, .encouragement {
                font-size: 16px;
            }
        }
        
        @media (max-width: 480px) {
            .container {
                padding: 15px;
            }
            h1 {
                font-size: 22px;
            }
            .highlight {
                padding: 10px;
                font-size: 14px;
            }
            .thank-you, .encouragement {
                font-size: 14px;
            }
            .button {
                padding: 10px 20px;
                font-size: 14px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <img src="https://i.ibb.co/34qjbqp/Fox-Funded-Logo.png" class="logo" alt="Foxx Funded Capital logo">
        <h1>Account Status</h1>
        <p><strong>Account Number:</strong> ${account}</p>
        <p><strong>Message:</strong> Your account is breached due to <strong>${causeOfBreach}</strong></p>
        
        <div class="highlight">
            <p><strong>Loss Percentage:</strong> ${LossPercentage}</p>
           ${
							causeOfBreach === "MaxTotalLoss"
								? `<p><strong>Initial Balance:</strong> ${asset}</p>`
								: `<p><strong>Asset:</strong> ${asset}</p>`
						}
            <p><strong>Equity:</strong> ${equity}</p>
        </div>
        
        <p><strong>Date:</strong> <span>${formattedDate}</span></p>
        
        <div class="thank-you">
            Thank you for being with us!
        </div>
        
        <div class="encouragement">
            Consider purchasing another account to continue your journey with us. We're here to support you!
        </div>
        
        
        <div class="footer">
            &copy; 2024 Foxx Funded. All rights reserved.
        </div>
    </div>
</body>
</html>`;
};

module.exports = { disableMailingHTMLTemplate };
