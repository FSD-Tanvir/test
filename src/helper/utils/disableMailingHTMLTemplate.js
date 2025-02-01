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
            font-family: Arial, sans-serif;
            background-color: #fff3e0; /* Light orange background */
            color: #333;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            box-sizing: border-box;
        }
        .container {
            max-width: 600px;
            width: 100%;
            padding: 20px;
            background-color: #ffe0b2; /* Lighter orange for container */
            border-radius: 12px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            text-align: center;
            box-sizing: border-box;
        }
        h1 {
            color: #f57c00; /* Deep orange for the heading */
            margin-bottom: 15px;
        }
        p {
            margin: 10px 0;
        }
        .highlight {
            background-color: #fff3e0; /* Light orange for highlights */
            border-left: 5px solid #f57c00; /* Deep orange border for highlights */
            padding: 10px;
            margin: 10px 0;
            text-align: left;
            display: inline-block;
            width: 100%;
            box-sizing: border-box;
        }
        .footer {
            font-size: 0.9em;
            color: #777;
            margin-top: 20px;
        }
        .thank-you, .encouragement {
            margin-top: 20px;
            font-size: 1.1em;
            color: #f57c00; /* Deep orange for messages */
        }
        
        /* Responsive design */
        @media (max-width: 768px) {
            .container {
                padding: 15px;
            }
            .highlight {
                padding: 8px;
            }
        }
        
        @media (max-width: 480px) {
            .container {
                padding: 10px;
            }
            .highlight {
                padding: 6px;
                font-size: 0.9em;
            }
            h1 {
                font-size: 1.5em;
            }
            .thank-you, .encouragement {
                font-size: 1em;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <p><img src="https://i.ibb.co/34qjbqp/Fox-Funded-Logo.png" style="height: 150px; width: 150px; padding-top: 30px;" alt="Foxx Funded Capital logo"></p>
        <h1>Account Status</h1>
        <p><strong>Account Number:</strong> ${account}</p>
        <p><strong>Message:</strong> Your account is breached due to <strong>${causeOfBreach}</strong></p>
        
        <div class="highlight">
            <p><strong>Loss Percentage:</strong> ${LossPercentage}</p>
           ${
							causeOfBreach === "MaxTotalLoss"
								? `<p><strong>Initial Balance :</strong> ${asset}</p>`
								: `<p><strong>Asset :</strong> ${asset}</p>`
						}
            <p><strong>Equity:</strong> ${equity}</p>
        </div>
        
        <p><strong>Date:</strong> <span>${formattedDate}</span></p>
        
        <div class="thank-you">
            Thank you for being with us!
        </div>
        
        <div class="encouragement">
            Consider purchasing another account to continue your journey with us. We&apos;re here to support you!
        </div>
        
        <div class="footer">
            &copy; Foxx Funded.
        </div>
    </div>
</body>
</html>
`;
};

module.exports = { disableMailingHTMLTemplate };
