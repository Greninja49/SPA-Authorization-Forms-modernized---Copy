const mongoose = require("mongoose");

const accepted = mongoose.Schema({
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
  ticketstatus: String,
});

const acceptedform = new mongoose.model("Acceptedforms", accepted);
module.exports = acceptedform;
