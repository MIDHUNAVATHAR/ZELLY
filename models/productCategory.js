const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productCategorySchema = new Schema({
  name: { type: String, required: true },
  genderCategory: { type: Schema.Types.ObjectId, ref: 'GenderCategory', required : true } ,
  softDelete : { type : Boolean , default : false } 
});


module.exports = mongoose.model( 'ProductCategory' , productCategorySchema ) ;  