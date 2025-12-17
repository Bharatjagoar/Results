const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const TempTeacherSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  isAdmin:{
    type:Boolean,
    required:true
  },
  password: {
    type: String,
    required: true
  },
  otp: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// ⭐ Hash password before saving - Modern Mongoose syntax (no next needed)
TempTeacherSchema.pre("save", async function() {
  if (!this.isModified("password")) return;
  
  this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model("TempTeacher", TempTeacherSchema);