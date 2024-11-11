const mongoose = require("mongoose");

const formdata = mongoose.Schema({
  Requestor: String,
  SAPID: String,
  DeptName: String,
  Areaname: String,
  Authreq: String,
  systype: String,
  Client: String,
  Date: String,
  authgiven: String,
  authorized: Number,
  authstatus: String,
  HODsubtag: String,
  ticketstatus: String,
});

const form = new mongoose.model("SPA FORM", formdata);
module.exports = form;
