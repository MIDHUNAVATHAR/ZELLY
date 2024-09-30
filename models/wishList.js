const mongoose = require("mongoose") ;
const Schema = mongoose.Schema;


const wishlistSchema = new mongoose.Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User', 
        required: true
      },
    items: [{
      product: {
        type: Schema.Types.ObjectId ,
        ref: 'Product',
        required: true
      },sizeId : { type : Schema.Types.ObjectId } 
    }]
}) 

module.exports  =  mongoose.model( 'Wishlist' , wishlistSchema ) ;  


