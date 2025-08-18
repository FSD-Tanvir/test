const orderComment = require("./orderTableComment.schema");

const saveComment = async (orderId, comment) => {
    const order = await orderComment.findOneAndUpdate(
        { orderId },
        { comment },
        { new: true, upsert: true }
    );
    return order;
};

const getOrderComment = async (orderId) => {
    const cleanOrderId = orderId.replace("#", "");
    return await orderComment.findOne({ orderId: cleanOrderId });
};
module.exports = { saveComment, getOrderComment };