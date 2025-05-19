const express = require("express");
const app = express();

const userRoute = require("./routes/User");
const contactRoute = require("./routes/Contact");
const courseRoute = require("./routes/Course");
const paymentRoute = require("./routes/Payment");
const profileRoute = require("./routes/Profile");
const connection = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { cloudinaryConnect } = require("./config/cloudinary");
const fileUpload = require("express-fileupload");
// const dotenv = require("dotenv");

const PORT = process.env.PORT || 4000;
app.use(express.json()); 
connection.connect();
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/temp",
  })
);

// Cloudinary connection

cloudinaryConnect();

app.listen(PORT, () => {
  console.log(`Our app is working at PORT :${PORT}`);
});

app.use("/api/v1/auth", userRoute);
app.use("/api/v1/contact", contactRoute);
app.use("/api/v1/course", courseRoute);
app.use("/api/v1/payment", paymentRoute);
app.use("/api/v1/profile", profileRoute);

// app.use("/", (req, res) => {
//   res.json({
//     success: true,
//     message: "Your server is up and running fine...",
//   });
// });
