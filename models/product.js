const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
  title: { type: String, required: true },
  titleDescription: { type: String, required: true },
  price: { type: Number, required: true },
  discountedPrice: { type: Number },
  discountedPercentage: { type: Number },
  sizes: { type: [String], required: true },
  productDescription: { type: String, required: true },
  highlights: { type: String },
  details: { type: String },
  genderCategory: { type: Schema.Types.ObjectId, ref: 'GenderCategory', required: true },
  productCategory: { type: Schema.Types.ObjectId, ref: 'ProductCategory', required: true },
  productSubCategory: [{ type: Schema.Types.ObjectId, ref: 'ProductSubCategory', required: true }] ,  
  images: { type: [String] } , 
});  

module.exports = mongoose.model('Product', productSchema); 