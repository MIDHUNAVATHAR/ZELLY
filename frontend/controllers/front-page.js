
//import modules
const Bcrypt = require("bcrypt");
const Crypto = require("crypto");

//import configs
const transporter = require("../../configs/email-config"); 


//import schemas
const User = require("../../models/userSchema") ;
const Logo = require("../../models/logoSchema") ;  
const Banner = require("../../models/bannerSchema") ;
const GenderCategory = require("../../models/genderCategory") ;   
const ProductCategory = require("../../models/productCategory") ; 
const ProductSubCategory = require("../../models/productSubCategory") ;
const Product = require("../../models/product") ; 
const Cart = require("../../models/cartSchema") ;




//send email otp function
const sendOTPEmail = async (email, otp) => {
   let mailOptions = {
     from: process.env.MAIL_ID, 
     to: email,
     subject: 'Your OTP for User Verification', 
     text: `Your OTP is: ${otp}`
   };
 
   await transporter.sendMail(mailOptions);
 }



 //send password reset email
 const sendPasswordResetEmail = async(email , token , host) =>{
   let mailOptions = {
      to: email,
      from: process.env.MAIL_ID,
      subject: 'Password Reset',
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        http://${host}/userResetPassword/${token}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`
    };

    await transporter.sendMail(mailOptions);
 }





//get front page
const frontPage = async (req, res) => {
   try {
     const logo = await Logo.findOne().sort({ updatedAt: -1 }); 
     const banners = await Banner.find().sort({updatedAt :-1}).limit(3) ;   
     const user = await User.findById(req.session.userId) || req.user
     const genderCategory = await GenderCategory.find({softDelete : false}) ;    
     //const productCategory = await ProductCategory.find({softDelete : false}) ; 
     const subCategories = await ProductSubCategory.find({softDelete : false}).populate('genderCategory productCategory'); 

     const subCategoryProducts = await Promise.all( subCategories.map ( async ( subCategory ) => {
        const products = await Product.find({ productSubCategory : { $in: [subCategory._id] } , softDelete : false })  
          .sort({ createdAt: -1 })  
          .limit(8); 
         return {    
           subCategory,      
           products  
         };
     })) ; 
     
     let cartTotal ; 
     if(user){
     const cart = await Cart.findOne({user : user._id});
     if(cart){
      cartTotal = cart.items.reduce((total, item) =>{  
        return item.status== "Available" ? total + item.quantity : total},
         0); 
      }
     }else{
     cartTotal = 0;
     }
     
     res.render('front-page', { subCategoryProducts , logo , banners , user , genderCategory ,cartTotal } )  ; 
   } catch (error) {
     console.error(error);
     res.status(500).send('Error loading main page') ;
   }
 };



//get login page 
const userLogin = (req , res) =>{ 
   res.redirect("/");          // get main page  :  already user authenticated using middleware
}



//post login page
const userLoginPost = async ( req , res ) => {

   let {email , password , remember_me } = req.body ;
   email  = email.trim();
   password = password.trim(); 
   
   const user = await User.findOne({email });

   if(user){
      if(user.status == "block"){
         return res.render("blocked-page");
      }
      const passwordCompare = await Bcrypt.compare(password , user.password);
      if(user.googleId){ 
         res.render( "../views/user-login.ejs" ,{message : "Please continue with gooogle"} );
         return;
      }else if(!passwordCompare){ 
         res.render( "../views/user-login.ejs" ,{message : "Incorrect Password" } );  
         return
      }else{
         if(remember_me){
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
         } 
         req.session.userId = user._id ;
         res.redirect("/"); 
         return;
      }
      
   }else{
      res.render( "../views/user-login.ejs" ,{message : "Email can't exists. Please signup with Register"} );
      return;
   }
}




//get signup page
const userSignup = (req,res) =>{
   res.render( "../views/user-signup.ejs" , {message : ""}); 
}




// user logout
const userLogout = (req,res) =>{
   req.session.destroy((err) => {
      if (err) {
          return res.status(500).send('Failed to log out.');
      }
      res.redirect('/userlogin'); // Redirect to login
  }); 
     
}




//post user signup
const userSignupPost = async (req,res) =>{
   let {firstName , lastName , email , password } = req.body ; 
   firstName = firstName.trim();
   lastName = lastName.trim();
   email = email.trim();
   password = password.trim();

    // First find the referring user by their referral code
    const referringUser = await User.findOne({ 
      referralCode: req.query.referralCode 
    });


   // Check if a user with the given email already exists
   const existingUser = await User.findOne({ email: email.trim() });

   if (existingUser) {
       res.render("../views/user-signup.ejs", { message: 'Email already exists. Please login.' });
       return;
   }

   password = await Bcrypt.hash(password,10)  ;
   const otp = Crypto.randomBytes(3).toString('hex');
   const otpExpiry = Date.now() + 30000; // OTP valid for 30 sec 


  const user = new User({
    firstName,
    lastName,
    email,
    password,
    otp,
    otpExpiry,
    referredBy: referringUser ? referringUser._id : null
  });

  
  await user.save();

  // If there was a referring user, update their referral count and maybe add rewards
  if (referringUser) {
    await User.findByIdAndUpdate(referringUser._id, {
      $inc: { 
        referralCount: 1 ,
        rewardsBalance: 10 // or whatever reward amount
      }
    });
  }
 

   sendOTPEmail(email , otp);


   res.render("../views/user-otp-verify" , {email : email ,  message : `An OTP is sent to your registered email : ${email} . Plese enter Otp for verify.`});

}




//post resend otp
const resendEmailOtp =async (req ,res) =>{ 
   let {email } = req.body; 
   email=email.trim();
   const user = await User.findOne({email});
   const otp = Crypto.randomBytes(3).toString('hex');
   const otpExpiry = Date.now() + 30000; // OTP valid for 30 sec 

   user.otp = otp;
   user.otpExpiry = otpExpiry;
   user.save(); 

   sendOTPEmail( email , otp ) ; 
   
   res.render("../views/user-otp-verify" , {email : email ,  message : `A new OTP is sent to your registered email : ${email} . Plese enter new Otp for verify.`});  
   
}




//post check otp for verify
const checkOtp = async (req,res) =>{ 
   let { email , otp } = req.body;
   email = email.trim(); 
   otp = otp.trim();

   const user = await User.findOne({email});
   if(user){
    if(user.otp == otp && user.otpExpiry > Date.now()){
      user.otp = null;
      user.otpExpiry = null;
      user.verified = true; 
      user.save();
      res.redirect("/");
      return;
    }else{
      const otp = Crypto.randomBytes(3).toString('hex');
      const otpExpiry = Date.now() + 30000; // OTP valid for 30 sec 
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      user.save(); 
      sendOTPEmail(email , otp); 
      res.render("../views/user-otp-verify" , {email : email ,  message : `Invalid Otp : ${email} . A New otp will be send.`}); 
      return;
    }
   }else{
      res.render("../views/user-signup.ejs", { message: 'Try Again.' }); 
      return;
   } 
}





//get forgot password
const forgotPassword = (req,res) =>{
   res.render("user-forgot-password" , { message : ''} );
} 



//post forgotpassword
const forgotPasswordPost = async (req, res) =>{
   let email = req.body.email ;
   email = email.trim();  
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.render('user-forgot-password', { message: 'Email does not exist.' });
    }
   
    // Generate a token
    const token =Crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken =  token;

    user.resetPasswordExpires = Date.now() + 600000; // 1 min
    await user.save();

    await sendPasswordResetEmail(user.email , token , req.headers.host);

    res.render('user-forgot-password', { message: 'An email has been sent to ' + user.email + ' with further instructions.' });
  } catch (err) {
    console.log(err);
    res.render('user-forgot-password', { message: 'Error sending email. Please try again later.' });
  }

}




//get reset password  
const resetPassword = async (req,res) =>{
   try {
      const user = await User.findOne({
        resetPasswordToken : req.params.token  
      });
      if (!user) {
        return res.render('user-reset-password', { message: 'Password reset token is invalid or has expired.',token:"" });
      }
      res.render('user-reset-password', { token: req.params.token , message : "create new password" });
    } catch (err) {
      res.render('user-reset-password', { message: 'Error loading reset form. Please try again later.' });
    }
}




//post reset password
const resetPasswordPost =async (req , res) =>{
   try {
      const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() } 
      });
      if (!user) {
        return res.render('user-reset-password', { message: 'Password reset token is invalid or has expired.' });
      }
  
      if (req.body.password === req.body.confirm) {
        user.password = await Bcrypt.hash(req.body.password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined; 
        await user.save();

       res.render("user-login.ejs",{message : "Password creat Success! Please Login"});
      } else {
        res.render('user-reset-password', { message: 'Passwords do not match.',token :"" });
      }
    } catch (err) {
      console.log(err);
      res.render('user-reset-password', { message: 'Error resetting password. Please try again later.', token : "" });
    }
} 



module.exports = { frontPage , userLogin , userLoginPost , userSignup , userLogout , userSignupPost , resendEmailOtp , checkOtp , forgotPassword , forgotPasswordPost , resetPasswordPost , resetPassword } ;   