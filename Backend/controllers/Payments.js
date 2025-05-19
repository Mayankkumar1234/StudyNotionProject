const {instance}  = require("../config/razorpay")
const Course = require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const {
  courseEnrollmentEmail,
} = require("../mail/templates/courseEnrollmentEmail");

// capture the payment and initiate the Razorpay order

exports.capturePayment = async (req, res) => {
  const { course_id } = req.body;
  const userId = req.user.id;
  // validation
  if (!course_id) {
    return res.json({
      success: false,
      message: "Please provide the course Id",
    });
  }

  // validate courseDetails
  let course;
  try {
    course = await Course.findById(course_id);
    if (!course) {
      return res.status(400).json({
        success: false,
        message: "Course not found",
      });
    }
    // user already pay for the same course
    const uid = new mongoose.Types.ObjectId(userId);
    if (course.studentEnrolled.includes(uid)) {
      return res.status(200).json({
        success: true,
        message: "User has already enrolled for the same course",
      });
    }
  } catch (error) {
    return res.json({
      success: false,
      message: error.message,
    });
  }

  // order create
  const amount = course.price;
  const currency = "INR";

  const options = {
    amount: amount,
    currency: currency,
    receipt: Math.random(Date.now()).toString(),
    notes: {
      courseId: course._id,
      userId,
    },
  };
  try {
    // initiate the payment using razorpay

    const paymentResponse = await instance.orders.create(options);
    console.log(paymentResponse);
    //  return response

    return res.status(200).json({
      success: true,
      courseId: course._id,
      courseName: course.courseName,
      courseDetails: course.courseDetails,
      courseDescription: course.courseDescription,
      thumbnail: course.thumbnail,
      orderId: paymentResponse.id,
      currency: paymentResponse.currency,
      amount: paymentResponse.amount,
    });
  } catch (error) {
    console.log("Error", error.message);
    res.json({
      success: false,
      message: "Could not initiate order...",
    });
  }
};

// verify singnature of razorpay and server

exports.verifySignature = async (req, res) => {
  const webhooksecret = "12345678";

  const signature = req.headers["x-razorpay-singature"];

  const shasum = crypto.createHmac("sha256", webhooksecret);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest("hex");

  if (signature == digest) {
    console.log("Payment is Authorized");

    const { courseId, userId } = req.body.payload.payment.entity.notes;

    try {
      // fulfill the action

      // find the course and enroll the user in it

      const enrolledCourse = await Course.findByIdAndUpdate(
        { _id: courseId },
        { $push: { studentEnrolled: userId } },
        { new: true }
      );

      if (!enrolledCourse) {
        return res.status(500).json({
          success: false,
          message: "Course not found",
        });
      }
      console.log(enrolledCourse);

      // find the student and add the couse to the their enrolled list course

      const enrolledStudent = await User.findByIdAndUpdate(
        { _id: userId },
        { $push: { courses: courseId } },
        { new: true }
      );

      console.log(enrolledStudent);

      // Send the course confirmation mail to user

      const mailResponse = await mailSender(
        enrolledStudent.email,
        "courseShala",
        "Congratulation you are onboarded into new course by courseShala"
      );
      console.log(mailResponse);
      //  return res.

      return res.status(200).json({
        success: true,
        message: "Singnature verified and User has enrolled successfully...",
      });
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({
        success: false,
        message: "Error while verifying the singnature...",
      });
    }
  } else {
    return res.status(400).json({
      success: false,
      message: "Invalid request",
    });
  }
};


exports.sendPaymentSuccessEmail = async (req,res)=>{
  const {orderId , paymentId , amount} = req.body

  const userId = req.user.id

  if(!orderId || !paymentId || !amount|| !userId){
    return res.status(400).json({
      success:false,
      message:"Please provide the all the details"
    })
  }
  try {
    const enrolledStudent = await User.findById(userId)

    await mailSender(
      enrolledStudent.email,
      `Payment Received`,
      paymentSuccessEmail(
        `${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
        amount / 100,
        orderId,
        paymentId
      )
    )
  } catch (error) {
    console.log("error in sending mail", error)
    return res
      .status(400)
      .json({ success: false, message: "Could not send email" })
  }

}

// enroll the student into the courses


// enroll the student in the courses
exports.enrollStudents = async (courses, userId, res) => {
  if (!courses || !userId) {
    return res
      .status(400)
      .json({ success: false, message: "Please Provide Course ID and User ID" })
  }

  for (const courseId of courses) {
    try {
      // Find the course and enroll the student in it
      const enrolledCourse = await Course.findOneAndUpdate(
        { _id: courseId },
        { $push: { studentsEnroled: userId } },
        { new: true }
      )

      if (!enrolledCourse) {
        return res
          .status(500)
          .json({ success: false, error: "Course not found" })
      }
      console.log("Updated course: ", enrolledCourse)

      const courseProgress = await CourseProgress.create({
        courseID: courseId,
        userId: userId,
        completedVideos: [],
      })
      // Find the student and add the course to their list of enrolled courses
      const enrolledStudent = await User.findByIdAndUpdate(
        userId,
        {
          $push: {
            courses: courseId,
            courseProgress: courseProgress._id,
          },
        },
        { new: true }
      )

      console.log("Enrolled student: ", enrolledStudent)
      // Send an email notification to the enrolled student
      const emailResponse = await mailSender(
        enrolledStudent.email,
        `Successfully Enrolled into ${enrolledCourse.courseName}`,
        courseEnrollmentEmail(
          enrolledCourse.courseName,
          `${enrolledStudent.firstName} ${enrolledStudent.lastName}`
        )
      )

      console.log("Email sent successfully: ", emailResponse.response)
    } catch (error) {
      console.log(error)
      return res.status(400).json({ success: false, error: error.message })
    }
  }
}