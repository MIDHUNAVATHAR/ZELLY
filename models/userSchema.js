const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    firstName : {
        type:String,
        required :true,
    },
    lastName : {
        type:String,
    },
    password : {
        type:String, 
        required :true,
        default : "password" , 
    },
    email : {
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
    resetPasswordToken:{ type : String },
    resetPasswordExpires :{ type : Date } ,
    googleId : { 
    type: String, unique: true, sparse: true 
      },
    joinedDate : {type : Date , default : Date.now() } ,   
    status : { type : String , default : "Unblock" } ,
    gender : { type : String },
    mobile : {type :Number },
    walletBalance : { type : Number , default : 0},   
    couponBalance : { type : Number , default : 0},   
    appliedCoupons: [
        {
          couponCode : String ,
          totalApply : { type : Number } ,
        }
      ],
    coupon: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Coupon', // assuming you have a Coupon model
    },
    referralCode: { type: String, unique: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } ,  
    rewardsBalance: { type: Number, default: 0 },
    referralCount: { type: Number, default: 0 }

} , { timestamps : true } )  ; 




userSchema.pre('save', function (next) {
  // If the user is new, generate a unique referral code
  if (this.isNew) {
    this.referralCode = Math.random().toString(36).substring(2, 10) + Date.now().toString(36); // Generates a unique code
  }
  next();
}); 


module.exports =  mongoose.model( "User" , userSchema ) ;