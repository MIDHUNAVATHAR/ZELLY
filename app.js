const express = require("express");
const app = express();
const session = require('express-session');
const passport = require('passport');
require("./configs/passport-config"); // Include passport configuration
const mongoose = require("mongoose");
const path = require("path"); 
const dotenv = require("dotenv");


//loads env variables from .env file  
dotenv.config();  
 
  
const connectDB = async () =>{ 
   try{ 
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MONGODB CONNECTED");    
   }catch(err){   
    console.log("MONGODB NOT CONNECTED ", err.message)  ;   
   }
} 
connectDB();

//serve uploads folder as static  
app.use('/uploads', express.static('uploads')); 
 
app.use(express.urlencoded({ extended: true })); 
app.use(session({
    secret: process.env.secretKey,
    resave: false, 
    saveUninitialized: true ,   
    cookie: {  
      maxAge: 24 * 60 * 60 * 1000 // 1 day in milliseconds 
  }
})); 
    
app.use(express.static("./frontend/public"));  

app.use(passport.initialize());  
app.use(passport.session());
    

 

// Import routes
const adminRoute = require("./routes/admin-routes") ; 
const userRoute  = require("./routes/user-routes")  ;  
 

//view engine setup and path 
app.set("view engine" , "ejs");  


// Setting the view paths for backend and frontend   
app.set('views', [
    path.join(__dirname, 'backend/views'),  
    path.join(__dirname, 'frontend/views')      
  ]);    
     
 

// Use routes    
app.use("/", userRoute);
app.use("/admin", adminRoute);
  




const PORT = process.env.PORT || 3000 ;  

app.listen( PORT , ( err )=> err ? console.log( err.message ) : console.log( "server started on port : ", PORT ) );    