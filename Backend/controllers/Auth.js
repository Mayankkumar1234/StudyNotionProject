const OTP = require("../models/OTP");
const profile = require("../models/profile");
const User = require("../models/User");
const USER = require("../models/User");
const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();
// send OTP

exports.sendOTP = async (req, res) => {
  // fetch eamil from req.body
  try {
    const { email } = req.body;
    console.log(email)
    let user = await User.findOne({ email: email });
    if (user) {
      res.status(401).send({
        success: false,
        message: "User already exists, please login",
      });
    }
    let otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    // check unqiue otp or not...

    const result =await OTP.findOne({ otp: otp });

    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      result = await OTP.findOne({ otp: otp });
    }

    const otpPayload = { email, otp };

    // create an entry in db...

    const otpBody = await OTP.create(otpPayload);
    console.log("OTP Body :", otpBody);

    //  return response successfully
     otpBody.save()

    res.status(200).json({
      success: true,
      message: "OTP sent successfully..",
      otp,
    });

    console.log("Otp generated :", OTP);
  } catch (error) {
    console.log("Error while generating otp ", error.message);
    res.status({
      success: false,
      message: error.message,
    });
  }
};

// Signup Controller for Registering USers

exports.signUp = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      AccountType,
      contactNumber,
      otp,
    } = req.body;

    //  validate user
    if (
      (!firstName,
      !lastName,
      !email,
      !password,
      !confirmPassword,
      !AccountType,
      !contactNumber,
      !otp)
    ) {
      return res.status(403).send({
        success: false,
        message: "All field are required",
      });
    }

    // check if password and confirm password match
    if (password !== confirmPassword) {
      return res.send({
        success: false,
        message:
          "Password and confirmPassword does not match , please try again",
      });
    }

    // check user if already exists or not...
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User is already registered...",
      });
    }
    //    find most recent OTP stored for the user.

    const findOtp = await OTP.find({ email:email }).sort({ createdAt: -1 }).limit(1);
 
    console.log("this is the recent otp", findOtp);
    // validate OTP
    if (findOtp.length == 0) {
      return res.status(400).json({
        success: false,
        message: "Provided OTP is not valid...",
      });
    } else if (otp !== findOtp[0].otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // hash password


    const hashPassword = await bcrypt.hash(password, 10);
    // entry create in db

    //  create the user
    let approved = "";
    approved === "Instructor" ? (approved = false) : (approved = true);

    // Profile create...

    const profileDetails = await profile.create({
      gender: null,
      dob: null,
      about: null,
      contactNumber: null,
    });

    const user = await User.create({
      firstName,
      lastName,
      email,
      contactNumber,
      password: hashPassword,
      AccountType: AccountType,
      approved: approved,
      additionalDetails: profileDetails._id,
      image: `https://api.dicebear.com/9.x/initials/svg?seed=${firstName} ${lastName}`,
    });

    res.status(200).json({
      success: true,
      message: "User has registered successfully",
      user,
    });
  } catch (error) {
    console.log("error during regsiter ", error.message);
    res.status(500).send({
      success: false,
      message: "Error while registering the user, Please try again",
    });
  }
};

// Login

exports.login = async (req, res) => {
  //  get data from user
  let { email, password } = req.body;
  // validate data
  if (!email || !password) {
    return res.status(403).send({
      success: false,
      message: "all fields are required, Please try again",
    });
  }

  //   user check exists or not
  const checkUser = await User.findOne({ email: email }).populate(
    "additionalDetails"
  );

  if (!checkUser) {
    return res.status(401).send({
      success: false,
      message: "User not found please,SignUp first",
    });
  }

  // generate JWT , Aafter passsord matching

  if (await bcrypt.compare(password, checkUser.password)) {
    const payload = {
      email: checkUser.email,
      id: checkUser._id,
      accountType: checkUser.AccountType,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });
    checkUser.token = token;
    checkUser.password = undefined;

    // Set cookie for token and return success response
    const option = {
      expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    };
    res.cookie("token", token, option).status(200).json({
      success: true,
      token,
      checkUser,
      message: "logged in successfuly",
    });
  } else {
    return res.status(401).json({
      success: false,
      message: "Password is incorrect",
    });
  }
};

// changePassword

exports.changePassword = async (req, res) => {
  try {
    // Get user from req.user
    const userDetails = await User.findById(req.user.id);

    let {   oldpassword, newPassword } = req.body;
 
     let isPasswordmath = await bcrypt.compare(oldpassword, userDetails.password)
    if (isPasswordmath) {
      const hashPassword = await bcrypt.hash(newPassword, 10);
      await userDetails.findOneAndUpdate(
        { email: email },
        { password: hashPassword },
        { new: true }
      );

      try {
        const emailResponse = await mailSender(
          updatedUserDetails.email,
          "Password for your account has been updated",
          passwordUpdated(
            updatedUserDetails.email,
            `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
          )
        )
        console.log("Email sent successfully:", emailResponse.response)
      } catch (error) {
         // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
      console.error("Error occurred while sending email:", error)
      return res.status(500).json({
        success: false,
        message: "Error occurred while sending email",
        error: error.message,
      })
      }

      return res.status(200).send({
        success: true,
        message: "User has changed thier password successfully",
      });
    } else {
      res.status(400).send({
        status: false,
        message: "Password not match please check it again",
      });
    }
  } catch (error) {
 // If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
 console.error("Error occurred while updating password:", error)
    res.status(500).json({
      success:false,
      message:"Error occured while updating the password",
       error:error.message
    })
  }
};

//https://api.dicebear.com/9.x/initials/svg?seed=Mayank%20kumar
