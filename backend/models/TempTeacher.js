const mongoose = require("mongoose");

const TempTeacherSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  otp: String,
  expiresAt: Date,
});

// Auto delete expired docs after TTL
TempTeacherSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("TempTeacher", TempTeacherSchema);
