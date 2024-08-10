const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userSchema'); // Assuming you have a User model 
require('dotenv').config();


// Google Strategy for Users
passport.use('google-user', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID, 
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ,  
    callbackURL: 'http://localhost:8001/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => { 
    let user = await User.findOne({ googleId: profile.id }); 
    if (!user) {
        user = await User.create({
            googleId: profile.id, 
            email: profile.emails[0].value,
            firstName : profile.name.givenName,
            lastName : profile.name.familyName,
            verified : true,
        });
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

