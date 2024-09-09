const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const productSchema = new Schema({
  title: { type: String, required: true },
  titleDescription: { type: String, required: true },         
  sizes: { type: [
    { 
      size : { type : String , required: true },
      price : { type : Number , required : true },
      quantity : { type : Number , required : true },
      discountedPrice : {type : Number , required : true},
      discountedPercentage : {type : Number , required : true}
    }
  ], required: true }, 
  productDescription: { type: String, required: true },
  highlights: { type: String },
  details: { type: String },
  genderCategory: { type: Schema.Types.ObjectId, ref: 'GenderCategory', required: true },
  productCategory: { type: Schema.Types.ObjectId, ref: 'ProductCategory', required: true } , 
  productSubCategory: [{ type: Schema.Types.ObjectId, ref: 'ProductSubCategory', required: true }] ,  
  images: { type: [String] } ,  
  softDelete : {type : Boolean , default : false }  
},{ timestamps : true } );  

module.exports = mongoose.model( 'Product' , productSchema ) ;  