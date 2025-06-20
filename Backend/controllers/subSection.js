const Section = require("../models/Section");
const subsection = require('../models/SubSection');
const {uploadImageToCloudinary} = require('../utils/imageUploader')

exports.createSubSection = async (req,res)=>{
  try {
    //  fetch the data from req body
    const {title, timeDuration,description,sectionId} = req.body;
    //  extract file / video

      const video = req.files.videoFile;
   // Validate the data 

    if(!title || !timeDuration || !description || !sectionId || !video){
      return res.status(404).json({
        success:false,
        message:"All the fields are required..."
      });      
    }
   //  upload video to cloudinary
     const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME);
   
    // create a subsection
    const subSectionDetails = await subsection.create({
      title:title,
      timeDuration:timeDuration,
      description:description,
      videoUrl:uploadDetails.secure_url,
    })
    // update the section with this sub section object id.
    const updatedSection = await Section.findByIdAndUpdate({_id:sectionId},{$push:{subSection:subSectionDetails._id}},{new:true})
     return res.status(200).json({
      success:true,
      message:"Sub-Section has created successfully",
        updatedSection
      // HW : log updated section here, after added polulate query...
     })
    // return response
  } catch (error) {
    return res.status(500).json({
      success:false,
      message:"Error while creating the section",
       error:error.message
    })
  }
}

// Update the subsection 
// HW : Update the subsection
exports.updatedSubSection = async (req,res)=>{
  try {
    const { sectionId, subSectionId, title, description } = req.body
    const subSection = await SubSection.findById(subSectionId)

    if (!subSection) {
      return res.status(404).json({
        success: false,
        message: "SubSection not found",
      })
    }

    if (title !== undefined) {
      subSection.title = title
    }

    if (description !== undefined) {
      subSection.description = description
    }
    if (req.files && req.files.video !== undefined) {
      const video = req.files.video
      const uploadDetails = await uploadImageToCloudinary(
        video,
        process.env.FOLDER_NAME
      )
      subSection.videoUrl = uploadDetails.secure_url
      subSection.timeDuration = `${uploadDetails.duration}`
    }

    await subSection.save()

    // find updated section and return it
    const updatedSection = await Section.findById(sectionId).populate(
      "subSection"
    )

    console.log("updated section", updatedSection)

    return res.json({
      success: true,
      message: "Section updated successfully",
      data: updatedSection,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the section",
    })
  }
}

// :Delete the sub section


exports.deleteSubSection = async (req, res) => {
  try {
    const { subSectionId, sectionId } = req.body
    await Section.findByIdAndUpdate(
      { _id: sectionId },
      {
        $pull: {
          subSection: subSectionId,
        },
      }
    )
    const subSection = await SubSection.findByIdAndDelete({ _id: subSectionId })

    if (!subSection) {
      return res
        .status(404)
        .json({ success: false, message: "SubSection not found" })
    }

    // find updated section and return it
    const updatedSection = await Section.findById(sectionId).populate(
      "subSection"
    )

    return res.json({
      success: true,
      message: "SubSection deleted successfully",
      data: updatedSection,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the SubSection",
    })
  }
}