const TempTeacher = require("../models/TempTeacher.js")
const Teacher = require("../models/Teacher.js")
const sendEmail = require("../utils/sendEmail.js");
const { generateToken } = require("../utils/jwt");
const PasswordReset = require("../models/PasswordReset");

// ─────────────────────────────────────────────
// 1. Signup → Generate OTP
// ─────────────────────────────────────────────

module.exports.signup = async (req, res) => {
  try {
    const { username, email, password, isAdmin } = req.body;
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

    // 🔐 BACKEND CHECK
    const adminExists = await Teacher.exists({ isAdmin: true });

    let finalIsAdmin = false;

    if (!adminExists && isAdmin === true) {
      finalIsAdmin = true; // first admin allowed
    }

    // 3️⃣ Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // 4️⃣ Create temporary teacher entry for OTP verification
    await TempTeacher.create({
      username,
      email,
      password, // we will hash later
      otp,
      isAdmin: finalIsAdmin,
      expiresAt: new Date(Date.now() + 3 * 60 * 1000), // expires in 3 mins
    });
    console.log("helow")
    // 5️⃣ Send OTP email
    await sendEmail(email, otp);

    return res.json({
      success: true,
      message: "OTP sent to email.",
    });

  } catch (error) {
    console.log("Signup Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


module.exports.checkAdminExists = async (req, res) => {
  const adminExists = await Teacher.exists({ isAdmin: true });

  return res.json({
    adminExists: !!adminExists
  });
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

    // ⭐ Create teacher instance
    const teacher = new Teacher({
      username: record.username,
      email: record.email,
      isAdmin: record.isAdmin,
      password: record.password, // Already hashed
    });

    // ⭐ Mark password as not modified to skip re-hashing
    teacher.markModified('password');
    teacher.$isNew = false; // Prevent pre-save hook

    // Actually, better approach:
    await Teacher.create({
      username: record.username,
      email: record.email,
      isAdmin: record.isAdmin,
      password: record.password
    });

    // Fetch the created teacher
    const createdTeacher = await Teacher.findOne({ email });

    await TempTeacher.deleteOne({ email });

    // ⭐ Generate JWT token
    const token = generateToken(createdTeacher._id, createdTeacher.email, createdTeacher.isAdmin);

    return res.json({
      success: true,
      message: "Verification successful",
      token,
      user: {
        id: createdTeacher._id,
        username: createdTeacher.username,
        email: createdTeacher.email
      }
    });

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


// ─────────────────────────────────────────────
// 4. Check if user is verified
// ─────────────────────────────────────────────
module.exports.checkStatus = async (req, res) => {
  console.log("this is ht eOTP verify !! ");
  try {
    const { email } = req.query; // or get from token if using JWT

    // Check if user exists in Teacher collection (verified)
    const teacher = await Teacher.findOne({ email });

    if (teacher) {
      return res.json({
        success: true,
        isVerified: true,
        email: teacher.email
      });
    }

    // Check if still in temp (pending verification)
    const tempTeacher = await TempTeacher.findOne({ email });

    if (tempTeacher) {
      return res.json({
        success: true,
        isVerified: false,
        email: tempTeacher.email,
        hasPendingOTP: true
      });
    }

    // User doesn't exist
    return res.json({
      success: false,
      isVerified: false,
      message: "User not found"
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ─────────────────────────────────────────────
// 5. Login
// ─────────────────────────────────────────────
module.exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password);
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Find teacher
    const teacher = await Teacher.findOne({ email });

    if (!teacher) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Check password
    const isPasswordValid = await teacher.comparePassword(password);
    console.log(isPasswordValid);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Generate token
    const token = generateToken(teacher._id, teacher.email);

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: teacher._id,
        username: teacher.username,
        email: teacher.email
      }
    });

  } catch (error) {
    console.log("Login Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

module.exports.checkForAdmin = async (req, res) => {
  console.log(req.body);
  try {
    const checkteacher = await Teacher.findOne({ isAdmin: true })
    console.log(checkteacher);
    if (!checkteacher) {
      return res.status(200).json({
        adminExists: false,
        message: "Admin does not exist"
      })
    }
    
    return res.status(200).json({
      adminExists: true,
      message: "Admin exist"
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

module.exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Always send same response (security)
    const teacher = await Teacher.findOne({ email });

    if (!teacher) {
      return res.json({
        success: true,
        message: "If the email exists, OTP has been sent"
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Remove old OTPs
    await PasswordReset.deleteMany({ email });

    await PasswordReset.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    await sendEmail(email, `Your password reset OTP is ${otp}`);

    return res.json({
      success: true,
      message: "If the email exists, OTP has been sent"
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


module.exports.verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await PasswordReset.findOne({ email, otp });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP"
      });
    }

    record.verified = true;
    await record.save();

    return res.json({
      success: true,
      message: "OTP verified"
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


module.exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const record = await PasswordReset.findOne({ email, verified: true });

    if (!record) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized password reset"
      });
    }

    const teacher = await Teacher.findOne({ email });

    teacher.password = newPassword; // hashing via pre-save
    await teacher.save();

    // Invalidate OTP
    await PasswordReset.deleteMany({ email });

    return res.json({
      success: true,
      message: "Password reset successful"
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
