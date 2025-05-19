const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
const emailTemplate = require("../mail/templates/emailVerificationTemplates");

const OTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    expires: 5 * 60, // The document will be automatically deleted after 5 minutes of its creation time
  },
});

// function -> to send email

async function sendVerificationEmail(email, otp) {
  // Define the email option
  try {
    const mailResponse = await mailSender(
      email,
      "Veirfication email form study notion",
      emailTemplate(otp)
    );
    console.log("Email sent successfully: ", mailResponse);
  } catch (error) {
    console.log("Error occured while sending email: ", error.message);
    throw error;
  }
}

OTPSchema.pre("save", async function (next) {
  console.log("New document saved to database");

  if (this.isNew) {
    try {
      await sendVerificationEmail(this.email, this.otp);
    } catch (error) {
      console.log("Error while sending the email", error.message);
    }
  }
  next();
});

module.exports = mongoose.model("OTP", OTPSchema);
