const mongoose = require("mongoose");

const user = mongoose.Schema({
  name: String,
  tag: String,
  subtag: String,
  Area: String,
  Email: String,
  SAPID: String,
  Password: String,
  PassState: String,
});

const newuser = new mongoose.model("users", user);
module.exports = newuser;
