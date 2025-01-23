const mt5LiveData = require("./mt5LiveData.services.js");

const getLiveMt5Data = async (req, res) => {
	// console.log(req.params)
	try {
		const account = req.params.account; // No need to use `await` here
		if (account) {
			// console.log(account, "line number 30");
			const result = mt5LiveData.liveMt5Data(account);
			// console.log(result, "line number 32");

			if (result && result.length > 0) {
				res.json({ success: true, data: result });
			} else {
				res
					.status(404)
					.json({ success: false, message: "No data found for this account" });
			}
		}
	} catch (error) {
		console.error("Error in controller:", error);
		res.status(500).json({ success: false, message: "Internal server error" });
	}
};

module.exports = { getLiveMt5Data };
