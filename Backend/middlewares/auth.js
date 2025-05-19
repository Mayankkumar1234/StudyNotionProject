const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

// auth

exports.auth = async (req, res,next) => {
  try {
    const token =
      req.cookie.token ||
      req.body.token ||
      req.header("authorization").replace("Bearer ", "");
    console.log(token);
    // if token is missing then return response
    if (!token) {
      return res.status(401).send({
        success: false,
        message: "Token not found",
      });
    }
    try {
      let decode =   jwt.verify(token, process.env.JWT_SECRET);
      console.log(decode);
      req.user = decode;
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Token is invalid",
      });
    }
    next();
  } catch (error) {
    console.error(error.message);
    res.status(401).send({
      success: false,
      message: "Something went while validation the token...",
    });
  }
};
// student

exports.isStudent = async (req, res, next) => {
  try {
    if (req.user.accountType !== "Student") {
      return res.status(401).send({
        success: false,
        message: "This is a protected route for student only..",
      });
    }
    next();
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "User role cannot be verified , Please try again",
    });
  }
};

// instructor

exports.isInstructor = async (req, res, next) => {
  try {
    const userDetails = await User.findOne({ email: req.user.email });
    console.log(userDetails);

    console.log(userDetails.AccountType);

    if (userDetails.AccountType !== "Instructor") {
      return res.status(401).json({
        success: false,
        message: "This is a Protected Route for Instructor",
      });
    }
    next();
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: `User Role Can't be Verified` });
  }
};

// admin

exports.isAdmin = async (req, res, next) => {
  try {
    const userDetails = await User.findOne({ email: req.user.email });

    if (userDetails.AccountType !== "Admin") {
      return res.status(401).json({
        success: false,
        message: "This is a Protected Route for Admin",
      });
    }
    next();
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: `User Role Can't be Verified` });
  }
};
