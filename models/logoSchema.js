const mongoose = require('mongoose');

const logoSchema = new mongoose.Schema({
   image : { data : String , ContentType : String }  
},
{ timestamps : true } 
); 

module.exports = mongoose.model( 'Logo' , logoSchema ) ;  


