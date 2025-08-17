const express = require("express");
const { saveCommentController, getCommentController } = require("./orderTableComment.controller");
const router = express.Router();


// POST /orders/save-comment/:orderId
router.post("/save-comment/:orderId", saveCommentController);


router.get("/get-comment/:orderId", getCommentController);
module.exports = router;