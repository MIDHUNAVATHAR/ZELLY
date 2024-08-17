const mongoose = require('mongoose');

const genderCategorySchema = new mongoose.Schema({
   name: { type : String ,  required: true } , 
   softDelete : { type : Boolean , default : false }  
});

module.exports = mongoose.model('GenderCategory', genderCategorySchema ) ;  