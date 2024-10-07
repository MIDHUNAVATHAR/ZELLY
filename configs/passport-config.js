const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userSchema'); // Assuming you have a User model 
require('dotenv').config();


// Google Strategy for Users
passport.use('google-user', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID , 
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ,  
    callbackURL: 'http://localhost:8001/auth/google/callback' , 
    passReqToCallback: true  // Enable request object to be passed to the callback  
}, async (req, accessToken, refreshToken, profile, done) => { 

    // Extract referral code from the state parameter
    const referralCode = JSON.parse(req.query.state).referralCode ;  

    let user = await User.findOne({ googleId: profile.id }); 
    let existingUser = await User.findOne({email : profile.emails[0].value } ) ;
    if (!user) {
        if( existingUser ){
            // If an existing user is found with the same email but without Google login
            return done(null, false, { message: 'This email is already registered. Please log in email and password' })  ; 
        }


        let referredByUser = null;
        if (referralCode) { 
            referredByUser = await User.findOne({ referralCode: referralCode }); 

            if (!referredByUser) {
                return done(null, false, { message: 'Invalid referral code' });
            }
        }


        user = await User.create({
            googleId: profile.id ,    
            email: profile.emails[0].value ,
            firstName : profile.name.givenName , 
            lastName : profile.name.familyName , 
            verified : true,
            referralCode: referralCode || null , // Save referral code if available,
            referredBy: referredByUser ? referredByUser._id : null 
        });  

     // If there's a referrer, update their referral count and rewards
     if (referredByUser) {
        referredByUser.referralCount += 1;
        referredByUser.rewardsBalance += 10; // Example reward for a successful referral   
        await referredByUser.save();
    }


    }
    done(null, user);
})); 


passport.serializeUser((user, done) => {
    done(null, user.id); // Serialize only the user ID
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        if (user) {
            done(null, user); 
        } else {
            done(null, false, { message: 'User not found' });
        }
    } catch (err) {
        done(err, null);
    }
});

