const Category = require("../models/Category");


function getRandomInt(max) {
  return Math.floor(Math.random() * max)
}


// Create tag handler function

exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    //  create an entry in db

    const categoryDetails = await Tag.create({
      name: name,
      description: description,
    });
    console.log(categoryDetails);

    return res.status(200).json({
      success: true,
      message: "Tag has created successfully...",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//  get All Categories

exports.showAllCategories = async (req, res) => {
  try {
    let allCategories = await Tag.find({}, { name: true, description: true });
    res.status(200).json({
      success:true,
      message:"All tags received successfully",
      data : allCategories
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Category not found",
    });
  }
};

exports.categoryPageDetails = async (req,res)=>{
   try {
    const {categoryId}  = req.body

    
    // Get courses for the specified category 


      const selectedCategory = await Category.findById(categoryId).populate({
        path:"Course",
        match:{status:"Published"},
        populate:"ratingAndReviews"
      }).exec()
      
      console.log("SELECTED COURSE ", selectedCategory)

//  Handle the case when the category is not found

      if (!selectedCategory) {
        console.log("Category not found.")
        return res
          .status(404)
          .json({ success: false,
             message: "Category not found" })
      }
          // Handle the case when there are no courses
    if (selectedCategory.courses.length === 0) {
      console.log("No courses found for the selected category.")
      return res.status(404).json({
        success: false,
        message: "No courses found for the selected category.",
      })
    }
     
   
    // Get Courses for other categories

     const categoriesExceptSelected = await Category.find({
        _id:{$ne :  categoryId},
     })
    let differentCategory = await Category.findOne(categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)]
   ._id
)
.populate({
  path:"courses",
  match:{status:"Published"},
})
.exec()
const allCourses = allCategories.flatMap((category)=> category.courses)

const mostSellingCourses = allCourses
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 10)

      res.status(200).json({
        success: true,
        data: {
          selectedCategory,
          differentCategory,
          mostSellingCourses,
        },
      })

   } catch (error) {
      return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    })
   }
}