const Section = require("../models/Section");
const Course = require("../models/Course");
const SubSection = require('../models/SubSection')

exports.createSection = async (req, res) => {
  try {
    // data fetch
    const { sectionName, courseId } = req.body;
    if (!courseId || !sectionName) {
      return res.status(400).json({
        success: false,
        message: "All fields are required...",
      });
    }
    //  const checkExists = await Course.findById(courseId);
    //   if(!checkExists){
    //     return res.status(404).json({
    //       success:false,
    //       message:"course not exists"
    //     })
    //   }
    // create section

    const newSection = await Section.create({ sectionName });

    // Update course with object id.
    const updateCourseDetails = await Course.findByIdAndUpdate(
      courseId,
      {
        $push: {
          courseContent: newSection._id,
        },
      },
      { new: true }
    );

    // In the above we have to populate section and subsection...
    // HW : use populate to replace section/ sub-sections both in the updatedCourseDetails.

    //   return res

    return res.status(200).json({
      sucess: true,
      message: "Section created successfully",
      updateCourseDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateSection = async (req, res) => {
  try {
    // data input
    const { sectionName, sectionId } = req.body;

    // data validation
    if (!sectionName || !sectionId) {
      res.status(400).json({
        success: false,
        message: "All data are required",
      });
    }
    // update data
    const updateSection = await Section.findByIdAndUpdate(
      sectionId,
      { sectionName: sectionName },
      { new: true }
    );
    // return res
    return res.status(200).json({
      success: true,
      message: "Section updated successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to update the section",
      error: error.message,
    });
  }
};

exports.deleteSection = async (req, res) => {
  try {
    //getId
    const { sectionId , courseId } = req.body;
 await Course.findByIdAndUpdate(courseId , {
  $pull:{
    courseContent:sectionId
  }
 })
    //  use findByIdAndDelete
  const section = await Section.findByIdAndDelete(sectionId);

      console.log(sectionId, courseId);

       if(!section){
        return res.status(404).json({
          success:false,
          message:"Section not found"
        })
       }
   // Delete the associate subsections


   await SubSection.deleteMany({_id:{$in:section.subSection}})

  await section.findByIdAndDelete(sectionId)

  // find the updated course and returm it

  const course = await course.findById(courseId)
        .populate({
          path:"courseContent",
          populate:{
            path:"subSection"
          }
        }).exec()
    return res.status(200).json({
      success: true,
      message: "Section deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error while deleting the section",
      Error: error.message,
    });
  }
};
