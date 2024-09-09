
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

//get blocked page
const blocked = (req,res) =>{
  res.render("../views/blocked-page.ejs");
}
 
//get wishlist
const wishlist = async ( req , res ) =>{
   const logo = await Logo.findOne().sort({ updatedAt: -1 });
   const genderCategory = await GenderCategory.find({softDelete : false});
   const user = await User.findById(req.session.userId) || req.user ;
   res.render("../views/wish-list.ejs" ,{logo, genderCategory , user , wishlist : [] , breadcrumbs: [
    { label: 'Men', url: '/' }, 
    { label: 'Clothing', url: '/men/clothing' },
    { label: 'Basic-Tee', url: null }
  ] });
}

//get cart
const cart = async ( req,res ) =>{
    const logo = await Logo.findOne().sort({ updatedAt: -1 });
    const genderCategory = await GenderCategory.find({ softDelete : false}); 
    const user = await User.findById(req.session.userId) || req.user  ;       // req.user is user object
    const cart = await Cart.findOne({ user }).populate('items.product');
   // console.log(cart.items[0].product.images);
   if(cart){
    const totalItems = cart.items.length ; 
    let totalPrice = 0;  
    const discount = 0;   //default  -->  pass coupon code as query and 

    for(let i=0 ; i< cart.items.length ; i++){
        for(let m =0 ; m < cart.items[i].quantity ; m++ ){
            totalPrice += cart.items[i].discountedPrice ;
        }
    }

    let totalAmount = totalPrice - discount ; 
       
    return res.render("../views/cart.ejs" , { logo, user, cart, totalItems , discount, totalPrice , totalAmount , genderCategory }) ; 
  }
  else{
    
    return res.render("../views/cart.ejs" , { logo, user, genderCategory , cart : false}) ; 

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

      res.render("partials/productCategory", { producatAndSubCat });
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

    // Convert sizeId to ObjectId
    const selectedSizeId = sizeId ; 

    const product = await Product.findById(productId)
    .populate('genderCategory')
    .populate('productCategory')
    .populate('productSubCategory');
 

    // Find the object in the sizes array with the specific _id
    const selectedObject = product.sizes.find(item => item._id.equals(selectedSizeId)) || product.sizes[0];


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
 
    const genderCategory = await GenderCategory.find({softDelete : false});
  

    if (!product) {
      return res.status(404).render('404'); // Render a 404 page if the product is not found
    }

    res.render('product-page', {
      logo,
      user,
      product,
      genderCategory,
      selectedObject
      
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

  res.render("userProfile" , {logo,genderCategory,user});
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
  const addresses = await Address.find({userId : user}) ;
  res.render("userAdressManage.ejs" , { logo , genderCategory ,user, addresses } ) ;
}

//post user address management
const saveAddress = async ( req,res ) =>{
    let { userId,name,phone,alternatephone,address,landmark,city,state,pincode,addresstype } = req.body ; 
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
    alternatePhone : alternatephone,
    address : address,
    landmark : landmark,
    city : city,
    state : state,
    pincode : pincode , 
    addresstype : addresstype,
  })

  await addresses.save();

  return res.redirect( "/userAdressMang" ) ;

 }catch(err){
  console.log(err.message);
 }

}

//get delete addresses  
const deleteAddress = async ( req,res ) =>{
  await Address.findByIdAndDelete(req.params.id);
  return res.redirect( "/userAdressMang" ) ;
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
    name,
    phone,
    alternatePhone : alternatephone,
    address,
    landmark,
    city,
    state,
    pincode,
    addresstype,

  });

  return res.redirect('/userAdressMang');

  }catch(err){
    console.log(err.message);
  }
  
}


//get products page  -->by subcategory wise 
const products = async (req , res) =>{
   const subcategoryId = req.query.subcategoryId ; 
   const result = req.query.result ; 

   const logo = await Logo.findOne().sort({ updatedAt: -1 }); 
   const genderCategory = await GenderCategory.find({ softDelete : false }); 
   const user = await User.findById( req.session.userId  ||  req.user  ); // assuming user is authenticated and stored in session 

   let products;
   
   if(subcategoryId){
     products = await Product.find({ productSubCategory : { $in: [subcategoryId] }  }) ; 
   }else{
     products = await Product.find() ; 
   }
   console.log(products)
   res.render("productsPage" , { logo , genderCategory , user , products }) ; 
}


module.exports = { blocked , wishlist , cart , categorySection, product , showProfile , editProfilePost , userAdressMng ,saveAddress , deleteAddress 
  ,editAddress ,products }  