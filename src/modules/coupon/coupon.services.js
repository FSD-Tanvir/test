const { MCoupon } = require("./coupon.schema");

const createCoupon = async (couponData) => {
	try {
		const res = await MCoupon.create(couponData);
		return res;
	} catch (error) {
		throw new Error("Error creating coupon");
	}
};

const getCoupon = async (couponName) => {
	try {
		const coupon = await MCoupon.findOne({ couponName });
		if (!coupon) {
			return {
				success: false,
				message: "Coupon not found",
			};
		}

		// Check if the coupon status is 'active'
		if (coupon.status !== "active") {
			return {
				success: false,
				message: "Coupon is not active",
			};
		}

		return {
			success: true,
			data: coupon,
		};
	} catch (error) {
		return {
			success: false,
			message: `Error retrieving coupon: ${error.message}`,
		};
	}
};

const updateCoupon = async (id, updateData) => {
	try {
		// Fetch the existing coupon first
		let coupon = await MCoupon.findById(id);
		if (!coupon) {
			throw new Error("Coupon not found");
		}

		// Update couponName if provided
		if (updateData.couponName) {
			coupon.couponName = updateData.couponName;
		}

		// Update expiryDate if provided and check if it's a valid date
		if (updateData.expiryDate) {
			const newExpiryDate = new Date(updateData.expiryDate);
			if (isNaN(newExpiryDate)) {
				throw new Error("Invalid expiry date format");
			}
			coupon.expiryDate = newExpiryDate;
		}

		// Update applicableUsers if provided
		if (updateData.applicableUsers) {
			coupon.applicableUsers = updateData.applicableUsers;
		}

		// Update applicableChallenges if provided
		if (updateData.applicableChallenges) {
			coupon.applicableChallenges = updateData.applicableChallenges;
		}

		// Update applicablePaymentMethods if provided
		if (updateData.applicablePaymentMethods) {
			coupon.applicablePaymentMethods = updateData.applicablePaymentMethods;
		}

		if (updateData.status) {
			coupon.status = updateData.status;
		}

		// Save the updated coupon
		coupon = await coupon.save();

		return coupon;
	} catch (error) {
		console.error(error.message);
		throw new Error("Error updating coupon");
	}
};

const allCoupons = async () => {
	try {
		// const coupons = await MCoupon.find().populate("claimedOrders");
		const coupons = await MCoupon.find();
		return coupons;
	} catch (error) {
		return {
			success: false,
			message: `Error retrieving coupon: ${error.message}`,
		};
	}
};

module.exports = {
	createCoupon,
	getCoupon,
	allCoupons,
	updateCoupon,
};
