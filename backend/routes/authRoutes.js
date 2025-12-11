const express = require("express");
const { signup, verifyOtp, cancelSignup,resendOtp } = require("../controllers/authController");

const router = express.Router();

router.post("/signup", signup);
router.post("/verify-otp", verifyOtp);
router.post("/cancel", cancelSignup);
router.post("/resend-otp", resendOtp);


module.exports = router;
