const mongoose = require('mongoose');

const genderCategorySchema = new mongoose.Schema({
   name: { type : String ,  required: true } 
});

module.exports = mongoose.model('GenderCategory', genderCategorySchema ) ;  