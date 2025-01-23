const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const banSchema = new Schema({
    email: { type: String, required: true },
    date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("BanEmail", banSchema)