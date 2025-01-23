const express = require("express");
const { createCoupon, getCoupon, allCoupons, updateCouponHandler,getOrdersByCoupon } = require("./coupon.controller");

const router = express.Router();

// Route to handle POST requests for creating a new coupon
router.post("/create-coupon", createCoupon);

router.get("/", allCoupons);

router.get("/order-by-coupon", getOrdersByCoupon);

// Route to handle GET requests for retrieving a coupon by name
router.get("/coupon/:couponName", getCoupon);

// Route to handle GET requests for retrieving all coupons
router.put("/:id", updateCouponHandler);

module.exports = router;
