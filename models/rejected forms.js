const mongoose = require("mongoose");

const rejected = mongoose.Schema({
  Requestor: String,
  SAPID: String,
  DeptName: String,
  Areaname: String,
  Authreq: String,
  systype: String,
  Client: String,
  Date: String,
  authgiven: String,
  authstatus: String,
});

const rejectedform = new mongoose.model("Rejectedforms", rejected);
module.exports = rejectedform;
