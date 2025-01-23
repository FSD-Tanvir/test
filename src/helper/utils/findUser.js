const MUser = require("../../modules/users/users.schema");

const findUserByAccount = async (accountNumber) => {
	try {
		const user = await MUser.findOne({
			mt5Accounts: {
				$elemMatch: { account: accountNumber },
			},
		}).exec();

		return user;
	} catch (error) {
		console.error("Error finding user:", error);
		throw error;
	}
};

module.exports = { findUserByAccount };
