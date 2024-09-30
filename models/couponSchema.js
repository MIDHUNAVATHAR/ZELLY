// models/Coupon.js
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String , required: true,  },//unique: true
  couponBalance : { type: Number, required: true }, 
  expiryDate: { type: Date, required: true }, // Coupon expiration date
  usageLimit: { type: Number, default : 1 }, // Number of times the coupon can be used
}, { timestamps: true });


const Coupon = mongoose.model( 'Coupon' , couponSchema ) ; 
module.exports = Coupon ; 
  