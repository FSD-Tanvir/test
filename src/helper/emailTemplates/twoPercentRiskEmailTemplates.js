const twoPercentDisabledEmailTemplate = (account, accountDetails) => {
	const tickets = accountDetails.tickets.join(", ");
	return `<!DOCTYPE html>
				<html lang="en">
				<head>
					<meta charset="UTF-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<title>Account Breach Notification</title>
				</head>
				<body style="font-family: Arial, sans-serif; background-color: #f7f8fa; margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh;">
					<div style="background-color: #ffffff; border-radius: 12px; max-width: 800px; margin: 0 auto; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1); border: 1px solid #e0e0e0; overflow: hidden;">
						<!-- Header Section -->
						<div style="background: linear-gradient(135deg, #d32f2f, #f44336); color: #ffffff; padding: 40px 20px; text-align: center; position: relative; border-bottom: 2px solid #eeeeee; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
							<img src="https://i.ibb.co.com/34qjbqp/Fox-Funded-Logo.png" alt="Foxx Funded Logo" style="width: 80px; margin-bottom: 15px;">
							<h1 style="font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">Your Account Has Been Disabled</h1>
							<p style="font-size: 16px; margin-top: 10px; opacity: 0.9;">Due to exceeding the 2% risk limit</p>
						</div>
				
						<!-- Content Section -->
						<div style="padding: 30px; font-size: 16px; line-height: 1.6; color: #444;">
							<p style="margin: 0 0 20px;">Dear Trader,</p>
							<p style="margin: 0 0 20px;">We hope this message finds you well.</p>
				
							<div style="background-color: #f7f8fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
								<p style="margin: 0 0 10px;">We are writing to inform you that your account <strong>${account}</strong> recent trading activities <strong>${tickets}</strong> has exceeded the allowable maximum risk exposure per trade. As per our guidelines, we permit a maximum of 2% risk per trade.</p>
								<p style="margin: 0;">This breach constitutes a violation of our trading rules. You have previously received a warning (Warning 1) regarding this matter. Consequently, since this is a second violation of this rule, it resulted in a hard breach, leading to your account being permanently marked as violated.</p>
							</div>
				
							<p style="margin: 0 0 20px;">We urge you to adhere strictly to our risk management guidelines to ensure the continued success and integrity of your trading activities. Should you have any questions or require further clarification, please do not hesitate to reach out.</p>
				
							<!-- Contact Link and Telegram Logo Section -->
							<div style="text-align: center; margin-top: 30px;">
								<p style="font-size: 14px; color: #777; margin-bottom: 10px;">
									   <p style="font-size: 14px; color: #777; margin-top: 20px;">
                     <!-- Help Message -->
    <p style="font-size: 14px; color: #333; margin-top: 20px; line-height: 1.6;">
        If you need any help or have questions about your account, please contact our team at 
        <a href="mailto:contact@foxx-funded.com" style="color: #DB8112; text-decoration: none; font-weight: bold;">contact@foxx-funded.com</a>.
    </p>

   
            </p>
									
								</p>
								  <div style="margin-top: 20px; text-align: center;">
     <a href="https://discord.com/invite/XTwRAEVm4G">
    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMuxUS2wuAPTPNaRFscfcQ_tJ7YQNVwVjLvw&s" alt="Discord" width="48" height="48">
</a>

							</div>
						</div>
				
						<!-- Footer Section -->
						<div style="background-color: #f7f8fa; padding: 20px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #eeeeee; margin-top: 20px;">
							<p style="margin: 0;">@2024 Fox Funded. All Rights Reserved.</p>
						</div>
					</div>
				</body>
				</html>`;
};

const sendTwoPercentWarningEmailTemplate = (account, accountDetails) => {
	return `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Account Breach Notification</title>
		</head>
		<body style="font-family: Arial, sans-serif; background-color: #f7f8fa; margin: 0; padding: 20px; color: #333;">
			<div style="background-color: #ffffff; border-radius: 12px; max-width: 800px; margin: 0 auto; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1); border: 1px solid #e0e0e0; overflow: hidden;">
				
				<!-- Header Section with Gradient Background -->
				<div style="background: linear-gradient(135deg, #f57c00, #ffa726); color: #ffffff; padding: 40px 20px; text-align: center;">
					<img src="https://i.ibb.co.com/34qjbqp/Fox-Funded-Logo.png" alt="Company Logo" style="width: 90px; height: 90px; display: block; margin: 0 auto 15px;">
					<h1 style="font-size: 28px; font-weight: bold; margin: 0; letter-spacing: 0.5px; text-transform: uppercase;">Maximum Risk Per Trade Exposure Warning</h1>
				</div>
				
				<!-- Content Section -->
				<div style="padding: 30px 20px; font-size: 16px; line-height: 1.6; color: #444;">
					<p>Dear Trader,</p>
					<p>We hope this message finds you well.</p>
					
					<p>We are writing to inform you that your recent trading activity on your simulated trading account <strong>${account}</strong> has traits of gambling/punting. We urge you to stick within industry standards of risking no more than 1-2% of risk per trade idea. Below we’ll provide you with a few examples:</p>
		
					<!-- Warning Box -->
					<div style="background-color: #fff3e0; color: #d32f2f; border-left: 4px solid #f57c00; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
						<p style="margin: 0; font-weight: bold;">
							Taking a 1.5% risk position on the EU is considered fine.<br>
							Adding another 1.5% on GBPJPY is also fine.<br>
							However, if you proceed to open a 2.1% or higher risk on any pair/assets class, for example (XAUUSD/Gold), that is an indication of over-risking.<br>
							Lastly, splitting orders in multiple positions where the sum of the risk exceeds 2% is still considered gambling. For example, having 3 trades each with 1% risk on the same trade idea on any pair. The same trade made refers to trades opened in/around the same time and price point.
						</p>
					</div>
					
					<p>Exceeding this limit constitutes a breach of our trading rules. As this is your first violation, it will be considered a soft breach.</p>
		
					<p>Please be advised that a second violation of this rule will result in a hard breach, which will lead to your account being permanently marked as violated.</p>
		
					<p>We urge you to adhere strictly to our risk management guidelines to ensure the continued success and integrity of your trading activities. Should you have any questions or require further clarification, please do not hesitate to reach out.</p>
		
					<p>Thank you for your understanding and cooperation.</p>
		
					<p>Best regards,</p>
					<p style="font-weight: bold; color: #f57c00;">Foxx Funded Team</p>
		
					   <p style="font-size: 14px; color: #777; margin-top: 20px;">
                     <!-- Help Message -->
    <p style="font-size: 14px; color: #333; margin-top: 20px; line-height: 1.6;">
        If you need any help or have questions about your account, please contact our team at 
        <a href="mailto:contact@foxx-funded.com" style="color: #DB8112; text-decoration: none; font-weight: bold;">contact@foxx-funded.com</a>.
    </p>

   
            </p>
		
					  <div style="margin-top: 20px; text-align: center;">
     <a href="https://discord.com/invite/XTwRAEVm4G">
    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMuxUS2wuAPTPNaRFscfcQ_tJ7YQNVwVjLvw&s" alt="Discord" width="48" height="48">
</a>
				</div>
				
				<!-- Footer Section -->
				<div style="background-color: #f7f8fa; padding: 20px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #eeeeee; margin-top: 20px;">
					<p>&copy; 2024 Foxx Funded. All Rights Reserved.</p>
				</div>
			</div>
		</body>
		</html>`;
};

module.exports = { twoPercentDisabledEmailTemplate, sendTwoPercentWarningEmailTemplate };
