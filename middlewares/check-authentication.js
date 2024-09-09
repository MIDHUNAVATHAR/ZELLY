
const User = require("../models/userSchema");


const checkAuthentication = async (req, res ,next) =>{
    if (req.session.userId  ||   req.isAuthenticated() ) {                                     
        // User is authenticated, proceed to check if they are blocked     
    try{
        const user = await User.findById(req.session.userId || req.user.id) ; 
        if(user && user.status == "block"){
           return  res.render("blocked-page.ejs");
        }
        next(); 

    }catch(err){
        console.log("Error checking user status ",err ) ;
        return;
      }
    }else{
       return  res.render("user-login" ,{ message : '' });
    }
}

module.exports = checkAuthentication;