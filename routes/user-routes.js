const passport = require("passport");
const express = require("express");
const router = express.Router();

//import controllers
const frontPage = require("../frontend/controllers/front-page") ;
const productPage = require("../frontend/controllers/product-page") ;
const cartManagement = require("../frontend/controllers/cart-management");
const razorPay = require("../frontend/controllers/razor-pay") ;
const couponWallet = require("../frontend/controllers/coupon-wallet");
const pdfDownload  = require("../frontend/controllers/pdfController");


//import middlewares
const checkAuthentication = require("../middlewares/check-authentication") ; 
const cartAvailability = require("../middlewares/check-cartavailability");
const implementOffers  = require("../middlewares/implement-offers"); 


// get main page
router.get( "/"  ,  frontPage.frontPage ) ;

// get login page 
router.get("/userLogin" , checkAuthentication , frontPage.userLogin )  ;

//post user login
router.post("/userlogin" , frontPage.userLoginPost) ; 



// Google login route (with referral code)
router.get('/auth/google/login', (req, res, next) => {
    const referralCode = req.query.referral || ''; // Capture referral code from query params if present

    // Pass referral code in the state parameter
    passport.authenticate('google-user', {
        scope: ['profile', 'email'],
        state: JSON.stringify({ referralCode }) // Send referral code as part of OAuth state
    })(req, res, next);
});


router.get('/auth/google/callback', passport.authenticate( 'google-user', {
    failureRedirect: '/userLogin'
}), (req, res) => {
    // Successful authentication, redirect home.
    res.redirect('/'); 
});  
 

// get signup page
router.get("/userSignup" , frontPage.userSignup ) ;

//post signup 
router.post("/userSignupPost" , frontPage.userSignupPost ) ; 

//post user resend otp
router.post("/resendEmailOtp" , frontPage.resendEmailOtp );

//user logout
router.get("/userLogout" , frontPage.userLogout ); 

//post user check otp
router.post("/userCheckOtp" , frontPage.checkOtp );

//get forgot password
router.get("/userForgotPassword" ,frontPage.forgotPassword );

//post forgot password
router.post("/userForgotPassword" , frontPage.forgotPasswordPost );

//get reset password
router.get("/userResetPassword/:token" , frontPage.resetPassword );   

//post reset password
router.post("/userResetPassword/:token" , frontPage.resetPasswordPost );




//get blocked page
router.get("/blocked" , productPage.blocked);

//get user profile page
router.get("/userProfile" , checkAuthentication , productPage.showProfile ) ; 

//post user profile page edit
router.post("/userProfile" , productPage.editProfilePost);

//get user adress management
router.get("/userAdressMang" ,checkAuthentication,productPage.userAdressMng );

//add addresses
router.post("/saveAddress" , productPage.saveAddress );

//delete addresses
router.get("/deleteAddress/:id" , productPage.deleteAddress); 

//post edit address
router.post("/saveEditAddress/:id" , productPage.editAddress);

//get wishlist
router.get( "/wishlist" , checkAuthentication, productPage.wishlist); 

//get cart
router.get("/cart" ,checkAuthentication, cartAvailability, productPage.cart) ;


//get categories
router.get('/categories/:id', productPage.categorySection); 

//get product page
router.get("/product/:id", implementOffers  ,productPage.product) ;

//get products page
router.get("/products" , productPage.products)


//post add to cart
router.post( "/addToCart", cartManagement.addToCart); 

//post update cart item quantity increment;
router.post("/cartProductInc" , cartManagement.increQuantity); 

//post update cart item quantity decrement ; 
router.post("/cartProductDec" , cartManagement.decreQuantity);

//post remove quantity
router.post("/removeItem" , cartManagement.removeItem ); 

//get my orders
router.get("/myOrders" , cartManagement.myOrders); 

//get checkout delivery address
router.get("/checkout" ,checkAuthentication , cartAvailability , cartManagement.checkout ); 

//post place order
router.post('/placeorder' ,cartAvailability , cartManagement.placeorder); 

//post cancel order
router.post("/cancelOrder" , cartManagement.cancelOrder ) 

//get order view page 
router.get("/myOrders/:orderId" , cartManagement.viewOrder ); 



//razor -pay
router.post("/create-order" ,razorPay.createOrder );

router.post("/verify-payment" , razorPay.verifyPayment ) ;

router.post("/payment-failed" , razorPay.paymentFailed ) ;

router.post('/continue-failed-payment', razorPay.continuePayment );

router.post("/continue-verify-payment" , razorPay.continueVerifyPayment );





//post  add wallet to cart
router.post("/add-wallet-cart" , couponWallet.walletAddCart)

//post remove wallet cart
router.post("/remove-wallet-cart" , couponWallet.walletRemoveCart ) ;

//post add coupon
router.post("/add-coupon-code" , couponWallet.couponAddCart );

//post remove coupon
router.post("/remove-coupon-code" , couponWallet.removeCoupon ); 

//post add-wishlist
router.post("/wishlist/add" , couponWallet.addToWishlist) ;

//delete remove wishl;ist item
router.delete("/removeWishlistItem/:id" , couponWallet.removeWishlistitem ); 

//submit review
router.post("/submitReview" , couponWallet.submitReview ) ;


 router.get('/api/orders/download-pdf/:orderId', pdfDownload.generateOrderPDF );



module.exports = router ;