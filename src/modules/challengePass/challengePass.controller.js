const challengePassService = require("./challengePass.services");

// User.controller.js
const getPhasedUsersHandler = async () => {
	const filteredAccounts = await challengePassService.getPhasedUsers();
	if (filteredAccounts.length > 0) {
		return filteredAccounts;
	}
};

const automateChallengePassHandler = async (req, res) => {
	const { mt5Account } = req.params;

	try {
		const automateChallengePass = await challengePassService.passingChallengeUsingAPI(mt5Account);
		return res
			.status(201)
			.json({ message: "Challenge Passed successfully", data: automateChallengePass });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

module.exports = {
	getPhasedUsersHandler,
	automateChallengePassHandler,
};
