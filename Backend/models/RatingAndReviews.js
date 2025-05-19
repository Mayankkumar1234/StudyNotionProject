
const mongoose = require('mongoose');

const ratingAndReviewSchema =new mongoose.Schema({
  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:true
  },
  rating:{
    type:Number,
    required:true,
    min:1,
    max:5
  },  review:{
    type:String,
    required:true,
    minlength:10,
    maxlength:5000
  },
  course:{
    type:mongoose.Schema.Types.ObjectId,
    require:true,
    ref:"Course",
    index:true
  }
})

module.exports = mongoose.model('RatingAndReview',ratingAndReviewSchema);