require("dotenv").config();

const config = {
	environment: process.env.NODE_ENV,
	port: process.env.PORT,
	dbConnection: process.env.DB_CONNECTION,

	// initial manager body.... start
	Mt5BaseUrl: process.env.MT5_BASE_URL,
	managerID: process.env.MANAGER_ID,
	password: process.env.PASSWORD,
	serverConfig: process.env.SERVER_CONFIG,
	mt5Token: process.env.MT5_TOKEN,
	newsUrl: process.env.NEWS_URL,
	// initial manager body ...... end

	// initial match trader manager body.... start
	matchTraderBaseURL: process.env.MATCH_TRADER_BASE_URL,
	paymentGatewayId: process.env.PAYMENT_GATEWAY_ID,
	matchTraderAuthToken: process.env.MATCH_TRADER_AUTH_TOKEN,
	matchTraderSystemUUID: process.env.MATCH_TRADER_SYSTEM_UUID,
	// initial match trader manager body ...... end

	cry_base_url: process.env.CRYPTO_CLOUD_BASE_URL,
	cry_cloud_api_key: process.env.CRYPTO_CLOUD_API_KEY,
	shop_id: process.env.SHOP_ID,
	headers: {
		accept: "application/json",
		"content-type": "application/json",
		"brand-api-key": process.env.MT5_API_KEY,
	},

	cryHeaders: {
		Authorization: `Token ${process.env.CRYPTO_CLOUD_API_KEY}`,
		"content-type": "application/json",
		accept: "application/json",
	},
	// 📌📌PAYTIKO PAYMENT SYSTEM CONFIG
	paytiko_api_url: process.env.PAYTIKO_API_URL,
	paytiko_merchant: process.env.PAYTIKO_MERCHANT_ID,
	paytiko_api_secret: process.env.PAYTIKO_MERCHANT_SECRET,

	// TazaPay configurations
	tazapay_base_url: process.env.TAZA_PAY_BASE_URL,
	tazapay_secret_key: process.env.TAZA_PAY_SECRET_KEY,

	//✏️✏️✏️✏️ veriff config
	veriff_api_url: process.env.VERIFF_API_URL,
	veriff_auth_client: process.env.VERIFF_AUTH_CLIENT,
	veriff_callback_url: process.env.VERIFF_CALLBACK_URL,

	// GOOGLE CLOUD CREDENTIALS FOR GOOGLE DRIVE 📌📌📌💚
	CLIENT_ID: process.env.CLIENT_ID,
	CLIENT_SECRET: process.env.CLIENT_SECRET,
	REDIRECT_URI: process.env.REDIRECT_URI,
	REFRESH_TOKEN: process.env.REFRESH_TOKEN,
};

module.exports = config;
