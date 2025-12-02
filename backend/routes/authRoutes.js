const express = require("express");
const { signup, verifyOtp, cancelSignup } = require("../controllers/authController");

const router = express.Router();

router.post("/signup", signup);
router.post("/verify-otp", verifyOtp);
router.post("/cancel", cancelSignup);

module.exports = router;
