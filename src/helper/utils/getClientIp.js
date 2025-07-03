const getClientIp = (req) => {
	let ip =
		req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
		req.connection?.remoteAddress ||
		req.socket?.remoteAddress ||
		req.ip;

	// Normalize local dev addresses
	if (ip === "::1" || ip === "::ffff:127.0.0.1") {
		ip = "127.0.0.1";
	}
	if (ip?.startsWith("::ffff:")) {
		ip = ip.replace("::ffff:", "");
	}

	return ip;
};

module.exports = {
	getClientIp,
};
