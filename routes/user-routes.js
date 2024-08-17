const passport = require("passport");
const express = require("express");
const router = express.Router();

//import controllers
const frontPage = require("../frontend/controllers/front-page") ;
const productPage = require("../frontend/controllers/product-page");

//import middlewares
const checkAuthentication = require("../middlewares/check-authentication");


// get main page
router.get( "/" ,  frontPage.frontPage);

// get login page 
router.get("/userLogin" ,checkAuthentication , frontPage.userLogin);

//post user login
router.post("/userlogin" , frontPage.userLoginPost); 

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
router.get("/userSignup" , frontPage.userSignup);

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

//get wishlist
router.get( "/wishlist" ,productPage.wishlist);  

//get cart
router.get("/cart" ,productPage.cart);

//get categories
router.get('/categories/:id', productPage.categorySection); 


//get product page
router.get("/product/:id" ,productPage.product);






module.exports = router ;