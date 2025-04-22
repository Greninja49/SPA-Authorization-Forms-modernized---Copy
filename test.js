app.post("/statereject", async (req, res) => {
  var rejectlist = req.body.formcheckbox;
  const adminname = req.query.adminname;
  try {
    if (typeof rejectlist === "string") {
      rejectlist = [rejectlist];
      for (let i = 0; i < rejectlist.length; i++) {
        // Fetch the form using findOne() to get a single document
        const openform = await formmodel.findOne({ _id: rejectlist[i] });

        if (openform.authorized === 0) {
          // First admin approval
          await formmodel.updateOne(
            { _id: openform._id },
            {
              $set: {
                authgiven: openform.authgiven
                  ? openform.authgiven + "," + adminname
                  : adminname,
                authstatus: "rejected",
              },
              $inc: { authorized: 1 },
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
            authgiven: adminname,
            authstatus: "rejected",
          });
          await rejectview.save();

          // Remove the form from the original collection
          await formmodel.deleteOne({ _id: openform._id });
        } else if (openform.authorized === 1) {
          // Second admin approval
          const currentAuthGiven = openform.authgiven;
          if (currentAuthGiven == adminname) {
            res.redirect(`/admin?adminname=${adminname}`);
          } else {
            await formmodel.updateOne(
              { _id: openform._id },
              {
                $set: {
                  authgiven: currentAuthGiven + "," + adminname,
                },
                $inc: { authorized: 1 },
              }
            );

            // Move the form to the rejected model after two approvals
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
              authgiven: currentAuthGiven + "," + adminname,
              authstatus: "rejected",
            });
            await rejectview.save();

            // Remove the form from the original collection
            await formmodel.deleteOne({ _id: openform._id });
          }
        } else {
        }
      }
    } else {
      for (let i = 0; i < rejectlist.length; i++) {
        // Fetch the form using findOne() to get a single document
        const openform = await formmodel.findOne({ _id: rejectlist[i] });

        if (openform.authorized === 0) {
          // First admin approval
          await formmodel.updateOne(
            { _id: openform._id },
            {
              $set: {
                authgiven: openform.authgiven
                  ? openform.authgiven + "," + adminname
                  : adminname,
              },
              $inc: { authorized: 1 },
            }
          );
        } else if (openform.authorized === 1) {
          // Second admin approval
          const currentAuthGiven = openform.authgiven;
          if (currentAuthGiven == adminname) {
            res.redirect(`/admin?adminname=${adminname}`);
          } else {
            await formmodel.updateOne(
              { _id: openform._id },
              {
                $set: { authgiven: currentAuthGiven + "," + adminname },
                $inc: { authorized: 1 },
              }
            );

            // Move the form to the rejected model after two approvals
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
              authgiven: currentAuthGiven + "," + adminname,
              authstatus: "rejected",
            });
            await rejectview.save();

            // Remove the form from the original collection
            await formmodel.deleteOne({ _id: openform._id });
          }
        }
      }
    }
    res.redirect(`/admin?adminname=${adminname}`);
  } catch (err) {
    console.error("");
    res.redirect(`/admin?adminname=${adminname}`);
  }
});

mailOptions = {
  to: useremail.Email,
  subject: "Confirmation of SPA Form submission",
  text: "Your SPA form has been recieved on" + here,
};
transporter.sendMail(mailOptions, function (error, info) {
  if (error) {
    console.log(error);
  } else {
    console.log("Email sent: " + info.response);
  }
});

//image upload fake
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    const pythonUrl = "http://localhost:5000/process-image";
    const imagePath = path.join(__dirname, "uploads", req.file.filename);

    const formData = {
      imagePath,
    };

    console.log("Sending to Python server:", formData);
    const formviewf = new formmodel({
      Requestor: "Hadis Khan",
      SAPID: "HadisKhanSAP1",
      DeptName: "Admin IR and ER",
      Areaname: "Ajmer,Delhi,",
      Authreq: "null",
      systype: "null",
      Client: "null",
      Date: "19/11/2024",
      authgiven: "null",
      authorized: 0,
      HODsubtag: "",
      authstatus: "waiting",
      ticketstatus: "open",
    });
    const resultf = await formviewf.save();

    const pythonResponse = await axios.post(pythonUrl, formData, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("Response from Python server:", pythonResponse.data);

    const processedData = pythonResponse.data;
    console.log(processedData);
    const formview = new formmodel({
      processedData,
    });

    const result = await formview.save();

    return res.status(200).json(result);
  } catch (error) {
    res.redirect("/");
  }
});
