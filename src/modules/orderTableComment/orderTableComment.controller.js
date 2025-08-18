const { saveComment, getOrderComment } = require("./orderTableComment.services");
const saveCommentController = async (req, res) => {
    const { orderId } = req.params;
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
        return res.status(400).json({ message: "Comment is required" });
    }

    try {
        const order = await saveComment(orderId, comment);
        res.status(200).json({ message: "Comment saved", comment: order.comment });
    } catch (error) {
        console.error("Save Comment Error:", error);
        res.status(500).json({ message: error.message || "Internal Server Error" });
    }
};


const getCommentController = async (req, res) => {
    try {
        const { orderId } = req.params;
        const comment = await getOrderComment(orderId);

        if (!comment) {
            return res.status(404).json({ success: false, message: "No comment found" });
        }

        res.status(200).json({ success: true, data: comment });
    } catch (error) {
        console.error("Get comment error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
module.exports = { saveCommentController, getCommentController };