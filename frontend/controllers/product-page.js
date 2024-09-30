
//import schemas
const User = require("../../models/userSchema") ;
const Logo = require("../../models/logoSchema") ;
const GenderCategory = require("../../models/genderCategory") ;
const productCategory = require("../../models/productCategory") ;
const productSubCategory = require("../../models/productSubCategory") ;
const Product = require("../../models/product") ;
const genderCategory = require("../../models/genderCategory");
const Address = require("../../models/addressSchema");
const Cart = require("../../models/cartSchema");
const WishList  = require("../../models/wishList") ; 


//get blocked page
const blocked = (req,res) =>{
  res.render("../views/blocked-page.ejs");
}
 
//get wishlist
const wishlist = async ( req , res ) =>{
   const logo = await Logo.findOne().sort({ updatedAt: -1 });
   const genderCategory = await GenderCategory.find({softDelete : false});  
   const userId = req.session.userId || req.user._id ; 
   const user = await User.findById( userId ) ;
   const cart = await Cart.findOne({ user : userId })
   const wishlist = await WishList.findOne({ user : userId }).populate("items.product");
  
   let cartTotal =0 ;
   if(cart){
    cart.items.forEach(item =>{
      cartTotal += item.quantity ;
    })
   } 
    

   if(wishlist && wishlist.items.length > 0){
   const wishlistItem = wishlist.items[0]; // Assuming you're interested in the first item
   const product = wishlistItem.product;
  //  const specificSize = product.sizes.find(size => size._id.toString() === wishlistItem.sizeId.toString()); 
   }   


   res.render("../views/wish-list.ejs" ,{logo, genderCategory , user , wishlist , cartTotal });  
}



//get cart
const cart = async ( req,res ) =>{
    const logo = await Logo.findOne().sort({ updatedAt: -1 });
    const genderCategory = await GenderCategory.find({ softDelete : false}); 
    const user = await User.findById(req.session.userId) || req.user  ;       // req.user is user obejct
    const cart = await Cart.findOne({ user }).populate('items.product');

   let cartTotal ; 
   if(user){
   const cart = await Cart.findOne({user : user._id});
   if(cart){
    cartTotal = cart.items.reduce((total, item) => {
      return item.status === "Available" ? total + item.quantity : total ;
    }, 0); 
   }
   }else{
   cartTotal = 0 ; 
   }
 

   if(cart){
    let totalItems =0 ;
    cart.items.forEach(item =>{
      totalItems += item.quantity ;
    })

    let totalPrice = 0;  
   
    for(let i=0 ; i< cart.items.length ; i++){  
      if(cart.items[i].status == "Available"){
        for(let m =0 ; m < cart.items[i].quantity ; m++ ){
            totalPrice += cart.items[i].discountedPrice ;
        }
      }
    }

   //
   let totalP = totalPrice


    let couponDiscount =  cart.couponBalance || 0;   
    let walletDiscount = cart.walletBalance || 0; 
    
    
     // Apply coupon first 
     if (couponDiscount > 0) {
      if (totalP <= couponDiscount) {
        // Coupon is larger than or equal to totalPrice, so totalPrice becomes 0
        couponDiscount = totalP;
        cart.couponBalance = totalP; // Full coupon is used
        totalP= 0;
      } else {
        // Apply part of the coupon 
        totalP -= couponDiscount;
      }
    }

    // Apply wallet balance second
    if (walletDiscount > 0) {
      if (totalP <= walletDiscount) {
        // Wallet is larger than or equal to remaining totalPrice, apply remaining wallet balance
        user.walletBalance += (walletDiscount - totalP); // Return unused wallet balance
        cart.walletBalance = totalP ; // Only use what’s left
        totalP = 0;
      } else {
        // Apply part of the wallet balance
        totalP -= walletDiscount;
      }
    }

    let totalAmount = totalP ; // Final total after coupon and wallet discounts

    // Save the updated balances
    await user.save();
    await cart.save(); 
       
    return res.render("../views/cart.ejs" , { logo , user , cart , totalItems , totalAmount , couponDiscount, totalPrice , totalAmount , genderCategory ,cartTotal }) ; 
  }
  else{
    
    return res.render("../views/cart.ejs" , { logo, user, genderCategory , cart : false , cartTotal}) ; 

  }
}



//get catageorysection  
const categorySection = async ( req , res ) =>{

  const categoryId = req.params.id ; 

  try {
      const productCategories = await productCategory.find({ genderCategory : categoryId , softDelete : false }); 

      const producatAndSubCat =  await Promise.all(productCategories.map( async (productCategory)=>{
          const subCategories = await productSubCategory.find({productCategory : productCategory._id , softDelete : false }) ; 
          return { productCategory , subCategories } ; 
      } )) 

      res.render("partials/productCategory", { producatAndSubCat  });
  } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).send("Server error");
  }
}

 
//get product page
const product = async (req,res) =>{
  try {
    const productId = req.params.id; // assuming product ID is passed as a URL parameter
    const sizeId = req.query.id; // size ID passed as a query parameter

  
    
    const product = await Product.findById(productId)
    .populate('genderCategory')
    .populate('productCategory')
    .populate('productSubCategory')
    .populate({
      path: 'reviews',
      populate: {
        path: 'user', // Populate the 'user' reference inside 'reviews'
        select: 'firstName email' // Optional: select specific fields from the User model
      }
    });
    
 

      // Convert sizeId to ObjectId
      const selectedSizeId = sizeId  || product.sizes[0]._id ;

    // Find the object in the sizes array with the specific _id
    const selectedObject = product.sizes.find(item => item._id.equals(selectedSizeId)) 


    const logo = await Logo.findOne().sort({ updatedAt: -1 }); 

    let userId;
    if(req.user && req.user.id){
      userId = req.user.id;
    }else if(req.session.userId){
      userId = req.session.userId;
    }else{
      userId = null;
    }

    const user = await User.findById( userId ) ; // assuming user is authenticated and stored in session

    let cartTotal ; 
     if(user){
     const cart = await Cart.findOne({user : user._id});
     if(cart){
      cartTotal = cart.items.reduce((total, item) => total + item.quantity, 0); 
     } 
     }else{
     cartTotal = 0;
     }
 
    const genderCategory = await GenderCategory.find({softDelete : false});
  

    if (!product) {
      return res.status(404).render('404'); // Render a 404 page if the product is not found
    }

    res.render('product-page', {
      logo,
      user,
      product,
      genderCategory,
      selectedObject,
      cartTotal,
      selectedSizeId
      
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
}



//get profile page
const showProfile = async ( req , res ) => { 
  const logo = await Logo.findOne().sort({ updatedAt: -1 });
  const genderCategory = await GenderCategory.find({ softDelete : false }) ; 
  const user = await User.findById( req.session.userId  ||  req.user  ); // assuming user is authenticated and stored in session

  let cartTotal ; 
     if(user){
     const cart = await Cart.findOne({user : user._id});
     if(cart){
      cartTotal = cart.items.reduce((total, item) => total + item.quantity, 0 ); 
     }
     }else{
     cartTotal = 0;
     }

  res.render("userProfile" , {logo,genderCategory,user , cartTotal});
} 



//post profile page
const editProfilePost = async ( req , res ) => {
  try{
  let { firstName , lastName , mobile , gender , email } = req.body ;
  firstName =firstName.trim();
  lastName =  lastName.trim();
  mobile =  mobile.trim();  
  
  const user = await User.findOne( { email } ) ;  

  user.firstName = firstName;
  user.lastName  = lastName; 
  user.mobile    = mobile;
  user.gender    = gender;
   
  await user.save();
  res.redirect("/userProfile");
 
  }catch(err){
    console.log(err);
  }
}



//get user address management
  const userAdressMng = async ( req,res ) =>{
  const logo = await Logo.findOne().sort({ updatedAt: -1 }); 
  const genderCategory = await GenderCategory.find({ softDelete : false }) ; 
  const user = await User.findById( req.session.userId  ||  req.user  ); // assuming user is authenticated and stored in session 

  let cartTotal ; 
  if(user){
  const cart = await Cart.findOne({user : user._id});
  if(cart){
    cartTotal = cart.items.reduce((total, item) => total + item.quantity, 0); 
   }
  }else{
  cartTotal = 0;
  }

  const addresses = await Address.find({userId : user , softDelete : false }) ;
  res.render("userAdressManage.ejs" , { logo , genderCategory ,user, addresses , cartTotal } ) ;
}


//post user address management
const saveAddress = async ( req,res ) =>{
    let { userId , name , phone , alternatephone , address , landmark , city , state , pincode , addresstype , checkout } = req.body ; 
    name = name.trim();
    phone = phone.trim();
    alternatephone = alternatephone.trim();
    address = address.trim();
    landmark = landmark.trim();
    city = city.trim();
    state = state.trim();
    pincode = pincode.trim();

  try{
  const addresses = new Address({
    userId : userId,
    name : name,
    phone : phone,
    alternatePhone : alternatephone ,
    address : address, 
    landmark : landmark,
    city : city,
    state : state,
    pincode : pincode , 
    addresstype : addresstype,
  })

  await addresses.save();
  console.log(checkout)
  if(checkout==1){
    return res.redirect( "/userAdressMang" ) ; 
  }else{
    return res.redirect( "/checkout" ) ; 
  }


 }catch(err){
  console.log(err.message);
 }

}


//get delete addresses  
const deleteAddress = async ( req,res ) =>{
  await Address.findByIdAndUpdate(req.params.id, { softDelete: true });
  if(req.query.checkout){
    return res.redirect("/checkout");
  }else{
    return res.redirect( "/userAdressMang" ) ;
  }
}



//post edit addresses
const editAddress = async ( req,res ) =>{
  try{
  //const addresse = await Address.findById(req.params.id);

  let { userId,name,phone,alternatephone,address,landmark,city,state,pincode,addresstype } = req.body ; 
  name = name.trim();
  phone = phone.trim();
  alternatephone = alternatephone.trim();
  address = address.trim();
  landmark = landmark.trim();
  city = city.trim();
  state = state.trim(); 
  pincode = pincode.trim();

  await Address.findByIdAndUpdate( req.params.id ,{
    name , 
    phone ,
    alternatePhone : alternatephone ,
    address ,
    landmark ,
    city ,
    state ,
    pincode ,
    addresstype ,
  });


  if( checkout == 1 ){
    return res.redirect('/checkout') ;
  }else{
    return res.redirect('/userAdressMang') ;
  }


  }catch(err){
    console.log(err);
  }
  
}


//get products page  -->by subcategory wise 
const products = async (req , res) =>{


  const subcategoryId = req.query.subcategoryId;  
  const logo = await Logo.findOne().sort({ updatedAt: -1 });
  const genderCategory = await GenderCategory.find({ softDelete : false });
  
  const user = await User.findById(req.session.userId || req.user); // assuming user is authenticated and stored in session

  // Calculate cart total
  let cartTotal = 0; 
  if (user) {
     const cart = await Cart.findOne({ user: user._id });
     if (cart) {
        cartTotal = cart.items.reduce((total, item) => total + item.quantity, 0);
     }
  }

  // Extract sorting and filter query params
  const result = req.query.result ;
  const price = req.query.price ;
  const status = req.query.status ;
  const sort = req.query.namesort ;
  const category = req.query.category ; 

  // Build query conditions dynamically
  let query = { softDelete: false }; // Base condition to filter non-deleted products

  // Filter by subcategory if present
  if (subcategoryId) {
     query.productSubCategory = { $in: [subcategoryId] };
  }

  // Filter by search result (title) if present
  if (result) {
     query.title = { $regex: result, $options: 'i' };
    // delete query.productSubCategory ;
    delete query["productSubCategory"] ;
  }

  // Filter by status if present
  if (status) {
     query.status = status; // Assuming your product model has a status field
  }


  //category
  if(category){
    query.genderCategory = category ; 
  }


  // Sorting logic
  let sortOption = {};
  if (price === 'low-to-high') {
     sortOption = { 'sizes.0.discountedPrice': 1 }; // Sort by price ascending
  } else if (price === 'high-to-low') {
     sortOption = { 'sizes.0.discountedPrice': -1 }; // Sort by price descending
  }

  if (sort === 'a-z') {
     sortOption = { title: 1 }; // Sort by name ascending
  } else if (sort === 'z-a') {
     sortOption = { title: -1 }; // Sort by name descending
  }

  // Find products based on the query and sort options
  const products = await Product.find(query).sort(sortOption);

  // Render the products page with the filtered and sorted data
  res.render("productsPage", { logo, genderCategory, user, products, cartTotal });


}








module.exports = { blocked , wishlist , cart , categorySection, product , showProfile , editProfilePost , userAdressMng ,saveAddress , deleteAddress 
  ,editAddress ,products }  