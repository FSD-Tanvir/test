const orderCreationEmailTemplate = (orderId, buyerDetails) => {
	return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 12px; background-color: #ffffff; border: 2px solid #DB8112; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); text-align: center;">
        <!-- Header Section -->
        <div style="text-align: center; margin-bottom: 25px;">
            <img src="https://i.ibb.co.com/34qjbqp/Fox-Funded-Logo.png " alt="Company Logo" style="max-width: 100px; height: auto;">
        </div>
    
        <h2 style="color: #333; text-align: center; margin-bottom: 20px; font-size: 26px; font-weight: bold;">
            Your customer portal has been created
        </h2>
        <p style="font-size: 16px; color: #555; text-align: center; margin-bottom: 20px; line-height: 1.6;">
            Your order has been successfully created. Here are the details:
        </p>
    
        <!-- Order ID Section -->
        <div style="background-color: #fff8f0; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #DB8112;">
            <p style="font-size: 20px; color: #333; text-align: center; margin-bottom: 10px; font-weight: bold;">
                Order ID: <span style="color: #DB8112; font-weight: 800;">${orderId}</span>
            </p>
        </div>
    
        <!-- Instruction Text -->
        <p style="font-size: 16px; color: #555; text-align: center; margin-bottom: 20px; line-height: 1.6; font-style: italic;">
            To track your order, please log in with the following credentials in our dashboard:
        </p>
    
        <!-- Credentials Section -->
        <div style="background-color: #fff8f0; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #DB8112;">
            <p style="font-size: 18px; color: #333; margin-bottom: 10px; text-align: center;">
                <strong>Email:</strong> <span style="color: #DB8112; font-weight: bold;">${buyerDetails?.email}</span>
            </p>
            <p style="font-size: 18px; color: #333; margin-bottom: 10px; text-align: center;">
                <strong>Password:</strong> <span style="color: #DB8112; font-weight: bold;">${buyerDetails?.password}</span>
            </p>
        </div>
    
        <!-- Call-to-Action Button -->
        <div style="text-align: center; margin-bottom: 20px;">
            <a href="https://foxx-funded.com/login " style="display: inline-block; padding: 12px 25px; background: linear-gradient(135deg, #DB8112, #ffa64d); color: #fff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; transition: all 0.3s ease;">
                Login to Track Your Order
            </a>
        </div>
    
        <!-- Help Message -->
        <p style="font-size: 16px; color: #333; margin-top: 20px; line-height: 1.6;">
            If you need any help or have questions about your account, please contact our team at 
            <a href="mailto:contact@foxx-funded.com" style="color: #DB8112; text-decoration: none; font-weight: bold;">contact@foxx-funded.com</a>.
        </p>
    
        <!-- Support Section -->
        <p style="font-size: 14px; color: #777; margin-top: 20px; line-height: 1.6;">
            Need further assistance? <a href="https://foxx-funded.com/en/contact-us#contact-section" style="color: #DB8112; text-decoration: none; font-weight: bold;">Contact our support team</a>.
        </p>
    
        <!-- Social Media Section -->
        <div style="margin-top: 20px; text-align: center;">
     <a href="https://discord.com/invite/XTwRAEVm4G">
    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMuxUS2wuAPTPNaRFscfcQ_tJ7YQNVwVjLvw&s" alt="Discord" width="48" height="48">
</a>



        </div>
    
        <!-- Footer Section -->
        <p style="font-size: 14px; color: #777; margin-top: 20px;">
            Thank you for shopping with us!
        </p>
    </div>
    
    <style>
        @media only screen and (max-width: 600px) {
            div[style] {
                padding: 20px !important;
            }
            h2[style] {
                font-size: 24px !important;
            }
            p[style], a[style] {
                font-size: 14px !important;
            }
            a[style] {
                padding: 10px 20px !important;
                font-size: 14px !important;
            }
        }
    </style>`;
};

const sendingMt5CredentialsEmailTemplate = (matchingAccount) => {
	return `<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .email-container {
            width: 100%;
            max-width: 600px;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
            border: 2px solid #DB8112;
            overflow: hidden;
            text-align: center;
            padding: 30px;
            animation: fadeIn 0.5s ease-in-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .logo-container {
            margin-bottom: 25px;
        }
        .logo-container img {
            max-width: 100px;
            height: auto;
        }
        .header {
            color: #DB8112;
            margin-bottom: 25px;
        }
        .header h2 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            position: relative;
            display: inline-block;
        }
        .header h2::after {
            content: '';
            display: block;
            width: 50px;
            height: 3px;
            background-color: #DB8112;
            margin: 10px auto 0;
            border-radius: 2px;
        }
        .content {
            color: #333333;
            font-size: 16px;
            line-height: 1.6;
            text-align: left;
        }
        .content p {
            margin: 15px 0;
        }
        .credentials {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: left;
            border-left: 4px solid #DB8112;
        }
        .credentials p {
            margin: 10px 0;
            font-size: 16px;
            color: #555;
        }
        .credentials strong {
            color: #DB8112;
            font-weight: bold;
        }
        .download-links {
            margin-top: 25px;
            text-align: center;
        }
        .download-links p {
            font-size: 18px;
            color: #333;
            margin-bottom: 15px;
        }
        .download-links a {
            display: inline-block;
            color: #ffffff;
            background: linear-gradient(135deg, #DB8112, #ffa64d);
            text-decoration: none;
            font-weight: bold;
            padding: 12px 25px;
            border-radius: 6px;
            margin: 10px 5px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .download-links a:hover {
            background: linear-gradient(135deg, #ffa64d, #DB8112);
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }
        .footer {
            padding-top: 20px;
            font-size: 14px;
            color: #777;
            margin-top: 25px;
            border-top: 1px solid #eeeeee;
            text-align: center;
        }
        .footer p {
            margin: 5px 0;
        }
        @media only screen and (max-width: 600px) {
            .email-container {
                padding: 20px;
            }
            .header h2 {
                font-size: 24px;
            }
            .download-links a {
                padding: 10px 20px;
                font-size: 14px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="logo-container">
            <img src="https://i.ibb.co.com/34qjbqp/Fox-Funded-Logo.png" alt="Company Logo">
        </div>
        <div class="header">
            <h2>Your MT5 Account Credentials</h2>
        </div>
        <div class="content">
            <p>Dear User,</p>
            <p>Your MT5 account has been successfully created. Here are your credentials:</p>
            <div class="credentials">
                <p><strong>Account:</strong> ${matchingAccount?.account}</p>
                <p><strong>Password:</strong> ${matchingAccount?.masterPassword}</p>
                <p><strong>Platform:</strong> MT5</p>
                <p><strong>Broker:</strong> PreferredCapital</p>
            </div>
            <p>Please keep this information secure and do not share it with anyone.</p>
            <div class="download-links">
                <p>Download the MT5 for:</p>
                <a href="https://play.google.com/store/apps/details?id=net.metaquotes.metatrader5" target="_blank" rel="noopener noreferrer">Android</a>
                <a href="https://apps.apple.com/us/app/metatrader-5/id413251709" target="_blank" rel="noopener noreferrer">iOS</a>
                <a href="https://download.mql5.com/cdn/web/metaquotes.software.corp/mt5/metatrader5.apk?utm_source=www.metatrader5.com&utm_campaign=install.metaquotes" target="_blank" rel="noopener noreferrer">Desktop</a>
            </div>

            <!-- Help Message -->
    <p style="font-size: 16px; color: #333; margin-top: 20px; line-height: 1.6;">
        If you need any help or have questions about your account, please contact our team at 
        <a href="mailto:contact@foxx-funded.com" style="color: #DB8112; text-decoration: none; font-weight: bold;">contact@foxx-funded.com</a>.
    </p>

    <!-- Support Section -->
    <p style="font-size: 14px; color: #777; margin-top: 20px; line-height: 1.6;">
        Need further assistance? <a href="https://foxx-funded.com/en/contact-us#contact-section" style="color: #DB8112; text-decoration: none; font-weight: bold;">Contact our support team</a>.
    </p>

    <!-- Social Media Section -->
        <div style="margin-top: 20px; text-align: center;">
     <a href="https://discord.com/invite/XTwRAEVm4G">
    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMuxUS2wuAPTPNaRFscfcQ_tJ7YQNVwVjLvw&s" alt="Discord" width="48" height="48">
</a>



        </div>


            
        </div>
        <div class="footer">
            <p>Thank you for choosing our services.</p>
        </div>
    </div>
</body>
</html>`;
};

const sendingMatchTraderCredentialsEmailTemplate = (matchingAccount) => {
	return `<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            background-color: #f8f9fa;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            color: #333;
        }
        .email-container {
            width: 100%;
            max-width: 640px;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
            border: 2px solid #DB8112;
            overflow: hidden;
            text-align: center;
            padding: 40px;
            animation: fadeIn 0.5s ease-in-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .logo-container {
            margin-bottom: 25px;
        }
        .logo-container img {
            max-width: 120px;
            height: auto;
        }
        .header {
            color: #DB8112;
            margin-bottom: 30px;
        }
        .header h2 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            position: relative;
            display: inline-block;
        }
        .header h2::after {
            content: '';
            display: block;
            width: 60px;
            height: 3px;
            background: linear-gradient(90deg, #DB8112, #ffc107);
            margin: 12px auto 0;
            border-radius: 3px;
        }
        .content {
            font-size: 16px;
            line-height: 1.7;
            text-align: left;
            color: #444;
        }
        .content p {
            margin: 18px 0;
        }
        .credentials {
            background-color: #fff9f2;
            padding: 22px;
            border-radius: 8px;
            margin: 25px 0;
            text-align: left;
            border-left: 4px solid #DB8112;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .credentials p {
            margin: 12px 0;
            font-size: 16px;
            color: #555;
        }
        .credentials strong {
            color: #DB8112;
            font-weight: 600;
        }
        .platform-link {
            background-color: #f0f7ff;
            border: 1px solid #d0e3ff;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
            text-align: center;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(219, 129, 18, 0.2); }
            70% { box-shadow: 0 0 0 10px rgba(219, 129, 18, 0); }
            100% { box-shadow: 0 0 0 0 rgba(219, 129, 18, 0); }
        }
        .platform-link a {
            display: inline-block;
            background: linear-gradient(135deg, #DB8112, #ffa64d);
            color: white;
            text-decoration: none;
            font-weight: 600;
            padding: 14px 28px;
            border-radius: 6px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(219, 129, 18, 0.2);
            font-size: 16px;
        }
        .platform-link a:hover {
            background: linear-gradient(135deg, #ffa64d, #DB8112);
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(219, 129, 18, 0.3);
        }
        .platform-link p {
            margin-bottom: 15px;
            font-weight: 600;
            color: #2c3e50;
        }
        .help-section {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
        }
        .help-link {
            color: #DB8112;
            text-decoration: none;
            font-weight: 600;
            transition: color 0.2s;
        }
        .help-link:hover {
            color: #b86c0e;
            text-decoration: underline;
        }
        .footer {
            padding-top: 25px;
            font-size: 14px;
            color: #777;
            margin-top: 30px;
            border-top: 1px solid #eeeeee;
            text-align: center;
        }
        .footer p {
            margin: 8px 0;
        }
        @media only screen and (max-width: 600px) {
            .email-container {
                padding: 25px;
                margin: 20px;
            }
            .header h2 {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="logo-container">
            <img src="https://i.ibb.co.com/34qjbqp/Fox-Funded-Logo.png" alt="Company Logo">
        </div>
        <div class="header">
            <h2>Your Match Trader Account Credentials</h2>
        </div>
        <div class="content">
            <p>Dear User,</p>
            <p>Your Match Trader account has been successfully created. Here are your credentials:</p>
            
            <div class="credentials">
                <p><strong>Account:</strong> ${matchingAccount?.account}</p>
                <p><strong>Password:</strong> ${matchingAccount?.masterPassword}</p>
                <p><strong>Platform:</strong> Match Trader</p>
                <p><strong>Broker:</strong> Match Trader</p>
            </div>
            
            <!-- Highlighted Platform Link Section -->
            <div class="platform-link">
                <p>Access your trading platform here:</p>
                <a href="https://platform.foxx-funded.com/login" target="_blank">GO TO TRADING PLATFORM</a>
            </div>
            
            <p>Please keep this information secure and do not share it with anyone.</p>
            
            <div class="help-section">
                <p>If you need any help or have questions about your account, please contact our team at 
                    <a href="mailto:contact@foxx-funded.com" class="help-link">contact@foxx-funded.com</a>.
                </p>
                <p>Need further assistance? 
                    <a href="https://foxx-funded.com/en/contact-us#contact-section" class="help-link">Contact our support team</a>.
                </p>
            </div>

             <!-- Social Media Section -->
        <div style="margin-top: 20px; text-align: center;">
     <a href="https://discord.com/invite/XTwRAEVm4G">
    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMuxUS2wuAPTPNaRFscfcQ_tJ7YQNVwVjLvw&s" alt="Discord" width="48" height="48">
</a>



        </div>
        </div>
        <div class="footer">
            <p>Thank you for choosing our services.</p>
        </div>
    </div>
</body>
</html>`;
};

module.exports = {
	orderCreationEmailTemplate,
	sendingMt5CredentialsEmailTemplate,
	sendingMatchTraderCredentialsEmailTemplate,
};
