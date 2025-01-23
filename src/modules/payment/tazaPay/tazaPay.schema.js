// models/transactionModel.js
const mongoose = require("mongoose");

const tazaPaySchema = new mongoose.Schema(
	{
		customerName: { type: String, required: true },
		customerEmail: { type: String, required: true },
		customerCountry: { type: String, required: true },
		amount: { type: Number, required: true },
		invoiceCurrency: { type: String, default: "USD" }, // No need for required when default is provided
		transactionDescription: { type: String, required: true },
		orderId: { type: String, required: true },
		paymentId: { type: String, required: true },
		tazaPayData: { type: Object, required: true },
	},
	{ timestamps: true },
);

const MTazaPay = mongoose.model("TazaPay", tazaPaySchema);

module.exports = MTazaPay;
