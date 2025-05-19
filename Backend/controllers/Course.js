const Category = require("../models/Category");
const Course = require("../models/Course");
const User = require("../models/User");
const SubSection = require("../models/SubSection");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const CourseProgress = require("../models/courseProgress");
// const {} =
const Section = require("../models/Section");
const courseProgress = require("../models/courseProgress");

// createCourse handler function
//  function to create a new course
exports.createCourse = async (req, res) => {
  try {
    // fetch data
    const {
      courseName,
      courseDescription,
      whatYouWillLearn,
      status,
      price,
      tag: _tag,
      category,
      instructions: _instructions,
    } = req.body;

    //  get thumbnail image form request files.
    const thumbnail = req.files.thumbnailImage;

    // convert the tag and instruction from stringify Array to Array

    const tag = JSON.parse(_tag);
    const instructions = JSON.parse(_instructions);

    console.log("Tag :", tag);
    console.log("Instructions : ", instructions);
    if (
      !courseName ||
      !courseDescription ||
      !whatYouWillLearn ||
      !price ||
      !tag.length ||
      !thumbnail ||
      !instructions.length
    ) {
      return res.status(400).json({
        success: false,
        message: "All  fields are required",
      });
    }
    if (!status || status == undefined) {
      status = "Draft";
    }
    const userId = req.user.id;
    //  check if the user is an instructor
    const instructorDetails = await User.findById(userId, {
      AccountType: "Instructor",
    });

    if (!instructorDetails) {
      return res.status(404).json({
        success: false,
        message: "Instructor Details not required...",
      });
    }
    console.log("Instructor Details :", instructorDetails);
    //check given tag is valid or not
    const categoryDetails = await Category.findById(category);
    if (!categoryDetails) {
      return res.status(404).json({
        success: false,
        message: "Tag details not found...",
      });
    }
    const thumbnailImage = await uploadImageToCloudinary(
      thumbnail,
      process.env.FOLDER_NAME
    );
    console.log(thumbnailImage);

    //  create a new course with the given details...

    const newCourse = await Course.create({
      courseName,
      courseDescription,
      instructor: instructorDetails._id,
      whatYouWillLearn: whatYouWillLearn,
      price,
      tag,
      category: categoryDetails._id,
      thumbnail: thumbnailImage.secure_url,
      status: status,
      instructions,
    });

    // Add the new course to the use schema of the instructor
    await User.findByIdAndUpdate(
      {
        _id: instructorDetails._id,
      },
      {
        $push: { courses: newCourse._id },
      },
      { new: true }
    );

    //  Add the course to the categories

    const categoryDetails2 = await Category.findByIdAndUpdate(
      {
        _id: category,
      },
      {
        $push: { courses: newCourse._id },
      },
      { new: true }
    );

    console.log("Category 2", categoryDetails2);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create a new course",
      error: error.message,
    });
  }
};

// getAllCourses hander function

exports.getAllCourse = async (req, res) => {
  try {
    const allCourses = await Course.find({}).populate(
      "instructor courseContent RatingReview tag"
    );
    if (!allCourses) {
      res.status(403).json({
        success: false,
        message: "Unable to find the courses",
      });
    }
    return res.status(200).json({
      success: false,
      message: "All data received",
      allCourses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error while fetching the coourses...",
    });
  }
};

exports.getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body;
    const courseDetails = await Course.find({ _id: courseId })
      .populate({
        path: "instructor",
        populate: {
          path: "additionalDetails",
        },
      })
      .populate("category")
      .populate("ratingAndreviews")
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .exec();

    // validation that data exists or not...

    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find the course with this course id :${courseId}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course Details fetched successfully",
      data: courseDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error while fetching the details...",
      "Error":error.message
    });
  }
};

//  Get a list of course of a given instructor

exports.getInstructorCourses = async (req, res) => {
  try {
    // Get the instructor ID from the authenticated user or request body
     const instructorId = req.user.id
     
     // Find all courses belongings to the instructor

     const instructorcourses = await Course.find({
      instructor:instructorId
     }).sort({createdAt:-1})
    
     return res.status(200).json({
      success:false,
      data:instructorcourses,
     })
  } catch (error) {
    console.log(error)
    res.status(500).json({
      success:false,
      message:"Failed to retrive instructor courses",
      error:error.message
    })
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    let course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const studentEnrolled = course.studentEnrolled;

    for (const studentId of studentEnrolled) {
      await User.findByIdAndUpdate(
        { _id: studentId },
        {
          $pull: { course: courseId },
        }
      );
    }
     // Delete sections and sub-sections
     const courseSections = course.courseContent
     for (const sectionId of courseSections) {
       // Delete sub-sections of the section
       const section = await Section.findById(sectionId)
       if (section) {
         const subSections = section.subSection
         for (const subSectionId of subSections) {
           await SubSection.findByIdAndDelete(subSectionId)
         }
       }
 
       // Delete the section
       await Section.findByIdAndDelete(sectionId)
     }
 
     // Delete the course
     await Course.findByIdAndDelete(courseId)
 
     return res.status(200).json({
       success: true,
       message: "Course deleted successfully",
     })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
};

// Edit course details

exports.editCourse = async (req, res) => {
  try {
    const { courseId } = req.body
    const updates = req.body
    const course = await Course.findById(courseId)

    if (!course) {
      return res.status(404).json({ error: "Course not found" })
    }
  // If Thumbnail Image is found, update it
  if (req.files) {
    console.log("thumbnail update")
    const thumbnail = req.files.thumbnailImage
    const thumbnailImage = await uploadImageToCloudinary(
      thumbnail,
      process.env.FOLDER_NAME
    )
    course.thumbnail = thumbnailImage.secure_url
  }

  // Update only the fields that are present in the request body
  for (const key in updates) {
    if (updates.hasOwnProperty(key)) {
      if (key === "tag" || key === "instructions") {
        course[key] = JSON.parse(updates[key])
      } else {
        course[key] = updates[key]
      }
    }
  }

  await course.save()

  const updatedCourse = await Course.findOne({
    _id: courseId,
  })
    .populate({
      path: "instructor",
      populate: {
        path: "additionalDetails",
      },
    })
    .populate("category")
    .populate("ratingAndReviews")
    .populate({
      path: "courseContent",
      populate: {
        path: "subSection",
      },
    })
    .exec()
    res.json({
      success: true,
      message: "Course updated successfully",
      data: updatedCourse,
    })
  } catch (error) {

    console.error(error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    })
  }
};

// Get  Full Course details

exports.getFullCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    const courseDetails = await Course.findOne({
      _id: courseId,
    })
      .populate({
        path: "instructor",
        populate: {
          path: "additionalDetails",
        },
      })
      .populate("category")
      .populate("RatingAndReview")
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .exec();

    let courseProgressCount = await courseProgress.findOne({
      courseId: courseId,
      userId: userId,
    });
    console.log("CoursePorgressCount :", courseProgressCount);

    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `could not find course with id :${courseId}`,
      });
    }
    let timeDurationInSeconds = 0;
    courseDetails.courseContent.forEach((content) => {
      content.SubSection.forEach((subSection) => {
        const timeDurationInSeconds = parseInt(subSection.timeDuration);
        timeDurationInSeconds += timeDurationInSeconds;
      });
    });
    const totalDuration = convertsecondsToDuration(timeDurationInSeconds);

    return res.status(200).json({
      success: true,
      data: {
        courseDetails,
        totalDuration,
        completedVideos: courseProgressCount?.completedVideos
          ? courseProgressCount?.completedVideos
          : [],
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//
