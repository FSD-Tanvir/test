const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const jwt = require("jsonwebtoken");
const { challengeSchema } = require("../challenge/challenges.schema.js");

// generate random password
const generateRandomPassword = () => {
	const length = 8;
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@$!%*?&";
	let password = "";
	for (let i = 0; i < length; i++) {
		const randomIndex = Math.floor(Math.random() * charset.length);
		password += charset[randomIndex];
	}
	return password;
};

const purchasedProductSchema = new Schema(
	{
		productId: { type: String, required: true },
		product: { type: challengeSchema, required: true },
	},
	{ _id: false },
	{ timestamps: true }
);

// Define the schema for payment card information

const mt5Account = new Schema(
	{
		account: { type: Number },
		investorPassword: { type: String },
		masterPassword: { type: String },
		group: { type: String },
		productId: { type: String },
		accountStatus: {
			type: String,
			enum: ["active", "inActive", "breached"], // Allowed roles
			default: "active", // Default role if not specified
		},
		challengeStage: { type: String },
		challengeStatus: {
			type: String,
			enum: ["running", "passed"], // Allowed status
			default: "running",
		},
		challengeStageData: { type: Object, required: true },
		passedClaimed: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

// Define the main user schema
const UserSchema = new Schema(
	{
		email: {
			type: String,
			required: [true, "Email is required"],
			unique: true,
			match: [/^\S+@\S+\.\S+$/, "Email is invalid"],
		},
		password: { type: String, default: generateRandomPassword() },
		first: { type: String },
		last: { type: String },
		country: { type: String },
		addr: { type: String },
		city: { type: String },
		zipCode: { type: String },
		phone: { type: String },
		mt5Accounts: { type: [mt5Account] },
		purchasedProducts: {
			type: Map,
			of: purchasedProductSchema,
		},
		orders: { type: [Schema.Types.ObjectId], ref: "Order" },
		role: {
			type: String,
			enum: ["admin", "user", "trader"],
			default: "user",
		},
		affiliate: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

// Virtual for full name
UserSchema.virtual("fullName").get(function () {
	return `${this.first || ""} ${this.last || ""}`.trim();
});

// Method to generate JWT token for user authentication
UserSchema.methods.generateAuthToken = function () {
	const token = jwt.sign(
		{ _id: this._id, role: this.role }, // Payload: user ID and role
		process.env.JWT_SECRET_KEY, // JWT secret key from environment variables
		{ expiresIn: "1h" } // Token expiration time
	);
	return token;
};

// Create mongoose model for 'User' collection using UserSchema
const MUser = mongoose.model("User", UserSchema);

module.exports = MUser;
