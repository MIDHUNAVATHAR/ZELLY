const mongoose = require('mongoose');
const Schema = mongoose.Schema;


//cart schema 
const cartSchema = new Schema({
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',                    // ref is the name of the model
      required: true
    },
    items: [{
      product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      size: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true,
        min: 0
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      discountedPrice: {
        type: Number,
        min: 0
      },
      discountPercentage: {
        type: Number,
        min: 0,
        max: 100
      }
    }]
  },
   {
    timestamps: true
  });


const Cart = mongoose.model('Cart', cartSchema );
module.exports = Cart ;   