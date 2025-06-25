// models/counter.model.js
const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
	_id: { type: String, required: true },
	seq: { type: Number, default: 100000 },
});

const Counter = mongoose.model("Counter", counterSchema);

module.exports = Counter;
// This code defines a Mongoose schema for a counter that can be used to generate unique IDs. The counter starts at 100000 and increments by 1 each time it is used. The _id field is required and serves as the prefix for the generated IDs.
// The Counter model can be used in other parts of the application to generate unique IDs by incrementing the seq field. This is useful for creating unique identifiers for documents in a MongoDB database.
