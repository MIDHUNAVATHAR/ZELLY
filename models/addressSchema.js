
const mongoose = require('mongoose');
const Schema = mongoose.Schema;


//ADMIN MODEL
const addressSchema = new Schema({
    name :{ type : String },
    phone : { type : Number  },
    address : { type : String },
    city : { type : String },
    state : { type : String },
    pincode : { type : Number },
    landmark : { type : String },
    alternatePhone : { type : Number },
    addresstype : { type : String },
    userId : { type : Schema.Types.ObjectId , ref: 'UserSchema', required : true }, 
})

// Enable indexing on userId
addressSchema.index({ userId : 1 });


const Address = mongoose.model('Address', addressSchema );
module.exports = Address ;   
