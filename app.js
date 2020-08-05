const express     = require("express");
const app         = express();

const bodyParser  = require("body-parser")
const passport    = require("passport")
const LocalStrategy   = require("passport-local")
const methodOverride = require('method-override')
const flash          =require("connect-flash")
const mongoose    = require("mongoose")
const User        = require("./models/user")


var Campground = require("./models/campgroundmongo")
var Comment    = require("./models/comment")

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);


// mongoose.connect('mongodb://localhost/yelp_camp');
mongoose.connect('mongodb+srv://dinesh:deekshu123@cluster0.4j3hm.mongodb.net/campplace?retryWrites=true&w=majority');
// mongodb connection


app.use(methodOverride('_method'))
app.use(flash());
app.use(bodyParser.urlencoded({extended : true}))
app.set("view engine","ejs");


//PASSPORT CONFIGURATION
app.use(require("express-session") ({
   secret : "Nice project to have",
   resave: false,
   saveUninitialized : false
}))

app.use(passport.initialize())
app.use(passport.session())

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



// REQ.USER 

app.use(function(req , res , next){
   res.locals.currentUser = req.user;
   res.locals.error = req.flash("error");// request for error message
   res.locals.success = req.flash("success"); // request for success message
   next();
})


// langing page starts
app.get("/" , function(req, res) {
   res.render("landing");
})

// First get connection to show all campgrounds
app.get("/campgrounds" , function(req, res) {
   Campground.find({},function(err , allcampgrounds){
      if (err) {
         console.log(err)
      }
      else{
         console.log(req.user)
         res.render("index",{campgrounds : allcampgrounds});
      }
   })
  })


// get connection for create new Campgrounds
app.get("/campgrounds/new",isLoggedIn, function(req, res) {
   res.render("new");
  })


//get connection to show perticular Campground
app.get("/campgrounds/:id" , function(req, res) {
   Campground.findById(req.params.id).populate("comments").exec(function(err,foundcampground){
      if(err || !foundcampground){
         req.flash("error","Campground not found")
         console.log(err)
         res.redirect("/campgrounds")
      }
      else{
      
         console.log(foundcampground.comments)
         res.render("show" ,{campground : foundcampground, userdetails : req.user});
      }
   })
   
})

//post request for creating Campground
app.post("/campgrounds" ,isLoggedIn, function(req , res){

   var name = req.body.name;
   var image = req.body.image;
   var desc = req.body.description;
   var user = {
      userid : req.user._id,
      username : req.user.username
   }
   var newcampground = {name : name , image : image,description : desc, user : user}
   Campground.create(newcampground, function(err ,newlyadded) {
      if(err) {
         console.log(err)
      }
      else{
         
         req.flash("success","Successfully added  Campground");

         res.redirect("/campgrounds")
      }
   
   }) 

   // campgrounds.push(newcampground);
})
 

 app.get("/campgrounds/:id/comments",isLoggedIn, function(req,res){
    Campground.findById(req.params.id, function(err, campground) {
       if(err){
          console.log(err)
       }
       else{
         res.render("comment",{campground : campground , currentuser : req.user})
         console.log("2 - " + req.user._id)
       }
    })
    
 })

app.post("/campgrounds/:id/comments" , function( req, res) {
   
   var cuser = req.user.username;
   var cid  = req.user._id ; 
   var text = req.body.text;
   var newcomment = { text : text ,
                    author : cuser,
                    userid : cid

   }
   Campground.findById(req.params.id,function(err , campground){
      if(err){
         
         res.redirect("/campgrounds")

      }
      else{

         Comment.create(newcomment, function(err,comment){
            if(err){
               req.flash("error","Something went wrong");

               console.log(err)
            }
            else{
               campground.comments.push(comment);
               // console.log(comment)
               campground.save()
               req.flash("success","Successfully added  comment");

               res.redirect('/campgrounds/' +campground._id)
            }
         })

      }
   })


})

//UPDATE FORM FOR CAMPGROUND

app.get ("/campgrounds/:id/edit", checkcamp, function(req,res){
      Campground.findById(req.params.id ,function(err, foundcampground){
  
               res.render("edit",  { campground : foundcampground})
      
         })
})

//

//updating campground by "mongo method 'findByIdAndUpdate' "
app.put("/campgrounds/:id",checkcamp, function(req,res){
   Campground.findByIdAndUpdate(req.params.id , req.body.campground,  function(err,updatedcamp){
      if(err){
    
         console.log(err)
         res.redirect("/campgrounds")
      } else{
         
         res.redirect("/campgrounds/" + req.params.id)

      }
   })
})

//deleting campground  by mongo method 'Remove' 
app.delete("/campgrounds/:id",checkcamp, function(req,res) {
// res.send("hello good to have you")

   Campground.findByIdAndRemove(req.params.id , function(err,value){
      if(err){
         res.redirect("/campgrounds")
      } else{
         req.flash("success"," Campground deleted");

        
         res.redirect("/campgrounds")

      }
   })
})

//delete comments /same as campground
 
app.delete("/campgrounds/:id/comments/:comment_id", checkComment,function(req,res){
   Comment.findByIdAndRemove(req.params.comment_id , function(err,comment){
      if(err){
        
         res.redirect("back")
      }else{
         
         req.flash("success","Comment deleted");
         res.redirect("/campgrounds/" + req.params.id);
      }
   })
   
})

//============================
//Authontication Process For Login, Signup and logout
//everthing by Js package/tool 
//passport
//passport-local
//passport local mongoose

app.get("/register" , function(req,res){
   res.render("register")
})

app.post("/register" , function(req,res){
   
   var newUser = new User({username: req.body.username});
   User.register(newUser,req.body.password,function(err,user){
      if(err) {
         req.flash("error",err.message);

         return res.render("register")

      }
      passport.authenticate("local")(req,res, function(){
         req.flash("success","Welcome to YelpCamp " + user.username);
      res.redirect("/campgrounds")
      })
   })
   
})

//===========
//show login form

app.get("/login", function(req,res){
   res.render("login")
})

app.post("/login",passport.authenticate("local",{
   //middleware..
   successRedirect : "/campgrounds",
   failureRedirect: "/login"

}), function(req,res){})

//=====================
//LOGUOT routs



app.get("/logout", function(req , res){
   req.logout();
   req.flash("success","logged you out. ")
   res.redirect("/campgrounds")
});

function isLoggedIn(req , res  ,next){
   if(req.isAuthenticated()) {
      return next();
   }
   req.flash("error","You need to be logged in to do that");
   res.redirect("/login")
   
}
// campground ownership -- This method for authentication


function checkcamp(req,res , next){
   if(req.isAuthenticated()){
      Campground.findById(req.params.id ,function(err, foundcampground){
         if(err || !foundcampground) {
            req.flash("error","Campground not found !!");
            res.redirect("back")
            console.log(err)
         } else {
            var one = (foundcampground.user.userid)
            var two = (req.user._id)
            // console.log(foundcampground)
            if(one == two){
               next();
            }
            else{
               req.flash("error","You don't have permission to do that");

               res.redirect("back")
            }
            }

           
      })

   }else{
      req.flash("error","You need to be logged in to do that");

      res.redirect("back")
   }

}

//Comment ownership --same as campground

function checkComment(req,res , next){
   if(req.isAuthenticated()){
      Comment.findById(req.params.comment_id ,function(err, foundcomment){
         if(err || !foundcomment) {
            req.flash("error","Campground not found !!");
            res.redirect("back")
            console.log(err)
         } else {
            var one = (foundcomment.userid)
            console.log(one)
            var two = (req.user._id)
            console.log(two)
            if(one == two){
               next();
            }
            else{
               req.flash("error","You don't have permission to do that");

               res.redirect("back")
            }
            }
         })

   }else{
      req.flash("error","You need to be logged in to do that");

      res.redirect("back")
   }
}

// listen function 
app.listen(3000, function() {
   console.log("Project-CampPlace server strated");
 })
