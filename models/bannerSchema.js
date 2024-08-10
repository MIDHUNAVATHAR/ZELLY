const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
   image : { data : Buffer , ContentType : String }
},
{ timestamps : true } 
);

module.exports = mongoose.model( 'Banner' , bannerSchema ); 