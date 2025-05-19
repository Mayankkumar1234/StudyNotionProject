const RatingAndReview = require("../models/RatingAndReviews");
const Course = require("../models/Course");

//  create Rating
exports.createRating = async (req, res) => {
  try {
    // get user id
    const userId = req.user.id;
    // fetch data from req body

    const { rating, courseId, review } = req.body;

    // check for the validation

    if (!userId || !rating || !courseId || !review) {
      return res.status(500).json({
        sucess: false,
        message: "All fields are required",
      });
    }

    // check if user is  enrolled or  not
    const courseDetails = await Course.findOne({
      _id: courseId,
      studentEnrolled: { $eleMatch: { $eq: userId } },
    });
    if (!courseDetails) {
      return res.status(404).json({
        success: true,
        message: "Only enrolled user are allowed to review the course...",
      });
    }

    // check if user already reviewed the course

    const userReview = await RatingAndReview.findOne({
      user: userId,
      course: courseId,
    });

    if (userReview) {
      return res.status(200).json({
        success: true,
        message: "Your review has already added to this course",
      });
    }
    //create rating and review

    const ratingandreview = await RatingAndReview.create({
      user: userId,
      rating: rating,
      review: review,
      course: courseId,
    });

    // update course with this rating / review
    const updatedCourseDetails = await Course.findByIdAndUpdate(
      { _id: courseId },
      { $push: { ratingAndReviews: ratingandreview._id } },
      { new: true }
    );
    // return res
    console.log(updatedCourseDetails);

    return res.status(200).json({
      success: true,
      message: "Rating and Review updated successfully",
      ratingandreview,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// getAverageRating

exports.getAverageRating = async () => {
  try {
    const courseId = req.body.courseId;

    //  calculate avg rating

    const result = await RatingAndReview.aggregate([
      {
        $match: {
          course: new mongoose.Types.ObjectId(courseId),
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
        },
      },
    ]);
    if (result.length > 0) {
      return res.status(200).json({
        success: true,
        averageRating: result[0].averageRating,
      });
    }

    // If no rating or review exists

    return res.status(200).json({
      success: true,
      message: "Average Rating is 0, no rating given till now",
      averageRating: 0,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// getALlRatingAndReviews

exports.getAllRatingReview = async (req, res) => {
  try {
    const allReviews = await RatingAndReview.find({})
      .sort({ rating: "desc" })
      .populate({
        path: "user",
        select: "firstName lastName email image",
      })
      .populate({
        path: "course",
        select: "courseName",
      })
      .exec();
    return res.status(200).json({
      success: true,
      message: "All reviews fetched successfully",
      allReviews,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
