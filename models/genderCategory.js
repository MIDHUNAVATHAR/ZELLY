const mongoose = require('mongoose');

const genderCategorySchema = new mongoose.Schema({
   name: { type : String ,  required: true } , 
   softDelete : { type : Boolean , default : false },
   offer : {type : Number , default : 0},
   offerExpiry : { type : Date   } //1 day 
});


module.exports = mongoose.model('GenderCategory', genderCategorySchema ) ;  