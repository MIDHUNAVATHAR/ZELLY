

const mongoose = require('mongoose');
const Product = require('../models/product'); 

const implementOffers = async ( req , res , next ) =>{

    try {
        const productId = req.params.id; 
        console.log(productId)
        // Step 1: Find the product by ID
        const product = await Product.findById(productId).populate('genderCategory');

        if (!product) {
            throw new Error('Product not found') ; 
        }

        // Step 2: Get the gender offer and expiry date
        const genderOffer = product.genderCategory.offer;
        const genderOfferExpiry = product.genderCategory.offerExpiry ; 

        // Step 3: Calculate the product offer and expiry date
        const productOffer = product.offer;
        const productOfferExpiry = product.offerExpiry;

        // Step 4: Determine if offers are valid
        const currentDate = new Date();
        const isGenderOfferValid = genderOfferExpiry > currentDate ;
        const isProductOfferValid = productOfferExpiry > currentDate ; 

        // Step 5: Calculate total discount if both offers are valid

         //Combined Percentage=1−((1−Percentage 1)×(1−Percentage 2))

        let totalDiscount = 0;
        let x =0;
        let y = 0;
        if (isGenderOfferValid) {
           // totalDiscount += genderOffer ; 
           x=genderOffer;
        }
        if (isProductOfferValid) {
           // totalDiscount += productOffer ;
            y = productOffer;
        }

        totalDiscount = 100*(1-(1- x/100)*(1- y/100)) ;
        
        totalDiscount = totalDiscount.toFixed(2);

        // Step 6: Update sizes with new discounted prices and percentages
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

        // Step 7: Save the updated product
        await product.save(); 
        console.log('Discounts updated successfully:', product) ;  

        next();

    } catch (error) {
        console.error('Error updating discounts:', error);
        return ; 
    }
}



module.exports = implementOffers  ; 