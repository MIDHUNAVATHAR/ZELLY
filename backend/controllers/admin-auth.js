
//import modules
const Bcrypt = require("bcrypt");
const Crypto = require("crypto");

//import configs
const transporter = require("../../configs/email-config") ;

//import schema
const Admin = require( "../../models/adminSchema") ; 


//send email otp function
const sendOTPEmail = async (email, otp) => {
    let mailOptions = {
      from: process.env.MAIL_ID, 
      to: email,
      subject: 'Your OTP for Admin Verification', 
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
        http://${host}/admin/adminResetPassword/${token}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`
    };

    await transporter.sendMail(mailOptions);
 }


//get login
const adminLogin = ( req , res) =>{
  if(  req.session.adminId ){
     res.render("admin-dashboard" , {admin : req.session.adminEmail , partial : "../views/partials/dashboard.ejs"}); 
     return; 
  }else{
     res.render( "admin-login.ejs" ,{message : ""} ); 
     return;
  }
}


//post login
const loginPost = async ( req , res ) =>{
    let {email , password , remember_me } = req.body;
    email  = email.trim();
    password = password.trim();
    
    const admin = await Admin.findOne({email });
    
    if(admin){

        const passwordCompare = await Bcrypt.compare(password , admin.password);
       if(!passwordCompare){ 
          res.render( "admin-login.ejs" ,{message : "Incorrect Password" } );   
          return
       }else{
          if(remember_me){
             req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
          }
          req.session.adminId = admin._id ;
          req.session.adminEmail = admin.email;
          res.redirect("/admin/dashboard");  
          return;
       }
       
    }else{
       res.render( "admin-login.ejs" ,{message : "Email can't exists. Please signup with Register"} );
       return;  
    }
}

//get signup
const adminSignup = ( req , res ) =>{
    res.render( "admin-signup.ejs" ,{message : ""} ); 
} 

//admin logout
const adminLogout = (req,res) =>{

    req.session.adminId = null;
    res.redirect("/admin");
 }


 //post admin signup
const adminSignupPost = async (req,res) =>{   
    let {firstName , lastName , email , password } = req.body ; 
   
    firstName = firstName.trim();
    lastName = lastName.trim();
    email = email.trim();
    password = password.trim();
    
    const adminCount = await Admin.countDocuments();

    // Check if a user with the given email already exists
    const existingAdmin = await Admin.findOne({ email: email}); 
 
    if (existingAdmin) {
        res.render("admin-signup.ejs", { message: 'Admin already exist . Please Login.' });
        return;
    }else if( adminCount < 1){
        password = await Bcrypt.hash(password,10);
        const otp = Crypto.randomBytes(3).toString('hex'); 
        const otpExpiry = Date.now() + 30000; // OTP valid for 30 sec 
 
     await Admin.create({
       firstName,
       lastName,
       email,
       password,
       otp,
       otpExpiry
    })
 
         sendOTPEmail(email , otp);
 
    res.render("admin-otp-verify" , {email : email ,  message : `An OTP is sent to your registered email : ${email} . Plese enter Otp for verify.`});
    return;
    }else{
        res.redirect("/admin"); 
    }
 }


//post resend otp
const resendEmailOtp =async (req ,res) =>{ 
    let {email } = req.body; 
    email=email.trim();
    const admin = await Admin.findOne({email});
    const otp = Crypto.randomBytes(3).toString('hex');
    const otpExpiry = Date.now() + 30000; // OTP valid for 30 sec 
 
    admin.otp = otp;
    admin.otpExpiry = otpExpiry;
    admin.save(); 
 
    sendOTPEmail(email , otp);
    
    res.render("user-otp-verify" , {email : email ,  message : `A new OTP is sent to your registered email : ${email} . Plese enter new Otp for verify.`});  
    
 }



 //post otp verify
 const adminCheckOtp = async (req,res) =>{
    let { email , otp } = req.body;
    email = email.trim(); 
    otp = otp.trim();
 
    const admin = await Admin.findOne({email});
    if(admin){
     if(admin.otp == otp && admin.otpExpiry > Date.now()){
       admin.otp = null;
       admin.otpExpiry = null;
       admin.verified = true; 
       admin.save();
       res.redirect("/admin");
       return;
     }else{
       const otp = Crypto.randomBytes(3).toString('hex');
       const otpExpiry = Date.now() + 30000; // OTP valid for 30 sec 
       admin.otp = otp;
       admin.otpExpiry = otpExpiry;
       admin.save(); 
       sendOTPEmail(email , otp); 
       res.render("admin-otp-verify" , {email : email ,  message : `Invalid Otp : ${email} . A New otp will be send.`}); 
       return;
     }
    }else{
       res.render("admin-signup.ejs", { message: 'Try Again.' });  
       return;
    } 
 }



 //get forgot password
 const forgotPassword = (req ,res) =>{
   res.render("admin-forgot-password", {message : 'Enter your email for Password Reset Link '} );
 }
 


 //post forgot password
 const forgotPasswordPost =async (req,res) =>{
   let email = req.body.email ;
   email = email.trim();  
  try {
    const admin = await Admin.findOne({ email }); 
    if (!admin) {
      return res.render('admin-forgot-password', { message: 'Email does not exist.' });
    }
   
    // Generate a token
    const token =Crypto.randomBytes(20).toString('hex');
    admin.resetPasswordToken =  token;

    admin.resetPasswordExpires = Date.now() + 600000; // 1 min
    await admin.save();

    await sendPasswordResetEmail(admin.email , token , req.headers.host);  

    res.render('admin-forgot-password', { message: 'An email has been sent to ' + admin.email + ' with further instructions.' });
  } catch (err) {
    console.log(err);
    res.render('admin-forgot-password', { message: 'Error sending email. Please try again later.' });
  }

 }




 const resetPassword = async (req, res) =>{
   try {
      const admin = await Admin.findOne({
        resetPasswordToken : req.params.token
      });
      if (!admin) {
        return res.render('admin-reset-password', { message: 'Password reset token is invalid or has expired.',token:"" });
      }
      res.render('admin-reset-password', { token: req.params.token , message : "create new password" });
    } catch (err) {
      res.render('admin-reset-password', { message: 'Error loading reset form. Please try again later.' });
    }
 }





 //post reset opassword
 const resetPasswordPost = async (req,res) =>{  
   try {
      const admin = await Admin.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() } 
      });
      if (!admin) {
        return res.render('admin-reset-password', { message: 'Password reset token is invalid or has expired.' });
      }
  
      if (req.body.password === req.body.confirm) { 
        admin.password = await Bcrypt.hash(req.body.password, 10);
        admin.resetPasswordToken = undefined;
        admin.resetPasswordExpires = undefined; 
        await admin.save();
         
       res.render("admin-login.ejs",{message : "Password creat Success! Please Login"});
      } else {
        res.render('admin-reset-password', { message: 'Passwords do not match.',token :"" });
      }
    } catch (err) {
      console.log(err);
      res.render('admin-reset-password', { message: 'Error resetting password. Please try again later.',token : "" });
    }
 }




module.exports = { adminLogin , adminSignup ,loginPost , adminLogout ,adminSignupPost , adminCheckOtp , resendEmailOtp ,
   forgotPassword ,forgotPasswordPost , resetPassword , resetPasswordPost };  