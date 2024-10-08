

const mongoose = require('mongoose');
const Product = require('../models/product'); 



const implementOffers = async ( req , res , next ) =>{

    try {
        const productId = req.params.id; 
        
        //  Find the product by ID 
        const product = await Product.findById(productId).populate('genderCategory');

        if (!product) {
            throw new Error('Product not found') ; 
        }

        // Get the gender offer and expiry date
        const genderOffer = product.genderCategory.offer;
        const genderOfferExpiry = product.genderCategory.offerExpiry ; 

        //  Calculate the product offer and expiry date
        const productOffer = product.offer;
        const productOfferExpiry = product.offerExpiry;

        //  Determine if offers are valid
        const currentDate = new Date();
        const isGenderOfferValid = genderOfferExpiry > currentDate ;
        const isProductOfferValid = productOfferExpiry > currentDate ; 


        //  Calculate total discount if both offers are valid

        let totalDiscount = 0;
        let x =0;
        let y = 0;
        if (isGenderOfferValid) {
           
           x=genderOffer;
        }


        if (isProductOfferValid) {
            y = productOffer;
        }

        totalDiscount = 100*(1-(1- x/100)*(1- y/100)) ;
        
        totalDiscount = totalDiscount.toFixed(2);


        //  Update sizes with new discounted prices and percentages
        product.sizes.forEach(size => {
            if (totalDiscount > 0) {
                const discountAmount = size.price * (totalDiscount / 100);
                size.discountedPrice = size.price - discountAmount;
                size.discountedPercentage = totalDiscount; // Set to total discount
            } else {
                size.discountedPrice = size.price; // No discount
                size.discountedPercentage = 0; // No discount
            }
        }); 


        //  Save the updated product
        await product.save(); 

        next();

    } catch (error) {
        console.error('Error updating discounts:', error);
        return ; 
    }
}



module.exports = implementOffers  ; 