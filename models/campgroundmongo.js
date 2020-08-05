var mongoose = require("mongoose");


var campgroundsSchema = new mongoose.Schema({
   name : String,
   image : String,
   description :String ,
   user : {
      userid : String,
      username : String
      
   },

   comments: [
      {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Comment"
         // text : String,
         // author : String
      }
   ]
  
});

module.exports = mongoose.model("Campground",campgroundsSchema);