
//import modules
const Bcrypt = require("bcrypt");
const Crypto = require("crypto");

//import configs
const transporter = require("../../configs/email-config")

//import schemas
const User = require("../../models/userSchema");
const Logo = require("../../models/logoSchema");
const Banner = require("../../models/bannerSchema");
const GenderCategory = require("../../models/genderCategory"); 

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
const frontPage = async (req, res) =>{
   //take the last added one logo
   const logo = await Logo.findOne().sort({ createdAt: -1 });
   //Get the last added 3 banner image 
   const banners = await Banner.find().sort({createdAt :-1}).limit(3) ; 
   const genderCategory = await GenderCategory.find();
   const user = await User.findById(req.session.userId) || req.user 
   res.render("../views/front-page.ejs",{logo, banners, genderCategory , user}) ; 
}

//get login page
const userLogin = (req , res) =>{ 
   res.redirect("/");          // get main page  :  already user authenticated using middleware
}


//post login page
const userLoginPost = async ( req , res ) => {

   let {email , password , remember_me } = req.body;
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
//    req.session.destroy((err) => {
//       if (err) {
//           return res.status(500).send('Failed to log out.');
//       }
//       res.redirect('/'); // Redirect to login or home page
//   });
      req.session.userId =null;
      res.redirect("/userLogin");
}


//post user signup
const userSignupPost = async (req,res) =>{
   let {firstName , lastName , email , password } = req.body ; 
   firstName = firstName.trim();
   lastName = lastName.trim();
   email = email.trim();
   password = password.trim();

   // Check if a user with the given email already exists
   const existingUser = await User.findOne({ email: email.trim() });

   if (existingUser) {
       res.render("../views/user-signup.ejs", { message: 'Email already exists. Please login.' });
       return;
   }

   password = await Bcrypt.hash(password,10);
   const otp = Crypto.randomBytes(3).toString('hex');
   const otpExpiry = Date.now() + 30000; // OTP valid for 30 sec 

    await User.create({
      firstName,
      lastName,
      email,
      password,
      otp,
      otpExpiry
   })

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

   sendOTPEmail(email , otp);
   
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
   res.render("user-forgot-password" , {message : ''});
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
       // res.render('common/reset-password', { message: 'Password has been reset successfully.' ,token:""});
       res.render("user-login.ejs",{message : "Password creat Success! Please Login"});
      } else {
        res.render('user-reset-password', { message: 'Passwords do not match.',token :"" });
      }
    } catch (err) {
      console.log(err);
      res.render('user-reset-password', { message: 'Error resetting password. Please try again later.',token : "" });
    }
}



module.exports = { frontPage , userLogin , userLoginPost, userSignup , userLogout ,userSignupPost ,resendEmailOtp , checkOtp , forgotPassword , forgotPasswordPost ,resetPasswordPost , resetPassword} ;   