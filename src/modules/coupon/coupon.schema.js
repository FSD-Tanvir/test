const mongoose = require("mongoose");
const cron = require("node-cron");
const { Schema } = mongoose;

const couponSchema = new Schema(
	{
		couponName: {
			type: String,
			required: true,
			trim: true,
		},
		percentage: {
			type: Number,
			default: 0,
			min: 0, // Ensure percentage is within a valid range
		},
		applicableChallenges: {
			type: [String],
			default: [],
		},
		applicableUsers: {
			type: [String],
			default: [],
		},
		applicablePaymentMethods: {
			type: [String],
			default: [],
		},
		expiryDate: {
			type: Date,
			required: true, // Ensure an expiry date is set
		},
		status: {
			type: String,
			enum: ["active", "expired"], // Define possible statuses
			default: "active", // Set default status to "active"
		},
		claimedOrders: {
			type: [Schema.Types.ObjectId],
			ref: "Order",
		},
	},
	{
		timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
	},
);

// Cron job to update the status of expired coupons
const updateExpiredCoupons = async () => {
	try {
		const now = new Date();
		const result = await mongoose
			.model("Coupon")
			.updateMany(
				{ expiryDate: { $lt: now }, status: "active" },
				{ $set: { status: "expired" } },
			);
		console.log(`${result.modifiedCount} coupons updated to expired status.`);
	} catch (error) {
		console.error("Error updating expired coupons:", error);
	}
};

// Schedule the cron job to run daily at midnight
cron.schedule("0 0 * * *", async () => {
	console.log("Running cron job to update expired coupons...");
	await updateExpiredCoupons();
});

// Define the Mongoose model for the "Coupon" collection using the couponSchema
const MCoupon = mongoose.model("Coupon", couponSchema);

module.exports = {
	MCoupon,
	couponSchema,
};
