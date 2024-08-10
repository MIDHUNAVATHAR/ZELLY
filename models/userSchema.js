const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    firstName: {
        type:String,
        required :true,
    },
    lastName: {
        type:String,
    },
    password:{
        type:String, 
        required :true,
        default:"password",
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    verified:{
        type:Boolean,
        default:false
    },
    otp : {
        type : String
      },
    otpExpiry : {
        type : Date
      },
      resetPasswordToken:{ type : String},
      resetPasswordExpires :{ type : Date } ,
      googleId : { 
        type: String, unique: true, sparse: true 
      },
    joinedDate : {type : Date , default : Date.now()},  
    status : { type : String , default : "Unblock" } 

})

module.exports =  mongoose.model( "User" , userSchema ) ;