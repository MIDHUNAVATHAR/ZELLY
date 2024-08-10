const mongoose = require('mongoose');

const logoSchema = new mongoose.Schema({
   image : { data : Buffer , ContentType : String }
},
{ timestamps : true } 
);

module.exports = mongoose.model( 'Logo' , logoSchema ) ; 


