const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSubCategorySchema = new Schema({
  name: { type: String, required: true },
  genderCategory: { type: Schema.Types.ObjectId, ref: 'GenderCategory', required: true },
  productCategory: { type: Schema.Types.ObjectId, ref: 'ProductCategory', required: true } 
});

module.exports = mongoose.model('ProductSubCategory', productSubCategorySchema) ; 

