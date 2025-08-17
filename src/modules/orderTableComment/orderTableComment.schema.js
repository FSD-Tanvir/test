const mongoose = require("mongoose");

const orderCommentSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    comment: { type: String },
});

const orderComment = mongoose.model("OrderComment", orderCommentSchema);

module.exports = orderComment;