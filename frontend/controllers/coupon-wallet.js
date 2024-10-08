
const User = require("../../models/userSchema");
const Cart = require("../../models/cartSchema");
const Coupon = require("../../models/couponSchema");
const Wishlist = require("../../models/wishList");
const Product = require("../../models/product" ) ;
const Review = require("../../models/reviewShema") ;



const walletAddCart = async (req,res) =>{
    try{
    const userId =  req.session.userId || req.user.id ;
    const user  =  await User.findById(userId); 
    const cart = await Cart.findOne( {user : userId} );
    let cartTotal = cart.items.reduce((total, item) => total + item.quantity * item.discountedPrice , 0); 
    let walletAmount = user.walletBalance;

    if(cartTotal >= walletAmount){
        cart.walletBalance = walletAmount;
        user.walletBalance = 0;
       
    }else{
        cart.walletBalance = cartTotal ;
        user.walletBalance = walletAmount - cartTotal ;
    }
    cart.save()
    user.save()
    res.redirect("/cart");
 }catch(err){
    console.log(err);
 }
} 




//wallet remove 
const walletRemoveCart = async (req,res) =>{
    try{
        const userId =  req.session.userId || req.user.id ;
        const user  =  await User.findById(userId);
        const cart = await Cart.findOne( {user : userId} );
       
        let walletApplied = cart.walletBalance ;

        // Restore the wallet balance and reset the applied wallet amount in cart
        user.walletBalance += walletApplied ;
        cart.walletBalance = 0;

        cart.save()
        user.save()
        res.redirect("/cart");
     }catch(err){
        console.log(err);
     }    
}




//add coupon
const couponAddCart = async (req,res) => {
    try{
       const userId =  req.session.userId || req.user.id ; 
       const user  =  await User.findById(userId);
       const cart = await Cart.findOne( {user  : userId }); 

       const couponCode = await  req.body.couponCode.trim();
       const coupon = await Coupon.findOne({ code : couponCode });
       
       const userCoupon = user.appliedCoupons.find(coupon => coupon.couponCode === couponCode ) ; 
       
       if(!coupon){
          return res.redirect("/cart?coupon=0")
       }else if(coupon.expiryDate <= Date.now()){ 
          return res.redirect("/cart?coupon-expiry=0")
       }else if(userCoupon ){ 
            if (userCoupon.totalApply >= coupon.usageLimit) { 
              
                return res.redirect("/cart?coupon-limit=0");   
              } 
              // Increment the usage limit if it's still within the allowed limit
              else { 
                userCoupon.totalApply += 1 ;
                user.couponBalance = coupon.couponBalance ; 
                user.coupon = userCoupon._id;
                cart.couponBalance = coupon.couponBalance ;
              }
       }else{
        user.appliedCoupons.push({
            couponCode: couponCode , 
            totalApply : 1, // Initial usage
          });
          user.couponBalance = coupon.couponBalance ; 
          cart.couponBalance = coupon.couponBalance ;
       }
 
       // Save the updated user document 
       const Updateduser = await user.save();
       const usercoupon = Updateduser.appliedCoupons.find(coupon => coupon.couponCode === couponCode ) ; 
       Updateduser.coupon = usercoupon._id ; 

       await cart.save();
       await user.save();
       return res.redirect("/cart?coupon-success=1");

    }catch(err){
        console.log(err);
        return res.redirect("/cart?coupon-error=1");
    }
}




//remove coupon
const removeCoupon = async ( req,res ) =>{
   const couponId = req.body.coupon ;

   const userId =  req.session.userId || req.user.id ;  
   const user  =  await User.findById(userId);
   const cart = await Cart.findOne( {user  :userId}); 

   const userCoupon = user.appliedCoupons.find(coupon => coupon._id.equals(couponId));
   userCoupon.totalApply  =  userCoupon.totalApply - 1 ; 
   user.couponBalance = 0 ;
   user.coupon = null ;
   cart.couponBalance = 0 ;
   user.save();
   cart.save();

   res.redirect("/cart") ; 
}




//add-to-wishlist
const addToWishlist = async ( req,res ) =>{
   let userId ;   
   if(req.session.userId){
     userId = req.session.userId ;  
   }else if(req.user){
     userId = req.user._id  ;  
   }else{
      return res.status(401).json({ success: false, redirect: '/userLogin' }); 
   }

   try {
    
      const { productId, sizeId } = req.body;
      

      // Find the user's wishlist (assuming you have a Wishlist schema)
      let wishlist = await Wishlist.findOne({ user: userId });

      if (!wishlist) {
          // If the wishlist doesn't exist, create a new one
          wishlist = new Wishlist({ user: userId, items: [] , sizeId });
      }


        // Check if the product with the same size already exists in the wishlist
      const itemExists = wishlist.items.some(
          (item) => item.product.toString() === productId && item.sizeId.toString() === sizeId
      );

      if (itemExists) {
          // If the item exists, return a response indicating it's already added
          return res.json({ success: false, message: 'Product with this size is already in your wishlist!' });
      }

      // Add the product to the wishlist
      wishlist.items.push({ product: productId, sizeId });

      // Save the updated wishlist
      await wishlist.save();

      // Respond with success
      res.json({ success: true });
  } catch (error) {
      console.error('Error adding item to wishlist:', error);
      res.status(500).json({ success: false, message: 'Server error' });
  }
}




//REMOVE WISHLIST ITEM
const removeWishlistitem = async ( req,res) =>{
  try{
    let userId = req.session.userId || req.user._id ;  

    const itemId = req.params.id ;
    const result = await Wishlist.updateOne(
      { user: userId }, // Match the wishlist by user ID
      { $pull: { items: { _id: itemId } } } // Pull the item with the specified itemId
    );

    if (result.modifiedCount > 0) {
      res.status(200).json({ message: 'Item removed from wishlist successfully.' });
    } else {
      res.status(404).json({ message: 'Item not found in wishlist.' });
    }
  }catch(err){ 
    console.log(err);
    res.status(404).json({ message: 'Item not found in wishlist.' });
  }
 
}




//submit review
const submitReview = async ( req , res ) =>{
    try {
      const { productId, rating, comment } = req.body;
  
      // Assuming user is authenticated, get user ID
      const userId =  req.session.userId || req.user.id ;
  
      // Create a new review
      const newReview = new Review({
        user: userId,
        product: productId,
        rating,
        comment
      });
  
      // Save the review
      const savedReview = await newReview.save();
  
      // Update the product with the new review
      await Product.findByIdAndUpdate(productId, {
        $push: { reviews: savedReview._id }
      });
  
      res.status(200).json({ success: true, message: 'Review added successfully!' });
    } catch (error) {
      console.error('Error adding review:', error);
      res.status(500).json({ success: false, message: 'Failed to add review' });
    }
  };







module.exports = { walletAddCart ,walletRemoveCart ,couponAddCart , removeCoupon , addToWishlist , removeWishlistitem  , submitReview }   