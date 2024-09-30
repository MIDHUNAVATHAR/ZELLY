
const mongoose = require('mongoose');


//ADMIN MODEL
const adminSchema = new mongoose.Schema({
  firstName: {
    type : String,
    required : true,
  },
  lastName : {
    type : String,
    required : true,
  },
  email : {
    type : String,
    required :true,
    unique : true,
  },
  password : {
    type : String,
    required : true,
    default : "password"
  },
  verified : {
    type : Boolean,
    default : false, 
  },
  otp : {
    type : String
  },
  otpExpiry : {
    type : Date
  },
  resetPasswordToken :  { type : String },
  resetPasswordExpires : { type : Date } 
});


                                                          
const Admin = mongoose.model('Admin', adminSchema );
module.exports = Admin;   

