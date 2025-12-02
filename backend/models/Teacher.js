const mongoose =require("mongoose")

const TeacherSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
});

module.exports= mongoose.model("Teacher", TeacherSchema);
