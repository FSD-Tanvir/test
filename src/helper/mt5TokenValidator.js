const axios = require("axios");
const config = require("../config/config");

const refreshMT5BridgeSession = async ({ user, password, server, id }) => {
	try {
		const response = await axios.get("https://mt5-bridge.zentexx.com/Connect", {
			params: {
				user,
				password,
				server,
				timeout: 15000,
				id,
				unsubscribe: false,
				camelCaseWs: false,
			},
			headers: {
				accept: "text/plain",
			},
		});

		return response.data;
	} catch (error) {
		console.error("Error refreshing MT5 Bridge session:", error.message);
		throw error;
	}
};

const callRefreshMT5BridgeSession = async () => {
	const connectionInfo = {
		user: config.managerID,
		password: config.password,
		server: config.serverConfig,
		id: config.mt5Token,
	};

	try {
		const result = await refreshMT5BridgeSession(connectionInfo);
		console.log("🔋🔋 Session refreshed:", result);
	} catch (err) {
		console.error("Failed to refresh MT5 session:", err.message);
	}
};

module.exports = {
	refreshMT5BridgeSession,
	callRefreshMT5BridgeSession,
};
