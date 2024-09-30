const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Review Schema
const reviewSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId, 
        ref: 'User', // Reference to the User who gave the review
        required: true
    },
    product: {
        type: Schema.Types.ObjectId, 
        ref: 'Product', // Reference to the Product being reviewed
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1, // Minimum rating is 1
        max: 5  // Maximum rating is 5
    },
    comment: {
        type: String,
        required: true, // Comment provided by the customer
        maxlength: 1000  // Set a max length for the comment
    },
},{timestamps : true});

// Create the Review model
const Review = mongoose.model( 'Review' , reviewSchema );

module.exports = Review ; 
