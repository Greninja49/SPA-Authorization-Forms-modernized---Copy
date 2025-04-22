const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");
const hbs = require("hbs");
const bodyParser = require("body-parser");
const mongoose = require("./db/conn.js");
const multer = require("multer");
const formmodel = require("./models/formdata.js");
const acceptmodel = require("./models/accepted forms.js");
const rejectmodel = require("./models/rejected forms.js");
const usermodel = require("./models/newuser.js");
const { spawn } = require("child_process");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const nodemailer = require("nodemailer");
require("dotenv").config({ path: "./credentials.env" });
const { userInfo } = require("os");
const port = process.env.port || 4000;
var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.email,
    pass: process.env.apppassword,
  },
});
var mailOptions = {
  from: process.env.email,
  to: "hadiskhanofficial@gmail.com",
  subject: "Sending Email using Node.js",
  text: "That was easy!",
};

function isAuthenticatedUser(req, res) {
  if (req.session.currentuser && req.session.currentuser.tag == "User") {
    return res.redirect("/dashboard");
  } else {
    return res.redirect("/");
  }
}

function isAuthenticatedAdmin(req, res) {
  if (req.session.currentuser && req.session.currentuser.tag == "Admin") {
    return res.redirect("/admin");
  } else {
    return res.redirect("/");
  }
}
function isAuthenticatedHOD(req, res) {
  if (req.session.currentuser && req.session.currentuser.tag == "HOD") {
    return res.redirect("/HODdashboard");
  } else {
    return res.redirect("/");
  }
}

app.use(
  session({
    secret: "ILGTUVBlhgkytfglbdghlLVDCHGJi529780PITKGFe354547o6",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: "mongodb://localhost:27017/SAP",
    }),
    cookie: {
      maxAge: 1000 * 60 * 60,
    },
  })
);

app.use(express.static(__dirname + "/public"));

app.set("view engine", "hbs");
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// form upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Directory to save the uploaded images
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });
// Rendered data
const ga = [
  "Ajmer",
  "Delhi",
  "Gaziabad",
  "Greater Noida",
  "Gurugram",
  "Kaithal",
  "Kanpur",
  "Karnal",
  "Muzzafarnagar",
  "Noida",
  "Rewari",
];

const Dept_Name = [
  "Admin, IR and ER",
  "BD, GS and CS",
  "CC",
  "CNG Marketing",
  "CNG O and M (Electrical)",
  "CNG O and M and Marketing",
  "CNG Projects and Steel",
  "Contract and Procurment",
  "Corporate Communication",
  "Corporate Strategy and Internal Audit",
  "CRM",
  "CS",
  "CSR",
  "DAK",
  "DC Cell",
  "ERP and IT",
  "Finance",
  "Fire and Safety",
  "GA Ajmer",
  "GA Banda",
  "GA Gurugram",
  "GA Kanpur",
  "GA Karnal and Kaithal",
  "GA Muzzaffarnagar",
  "GA Rewari",
  "Harayana Group",
  "HRD and Employee Services",
  "IIB",
  "Internal Audit",
  "Learning Plan and Development",
  "Left IGl",
  "Legal",
  "Marketing",
  "MD cell",
  "O and M",
  "PNG and CNG Projects",
  "PNG Marketing",
  "PNG Marketing(Commercial)",
  "PNG Marketing(industrial)",
  "PNG O and M",
  "Project Expediting",
  "Projects",
  "Regulatory Coorporate Affairs and Risk Management",
  "Stores",
  "Vigil Mechanism",
];

Todaysdate = [
  JSON.stringify(new Date().getDate()),
  JSON.stringify(new Date().getMonth() + 1),
  JSON.stringify(new Date().getFullYear()),
];
const here = Todaysdate[0] + "/" + Todaysdate[1] + "/" + Todaysdate[2];

app.get("/form", async (req, res) => {
  if (req.session.currentuser) {
    const userinfo = req.session.currentuser;
    const modelinfo = await usermodel.findOne({ SAPID: userinfo.SAPID });
    const pagedata = {
      SAPID: modelinfo.SAPID,
      Rname: modelinfo.name,
      dept_Name: modelinfo.subtag,
      time: here,
      GA: modelinfo.Area,
    };
    res.render("SPA form", pagedata);
  } else {
    res.redirect("/");
  }
});

app.post("/submit", async (req, res) => {
  if (req.session.currentuser) {
    const { auth, sys, Cl } = req.body;
    let authL = "";
    let ClL = "";
    const userinfo = req.session.currentuser;
    if (Array.isArray(auth)) {
      for (let i = 0; i < auth.length; i++) {
        authL += auth[i] + ", ";
      }
      authL = authL.slice(0, -2);
    } else if (typeof auth === "string") {
      authL = auth;
    }
    if (Array.isArray(Cl)) {
      for (let i = 0; i < Cl.length; i++) {
        ClL += Cl[i] + ", ";
      }
      ClL = ClL.slice(0, -2);
    } else if (typeof auth === "string") {
      ClL = Cl;
    }
    const formview = new formmodel({
      Requestor: userinfo.name,
      SAPID: userinfo.SAPID,
      DeptName: userinfo.subtag,
      Areaname: userinfo.Area,
      Authreq: authL,
      systype: sys,
      Client: ClL,
      Date: here,
      authgiven: null,
      authorized: 0,
      HODsubtag: "",
      authstatus: "waiting",
      ticketstatus: "open",
    });

    try {
      const result = await formview.save();

      mailOptions.to = userinfo.Email;
      mailOptions.subject = "Submission of SPA form";
      mailOptions.text = `Dear ${userinfo.name},We have recieved your SPA form submitted on ${here} for authorization`;
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });
      res.redirect("/");
    } catch (error) {
      console.error("Error saving formview:", error);
      res.status(500).send("An error occurred while saving the form.");
    }
  } else {
    res.redirect("/");
  }
});

app.post("/authorize", async (req, res) => {
  if (req.session.currentuser && req.session.currentuser.tag == "Admin") {
    const userinfo = req.session.currentuser;
    const { objectid } = req.body;
    const openform = await formmodel.find({ _id: objectid });
    const info = {
      openform: openform,
      SAPID: userinfo.SAPID,
    };
    res.render("HODformdata", info);
  } else {
    res.redirect("/");
  }
});
app.post("/HODauthorize", async (req, res) => {
  if (req.session.currentuser && req.session.currentuser.tag == "HOD") {
    const userinfo = req.session.currentuser;
    const { objectid } = req.body;
    const openform = await formmodel.find({ _id: objectid });
    const info = {
      openform: openform,
      SAPID: userinfo.SAPID,
    };
    res.render("HODformdata", info);
  } else {
    res.redirect("/");
  }
});

app.post("/HODstatereject", async (req, res) => {
  if (req.session.currentuser && req.session.currentuser.tag == "HOD") {
    var rejectlist = req.body.formcheckbox;
    const userinfo = req.session.currentuser;

    if (typeof rejectlist === "string") {
      rejectlist = [rejectlist];
    }

    try {
      for (let i = 0; i < rejectlist.length; i++) {
        const openform = await formmodel.findOne({ _id: rejectlist[i] });
        if (!openform) continue;

        await formmodel.updateOne(
          { _id: openform._id },
          {
            $set: {
              authgiven: openform.authgiven
                ? openform.authgiven + "," + userinfo.name
                : userinfo.name,
              authstatus: "rejected",
            },
          }
        );

        const rejectview = new rejectmodel({
          _id: openform._id,
          Requestor: openform.Requestor,
          SAPID: openform.SAPID,
          DeptName: openform.DeptName,
          Areaname: openform.Areaname,
          Authreq: openform.Authreq,
          systype: openform.systype,
          Client: openform.Client,
          Date: openform.Date,
          authgiven: userinfo.name,
          HODsubtag: userinfo.SAPID,
          authstatus: "rejected",
        });
        await rejectview.save();

        await formmodel.deleteOne({ _id: openform._id });

        const useremail = await usermodel.findOne({ SAPID: openform.SAPID });
        if (useremail) {
          mailOptions.to = useremail.Email;
          mailOptions.subject = "Rejection of SAP form";
          mailOptions.html = `Dear ${useremail.name},<br>We regret to inform you that your SAP form submitted on ${openform.Date} has been rejected for authorization.`;
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log(error);
            } else {
              console.log("Email sent: " + info.response);
            }
          });
        }
      }

      res.redirect("/HODdashboard");
    } catch (err) {
      res.redirect("/HODdashboard");
    }
  } else {
    res.redirect("/");
  }
});

app.post("/HODstateaccept", async (req, res) => {
  if (req.session.currentuser && req.session.currentuser.tag == "HOD") {
    var acceptlist = req.body.formcheckbox;
    const userinfo = req.session.currentuser;

    if (typeof acceptlist === "string") {
      acceptlist = [acceptlist];
    }

    try {
      for (let i = 0; i < acceptlist.length; i++) {
        const openform = await formmodel.findOne({ _id: acceptlist[i] });
        if (!openform) continue;

        await formmodel.updateOne(
          { _id: openform._id },
          {
            $set: {
              authgiven: openform.authgiven
                ? openform.authgiven + "," + userinfo.name
                : userinfo.name,
              authstatus: "Authorized by " + userinfo.name,
              HODsubtag: userinfo.SAPID,
            },
          }
        );
        const useremail = await usermodel.findOne({ SAPID: openform.SAPID });
        if (useremail) {
          mailOptions.to = useremail.Email;
          mailOptions.subject = "Authorization of SAP form";
          mailOptions.html = `Dear ${useremail.name},<br>We are happy to inform you that your SAP form submitted on ${openform.Date} has been authorized by the HOD`;
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log(error);
            } else {
              console.log("Email sent: " + info.response);
            }
          });
        }
      }

      res.redirect("/HODdashboard");
    } catch (err) {
      res.redirect("/HODdashboard");
    }
  } else {
    res.redirect("/");
  }
});

app.post("/statereject", async (req, res) => {
  if (req.session.currentuser && req.session.currentuser.tag == "Admin") {
    var rejectlist = req.body.formcheckbox;
    const userinfo = req.session.currentuser;

    if (typeof rejectlist === "string") {
      rejectlist = [rejectlist];
    }

    try {
      for (let i = 0; i < rejectlist.length; i++) {
        const openform = await formmodel.findOne({ _id: rejectlist[i] });
        if (!openform) continue;

        await formmodel.updateOne(
          { _id: openform._id },
          {
            $set: {
              authgiven: openform.authgiven
                ? openform.authgiven + "," + userinfo.name
                : userinfo.SAPID,
              authstatus: "rejected",
            },
          }
        );

        const rejectview = new rejectmodel({
          _id: openform._id,
          Requestor: openform.Requestor,
          SAPID: openform.SAPID,
          DeptName: openform.DeptName,
          Areaname: openform.Areaname,
          Authreq: openform.Authreq,
          systype: openform.systype,
          Client: openform.Client,
          Date: openform.Date,
          authgiven: userinfo.name,
          authstatus: "rejected",
        });
        await rejectview.save();

        await formmodel.deleteOne({ _id: openform._id });

        const useremail = await usermodel.findOne({ SAPID: openform.SAPID });
        if (useremail) {
          mailOptions.to = useremail.Email;
          mailOptions.subject = "Rejection of SAP form";
          mailOptions.html = `Dear ${useremail.name},<br>We regret to inform you that your SAP form submitted on ${openform.Date} has been rejected for authorization.`;
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log(error);
            } else {
              console.log("Email sent: " + info.response);
            }
          });
        }
      }

      res.redirect("/admin");
    } catch (err) {
      res.redirect("/admin");
    }
  } else {
    res.redirect("/");
  }
});

app.post("/stateaccept", async (req, res) => {
  if (req.session.currentuser && req.session.currentuser.tag == "Admin") {
    var acceptlist = req.body.formcheckbox;
    const userinfo = req.session.currentuser;

    if (typeof acceptlist === "string") {
      acceptlist = [acceptlist];
    }

    try {
      for (let i = 0; i < acceptlist.length; i++) {
        const openform = await formmodel.findOne({ _id: acceptlist[i] });
        if (!openform) continue;

        if (openform.authorized === 0) {
          await formmodel.updateOne(
            { _id: openform._id },
            {
              $set: {
                authgiven: userinfo.name,
                authstatus: "Authorized by " + userinfo.name,
              },
              $inc: { authorized: 1 },
            }
          );
          const useremail = await usermodel.find({ tag: "Admin" });
          for (let j = 0; j < useremail.length; j++) {
            if (useremail) {
              mailOptions.to = useremail[j].Email;
              mailOptions.subject = "Admin Authorization of SAP Form";
              mailOptions.html = `Respected ${useremail[j].name},<br>A form has been authorized by ${userinfo.name}`;
              transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                  console.log(error);
                } else {
                  console.log("Email sent: " + info.response);
                }
              });
            }
          }
        } else if (openform.authorized === 1) {
          const currentAuthGiven = openform.authgiven;
          if (currentAuthGiven !== userinfo.name) {
            await formmodel.updateOne(
              { _id: openform._id },
              {
                $set: { authgiven: currentAuthGiven + "," + userinfo.name },
                $inc: { authorized: 1 },
              }
            );

            const acceptview = new acceptmodel({
              _id: openform._id,
              Requestor: openform.Requestor,
              SAPID: openform.SAPID,
              DeptName: openform.DeptName,
              Areaname: openform.Areaname,
              Authreq: openform.Authreq,
              systype: openform.systype,
              Client: openform.Client,
              Date: openform.Date,
              authgiven: currentAuthGiven + "," + userinfo.name,
              authstatus: "Accepted",
              ticketstatus: "off",
            });
            await acceptview.save();

            await formmodel.deleteOne({ _id: openform._id });

            const useremail = await usermodel.findOne({
              SAPID: openform.SAPID,
            });
            if (useremail) {
              mailOptions.to = useremail.Email;
              mailOptions.subject = "Acceptance of SAP form";
              mailOptions.html = `Dear ${useremail.name},<br>We are happy to inform you that your SAP form submitted on ${openform.Date} has been authorized`;
              transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                  console.log(error);
                } else {
                  console.log("Email sent: " + info.response);
                }
              });
            }
          }
        }
      }

      res.redirect("/admin");
    } catch (err) {
      console.log(err);
      res.redirect("/admin");
    }
  } else {
    res.redirect("/");
  }
});

app.get("/adminhistory", async (req, res) => {
  if (req.session.currentuser && req.session.currentuser.tag == "Admin") {
    const userinfo = req.session.currentuser;
    const rejectinfo = await rejectmodel.find();
    const acceptinfo = await acceptmodel.find();
    const historydata = {
      accept: acceptinfo,
      reject: rejectinfo,
      SAPID: userinfo.SAPID,
    };
    res.render("adminhistory", historydata);
  } else {
    res.redirect("/");
  }
});

app.get("/HODhistory", async (req, res) => {
  if (req.session.currentuser && req.session.currentuser.tag == "HOD") {
    const userinfo = req.session.currentuser;
    const rejectinfo = await rejectmodel.find({ HODsubtag: userinfo.SAPID });
    const acceptinfo = await formmodel.find({ HODsubtag: userinfo.SAPID });
    const historydata = {
      accept: acceptinfo,
      reject: rejectinfo,
      HOD: userinfo.SAPID,
    };
    res.render("HODhistory", historydata);
  } else {
    res.redirect("/");
  }
});

app.get("/newuser", async (req, res) => {
  const Name = req.session.verify.Name;
  const Email = req.session.verify.Email;
  const password = req.session.verify.password;
  const geo = req.session.verify.geo;
  const Dept = req.session.verify.Dept;
  const SAPID = req.session.verify.SAPID;
  Utype = "User";
  let Areas = "";
  if (Array.isArray(geo)) {
    for (let i = 0; i < geo.length; i++) {
      Areas += geo[i] + ", ";
    }
    Areas = Areas.slice(0, -2);
  } else if (typeof geo === "string") {
    Areas = geo;
  }
  let SAPIDL = SAPID;
  if (!SAPID || SAPID === "") {
    const rename = Name.split(" ").join("");
    const userinfo = await usermodel.find();
    const userlength = userinfo.length;
    SAPIDL = rename + "SAP" + (userlength + 1).toString();
  }
  try {
    const useremailcheck = await usermodel.findOne({ Email: Email });
    if (useremailcheck) {
      req.session.message = "open";
      return res.redirect("/signup");
    }

    const userview = new usermodel({
      name: Name,
      tag: Utype,
      subtag: Dept,
      Email: Email,
      Area: Areas,
      SAPID: SAPIDL,
      Password: password,
      PassState: "",
    });
    await userview.save();

    mailOptions.to = userview.Email;
    mailOptions.subject = "Creation of SAP ID";
    mailOptions.html = `Dear ${userview.name},You have been added to the SAP Form user list. Your login credentials are as follows:<br>LoginID: ${SAPIDL}<br>Password: ${password}`;

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
    req.session.destroy();
    res.redirect("/");
  } catch (error) {
    console.error("Error while creating user:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/userlist", async (req, res) => {
  if (req.session.currentuser && req.session.currentuser.tag == "Admin") {
    const userlist = await usermodel.find();
    const userinfo = req.session.currentuser;
    const users = {
      SAPID: userinfo.SAPID,
      user: userlist,
    };
    res.render("userlist", users);
  } else {
    res.redirect("/");
  }
});

app.get("/HODuserlist", async (req, res) => {
  if (req.session.currentuser && req.session.currentuser.tag == "HOD") {
    const userlist = await usermodel.find();
    const userinfo = req.session.currentuser;
    const users = {
      user: userlist,
      HOD: userinfo.SAPID,
    };
    res.render("HODuserlist", users);
  } else {
    res.redirect("/");
  }
});

app.post("/login", async (req, res) => {
  const { SAPID, Pass } = req.body;
  const users = await usermodel.findOne({ SAPID: SAPID });
  req.session.currentuser = users;
  const userinfo = req.session.currentuser;
  if (users == null) {
    errmsg = "Incorrect ID";
    res.render("login", { errmsg });
  } else if (userinfo.tag == "HOD" && Pass == userinfo.Password) {
    isAuthenticatedHOD(req, res);
  } else if (userinfo.tag == "Admin" && Pass == userinfo.Password) {
    isAuthenticatedAdmin(req, res);
  } else if (userinfo.tag == "User" && Pass == userinfo.Password) {
    isAuthenticatedUser(req, res);
  } else {
    errmsgpass = "Incorrect Password";
    res.render("login", { errmsgpass });
  }
});

app.post("/logout", (req, res) => {
  if (req.session.currentuser) {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).send("An error occurred while logging out.");
      }
      res.redirect("/");
    });
  } else {
    res.redirect("/");
  }
});

app.get("/dashboard", async (req, res) => {
  if (req.session.currentuser && req.session.currentuser.tag == "User") {
    const userinfo = req.session.currentuser;
    const allforms = await formmodel.find({ SAPID: userinfo.SAPID });
    const rejectinfo = await rejectmodel.find({ SAPID: userinfo.SAPID });
    const acceptinfo = await acceptmodel.find({ SAPID: userinfo.SAPID });
    const UserForms = {
      trueforms: allforms,
      accept: acceptinfo,
      reject: rejectinfo,
      SAPID: userinfo.SAPID,
      name: userinfo.name,
    };
    res.render("UserDashboard", UserForms);
  } else {
    res.redirect("/");
  }
});

app.get("/HODdashboard", async (req, res) => {
  if (req.session.currentuser && req.session.currentuser.tag == "HOD") {
    const userinfo = req.session.currentuser;
    const allforms = await formmodel.find({
      DeptName: userinfo.subtag,
      HODsubtag: "",
    });
    const UserForms = {
      trueforms: allforms,
      SAPID: userinfo.SAPID,
      name: userinfo.name,
    };
    res.render("HODadministration", UserForms);
  } else {
    res.redirect("/");
  }
});

app.get("/admin", async (req, res) => {
  if (req.session.currentuser && req.session.currentuser.tag == "Admin") {
    try {
      const userinfo = req.session.currentuser;
      const hodApprovedForms = await formmodel.find({ HODsubtag: { $ne: "" } });
      const users = await usermodel.find({}, { name: 1, SAPID: 1, _id: 0 });

      const filteredUsers = users.filter(
        (user) => user.SAPID !== userinfo.SAPID
      );

      const combinedUsers = filteredUsers.map((user) => ({
        name: user.name,
        SAPID: user.SAPID,
      }));

      const FormInfo = {
        SAPID: userinfo.SAPID,
        Form: hodApprovedForms,
        dept_Name: Dept_Name,
        adminname: userinfo.name,
        users: combinedUsers,
        GA: ga,
      };

      res.render("Administration", FormInfo);
    } catch (error) {
      console.error("Error fetching forms:", error);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.redirect("/");
  }
});

app.get("/", (req, res) => {
  if (req.session.currentuser) {
    if (req.session.currentuser && req.session.currentuser.tag == "Admin") {
      isAuthenticatedAdmin(req, res);
    } else if (
      req.session.currentuser &&
      req.session.currentuser.tag == "HOD"
    ) {
      isAuthenticatedHOD(req, res);
    } else if (
      req.session.currentuser &&
      req.session.currentuser.tag == "User"
    ) {
      isAuthenticatedUser(req, res);
    }
  } else {
    if (req.session) {
      req.session.destroy();
    }
    res.render("login");
  }
});

app.get("/passwordreset", async (req, res) => {
  const { message } = req.session;
  const SAPID = message ? message.SAPID : "";

  let state = {
    SAPID: SAPID,
    errmsg: "",
    redirectto: "/otpsend",
    toggle: "otpclose",
    passopen: "close",
  };

  if (message) {
    if (message.state === "otpsent") {
      state = {
        ...state,
        errmsg: "OTP Already Sent",
        toggle: "otpopen",
      };
    } else if (message.state === "Incorrect OTP") {
      state = {
        ...state,
        errmsg: "Incorrect OTP",
        toggle: "otpopen",
        passopen: "close",
      };
    } else if (message.state === "createpass") {
      state = {
        ...state,
        errmsg: "",
        redirectto: "/updatepass",
        toggle: "otpclose",
        passopen: "open",
      };
    } else if (message.state === "Invalid SAPID") {
      state = {
        ...state,
        errmsg: "Invalid SAPID",
        toggle: "otpclose",
        passopen: "close",
        SAPID: "",
      };
    }
  }

  res.render("forgotpassword", state);
});

app.post("/otpsend", async (req, res) => {
  let { SAPID, OTP } = req.body;

  if (!SAPID && req.session.message && req.session.message.SAPID) {
    SAPID = req.session.message.SAPID;
  }

  if (!SAPID) {
    req.session.message = { state: "Invalid SAPID", SAPID: "" };
    return res.redirect("/passwordreset");
  }

  const useremail = await usermodel.findOne({ SAPID: SAPID });

  if (!useremail) {
    req.session.message = { state: "Invalid SAPID", SAPID: "" };
    return res.redirect("/passwordreset");
  }

  if (!OTP) {
    const digits = "0123456789";
    let generatedOTP = "";
    for (let i = 0; i < 6; i++) {
      generatedOTP += digits[Math.floor(Math.random() * 10)];
    }

    await usermodel.updateOne(
      { SAPID: SAPID },
      { $set: { PassState: generatedOTP } }
    );

    mailOptions.to = useremail.Email;
    mailOptions.subject = "OTP for password";
    mailOptions.html = `Dear ${useremail.name},<br>OTP to reset your password is ${generatedOTP}`;

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Email send error: ", error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });

    req.session.message = { state: "otpsent", SAPID: SAPID };
    return res.redirect("/passwordreset");
  }

  if (OTP === useremail.PassState) {
    await usermodel.updateOne({ SAPID: SAPID }, { $set: { PassState: "" } });
    req.session.message = { state: "createpass", SAPID: SAPID };
    return res.redirect("/passwordreset");
  } else {
    req.session.message = { state: "Incorrect OTP", SAPID: SAPID };
    return res.redirect("/passwordreset");
  }
});

app.get("/signup", (req, res) => {
  if (req.session.verify) {
    delete req.session.verify;
  }
  if (req.session.message) {
    state = "open";
    errmsg = req.session.message;
    delete req.session.message;
  } else {
    state = "close";
    errmsg = "";
  }
  const check = {
    State: state,
    Errmsg: errmsg,
    GA: ga,
    dept_Name: Dept_Name,
  };
  res.render("signup", check);
});

app.get("/Emailverify", (req, res) => {
  if (req.session.message == "not verified") {
    errmsg = "incorrect OTP";
    delete req.session.message;
  } else {
    errmsg = "";
  }
  const OTPcheck = {
    Errmsg: errmsg,
  };
  res.render("Loginverify.hbs", OTPcheck);
});

app.post("/updatepass", async (req, res) => {
  const { newpass } = req.body;
  SAPID = req.session.message.SAPID;

  await usermodel.updateOne({ SAPID: SAPID }, { $set: { Password: newpass } });

  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).send("An error occurred while logging out.");
    }
  });

  res.redirect("/");
});

app.post("/updateuser", async (req, res) => {
  if (req.session.currentuser && req.session.currentuser.tag === "Admin") {
    try {
      const { Users, Utype, DDTvalue, geo } = req.body;

      // Prepare Users and Areas
      let Userss = Array.isArray(Users) ? Users : [Users];
      let Areas = "";

      if (Array.isArray(geo)) {
        Areas = geo.join(", ");
      } else if (typeof geo === "string") {
        Areas = geo;
      }
      const updateFields = { tag: Utype };

      if (Areas) {
        updateFields.Area = Areas;
      }

      if (DDTvalue) {
        updateFields.subtag = DDTvalue;
      }

      for (const user of Userss) {
        await usermodel.updateOne({ SAPID: user }, { $set: updateFields });
      }

      res.redirect("/");
    } catch (error) {
      console.error("Error updating users:", error);
      res.redirect("/");
    }
  } else {
    res.redirect("/");
  }
});

app.post("/Emailverification", async (req, res) => {
  const { Name, Email, password, geo, Dept, SAPID } = req.body;
  const useremailcheck = await usermodel.findOne({ Email: Email });
  const allowedDomain = "gmail.com";
  const emailDomain = Email.split("@")[1];
  if (useremailcheck) {
    req.session.message = "Email ID already in use";
    return res.redirect("/signup");
  } else {
    if (!req.session.verify) {
      if (emailDomain !== allowedDomain) {
        req.session.message = "Invalid email domain";
        return res.redirect("/signup");
      }
      const digits = "0123456789";
      let generatedOTP = "";
      for (let i = 0; i < 6; i++) {
        generatedOTP += digits[Math.floor(Math.random() * 10)];
      }
      req.session.verify = {
        State: "open",
        OTP: generatedOTP,
        errmsg: "OTP sent to Email",
        Email: Email,
        Name: Name,
        password: password,
        geo: geo,
        Dept: Dept,
        SAPID: SAPID,
      };
      console.log(req.session.verify.SAPID);
      mailOptions.to = Email;
      mailOptions.subject = "OTP for Verification";
      mailOptions.html = `OTP For email Verification is ${generatedOTP}`;

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Email send error: ", error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });
      res.redirect("/Emailverify");
    } else {
      res.redirect("/Emailverify");
    }
  }
});

app.post("/Emailverificationotp", (req, res) => {
  const { OTP } = req.body;
  if (req.session.verify.OTP == OTP) {
    res.redirect("/newuser");
  } else {
    req.session.message = "not verified";
    res.redirect("/Emailverify");
  }
});

app.post("/deleteuser", async (req, res) => {
  if (req.session.currentuser && req.session.currentuser.tag == "Admin") {
    const { user } = req.body;
    let UsersL = Array.isArray(user) ? user : [user];
    for (let i = 0; i < UsersL.length; i++) {
      await usermodel.deleteOne({ SAPID: UsersL[i] });
    }
    res.redirect("/userlist");
  } else {
    res.redirect("/");
  }
});

app.post("/toggle", async (req, res) => {
  if (req.session.currentuser && req.session.currentuser.tag == "Admin") {
    const toggleState = req.body.toggleState;
    const formid = req.body.userId;
    const form = await acceptmodel.findOne({ _id: formid });
    let updatetoggle = toggleState;
    if (toggleState == "open") {
      updatetoggle = "closed";
    } else {
      updatetoggle = "open";
    }
    if (form) {
      await acceptmodel.updateOne(
        { _id: formid },
        { $set: { ticketstatus: updatetoggle } }
      );
    } else {
      console.log("Toggle State:", toggleState);
      console.log("Form ID:", formid);
    }
    res.redirect("/adminhistory");
  } else {
    res.redirect("/");
  }
});

app.post("/upload", upload.single("image"), async (req, res) => {
  const uploadedImage = req.file;

  if (!uploadedImage) {
    return res.redirect("/uploadimage");
  }

  const imagePath = path.resolve(uploadedImage.path);

  const pythonProcess = spawn("python", ["extract_text.py", imagePath]);

  let result = "";
  pythonProcess.stdout.on("data", (data) => {
    result += data.toString();
  });

  pythonProcess.stderr.on("data", (error) => {
    console.error(`Error: ${error.toString()}`);
  });

  pythonProcess.on("close", async (code) => {
    if (code !== 0) {
      return res.status(500).send("Error processing the image.");
    }

    let extractedData;
    try {
      extractedData = JSON.parse(result);
    } catch (error) {
      return res.status(500).send("Error parsing extracted data.");
    }

    const formview = new formmodel({
      Requestor: extractedData["Requester Name"] || "Unknown",
      SAPID: extractedData["SAP Login ID"] || "Unknown",
      DeptName: extractedData["Department"] || "Unknown",
      Areaname: extractedData["Geographical Area"] || "Unknown",
      Authreq: [
        extractedData["Transaction"] !== "null"
          ? `Transaction: [${extractedData["Transaction"]}]`
          : "",
        extractedData["Report"] !== "null"
          ? `Report: [${extractedData["Report"]}]`
          : "",
        extractedData["Other Object/Activity"] !== "null"
          ? `Other Object/Activity: [${extractedData["Other Object/Activity"]}]`
          : "",
      ]
        .filter(Boolean)
        .join(" "),
      systype: extractedData["System"] || "Unknown",
      Client: extractedData["Client"] || "Unknown",
      Date: here,
      authgiven: null,
      authorized: 0,
      HODsubtag: "",
      authstatus: "waiting",
      ticketstatus: "open",
    });

    try {
      await formview.save();
      console.log("Extracted Data saved to database:", formview);
      res.redirect("/");
    } catch (err) {
      console.error("Error saving form:", err);
      return res.status(500).send("Error saving form data.");
    }
  });
});

app.get("/uploadimage", (req, res) => {
  if (req.session.currentuser && req.session.currentuser.tag == "Admin") {
    res.render("UploadImage.hbs");
  } else {
    res.redirect("/");
  }
});

app.listen(port, () => {
  console.log(`Server is running on port number ${port}`);
});
app.get("*", (req, res) => {
  res.redirect("/");
});
