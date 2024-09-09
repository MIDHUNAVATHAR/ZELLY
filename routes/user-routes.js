const passport = require("passport");
const express = require("express");
const router = express.Router();

//import controllers
const frontPage = require("../frontend/controllers/front-page") ;
const productPage = require("../frontend/controllers/product-page") ;
const cartManagement = require("../frontend/controllers/cart-management");

//import middlewares
const checkAuthentication = require("../middlewares/check-authentication") ; 


// get main page
router.get( "/"  ,  frontPage.frontPage ) ;

// get login page 
router.get("/userLogin" , checkAuthentication , frontPage.userLogin )  ;

//post user login
router.post("/userlogin" , frontPage.userLoginPost) ; 


//google login
router.get('/auth/google/login', passport.authenticate('google-user', { 
    scope: ['profile', 'email']
}));

router.get('/auth/google/callback', passport.authenticate('google-user', {
    failureRedirect: '/userLogin'
}), (req, res) => {
    // Successful authentication, redirect home.
    res.redirect('/');
});


// get signup page
router.get("/userSignup" , frontPage.userSignup) ;

//post signup 
router.post("/userSignupPost" , frontPage.userSignupPost) ;  

//post user resend otp
router.post("/resendEmailOtp" , frontPage.resendEmailOtp);

//user logout
router.get("/userLogout" , frontPage.userLogout); 

//post user check otp
router.post("/userCheckOtp" , frontPage.checkOtp);

//get forgot password
router.get("/userForgotPassword" ,frontPage.forgotPassword );

//post forgot password
router.post("/userForgotPassword" , frontPage.forgotPasswordPost);

//get reset password
router.get("/userResetPassword/:token" , frontPage.resetPassword);   

//post reset password
router.post("/userResetPassword/:token" , frontPage.resetPasswordPost);




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
router.get("/cart" ,checkAuthentication, productPage.cart) ;


//get categories
router.get('/categories/:id', productPage.categorySection); 

//get product page
router.get("/product/:id" ,productPage.product) ;

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
router.get("/checkout" , cartManagement.checkout); 






module.exports = router ;