const mongoose = require("mongoose");

mongoose.connect("mongodb://0.0.0.0:27017/SAP")
  .then(() => {
    console.log("Db Connected");
  })
  .catch((error) => {
    console.log(error);
  });

module.exports = mongoose;
