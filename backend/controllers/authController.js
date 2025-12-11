const TempTeacher = require("../models/TempTeacher.js")
const Teacher =require("../models/Teacher.js") 
const sendEmail = require("../utils/sendEmail.js");

// ─────────────────────────────────────────────
// 1. Signup → Generate OTP
// ─────────────────────────────────────────────

module.exports.signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    console.log(req.body)

    // 1️⃣ Check if email already exists in Teacher collection
    const existingTeacher = await Teacher.findOne({ email });

    // 2️⃣ Check if email already exists in TempTeacher (pending OTP verification)
    const existingTemp = await TempTeacher.findOne({ email });

    if (existingTeacher || existingTemp) {
      console.log("heeeeeeeeeeeeeeeeerrrrrrrrrrrrrrrrrrrrreeeeeeeeeeeeeeeeeee");
      return res.status(400).json({
        success: false,
        message: "Email already exists. Please login or use a different email."
      });
    }

    // 3️⃣ Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // 4️⃣ Create temporary teacher entry for OTP verification
    await TempTeacher.create({
      username,
      email,
      password, // we will hash later
      otp,
      expiresAt: new Date(Date.now() + 3 * 60 * 1000), // expires in 3 mins
    });

    // 5️⃣ Send OTP email
    await sendEmail(email, otp);

    return res.json({
      success: true,
      message: "OTP sent to email.",
    });

  } catch (error) {
    console.log("Signup Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


// ─────────────────────────────────────────────
// 2. Verify OTP
// ─────────────────────────────────────────────
module.exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await TempTeacher.findOne({ email });

    if (!record)
      return res.json({ success: false, message: "OTP expired or cancelled" });

    if (record.otp !== otp)
      return res.json({ success: false, message: "Invalid OTP" });

    // Move to Teacher collection
    await Teacher.create({
      username: record.username,
      email: record.email,
      password: record.password,
    });

    await TempTeacher.deleteOne({ email });

    return res.json({ success: true, message: "Verification successful" });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ─────────────────────────────────────────────
// 3. Cancel signup
// ─────────────────────────────────────────────
module.exports.cancelSignup = async (req, res) => {
  try {
    console.log("getting cancel :: -- >> ")
    const { email } = req.body;
    await TempTeacher.deleteOne({ email });

    return res.json({
      success: true,
      message: "Signup cancelled",
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // check if email was in signup process
    const user = await TempTeacher.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Email not found. Please signup again."
      });
    }

    // generate new otp
    const otp = Math.floor(100000 + Math.random() * 900000);

    // save OTP in DB
    await TempTeacher.findOneAndUpdate(
      { email },
      { otp, createdAt: Date.now() },
      { upsert: true }
    );

    // send email
    await sendEmail(
      email,
      `Your new OTP is: ${otp}`
    );

    return res.json({
      success: true,
      message: "OTP resent successfully"
    });
  } catch (error) {
    console.log("RESEND OTP ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong"
    });
  }
};
