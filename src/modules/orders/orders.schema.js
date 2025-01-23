const mongoose = require("mongoose");
const { challengeSchema } = require("../challenge/challenges.schema");
const { Schema } = mongoose;
const { MCoupon } = require("../coupon/coupon.schema");

const buyerDetailsSchema = new Schema(
	{
		first: { type: String },
		last: { type: String },
		country: { type: String },
		addr: { type: String },
		city: { type: String },
		zipCode: { type: String },
		phone: { type: String },
		userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
		email: {
			type: String,
			required: [true, "Email is required"],
			match: [/^\S+@\S+\.\S+$/, "Email is invalid"],
		},
		password: { type: String, required: true },
	},
	{
		_id: false,
	}
);

const havenCapitalDetailsSchema = new Schema(
	{
		havenUserName: { type: String },
		havenUserEmail: {
			type: String,
		},
		mt5accountId: { type: String },
	},
	{
		_id: false,
	}
);

const orderSchema = new Schema(
	{
		orderId: { type: String, unique: true },
		orderStatus: {
			type: String,
			enum: ["Processing", "Pending", "Accepted", "Delivered", "Cancelled"],
			default: "Pending",
		},
		paymentStatus: {
			type: String,
			enum: ["Unpaid", "Processing", "Paid", "Refunded", "Failed"],
			default: "Unpaid",
		},
		group: { type: String },
		paymentMethod: { type: String },
		orderItems: { type: [challengeSchema], required: true },
		group: { type: String },
		buyerDetails: {
			type: buyerDetailsSchema,
			required: true,
		},
		havenCapitalDetails: {
			type: havenCapitalDetailsSchema,
			default: null,
		},
		referralCode: { type: String, default: String },
		subtotal: { type: Number, default: null }, // challenge_price
		discountPrice: { type: Number, default: null },
		totalPrice: { type: Number, default: null },
		couponClaimed: {
			type: Schema.Types.ObjectId,
			ref: "Coupon",
			default: null,
		},
		addOns: { type: Number, default: null },
		addOnsName: { type: String, default: null },
		isGiveAway: { type: Boolean, default: false },
	},
	{
		timestamps: true,
	}
);

// Pre-save middleware to generate a unique 4-digit numeric code for orderId
orderSchema.pre("save", function (next) {
	if (!this.orderId) {
		// Generate a random 6-digit number
		const uniqueId = Math.floor(100000 + Math.random() * 900000); // Generates a number between 100000 and 999999
		this.orderId = `#${uniqueId}`;
	}
	next();
});

// Post-save middleware to update the corresponding coupon's claimedOrders array
orderSchema.post("save", async function (doc, next) {
	try {
		if (doc.couponClaimed) {
			await MCoupon.findByIdAndUpdate(
				doc.couponClaimed,
				{
					$push: { claimedOrders: doc._id },
				},
				{ new: true, useFindAndModify: false }
			);
		}
		next();
	} catch (error) {
		next(error);
	}
});

// Define the Mongoose model for the "Order" collection using the orderSchema
const MOrder = mongoose.model("Order", orderSchema);

module.exports = {
	MOrder,
	orderSchema,
};
