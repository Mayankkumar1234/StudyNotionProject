const mongoose = require("mongoose");
const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
const courseProgress = require("../models/courseProgress");
const Course = require("../models/Course");
exports.updateCourseProgress = async (req, res) => {
  const { courseId, subsectionId } = req.body;

  const userId = req.user.id;

  try {
    // check the subSection is valid

    const subSection = await SubSection.findById(subsectionId);
    if (!subSection) {
      return res.status(404).json({
        error: "Invalid subsection",
      });
    }
    // Find the course progress document for the user and course

    let courseProgress = await courseProgress.findOne({
      courseId: courseId,
      userId: userId,
    });
    if (!courseProgress) {
      // If  course Porgress doesn't exist ,create a new one

      return res.status(404).json({
        success: true,
        message: "Course progress Does not Exists",
      });
    } else {
      // If course progress exists, check if the subsection is already completed
      if (courseProgress.completedVideos.includes(subsectionId)) {
        return res.status(400).json({ error: "Subsection already completed" });
      }

      // Push the subsection into the completedVideos array
      courseProgress.completedVideos.push(subsectionId);
    }

    // Save the updated course progress
    await courseProgress.save();

    return res.status(200).json({ message: "Course progress updated" });
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Internal server error" })
  }
};
