

//import schemas
const User = require("../../models/userSchema");
const Logo = require("../../models/logoSchema");
const GenderCategory = require("../../models/genderCategory");
const Product = require("../../models/product");

//get blocked page
const blocked = (req,res) =>{
  res.render("../views/blocked-page.ejs");
}
 
//get wishlist
const wishlist = async ( req , res ) =>{
   const logo = await Logo.findOne().sort({ updatedAt: -1 });
   const genderCategory = await GenderCategory.find({softDelete : false});
   const user = await User.findById(req.session.userId) || req.user 
   res.render("../views/wish-list.ejs" ,{logo, genderCategory , user , wishlist : [] , breadcrumbs: [
    { label: 'Men', url: '/' }, 
    { label: 'Clothing', url: '/men/clothing' },
    { label: 'Basic-Tee', url: null }
  ] });
}

//get cart
const cart = async ( req,res ) =>{
    const logo = await Logo.findOne().sort({ updatedAt: -1 });
    const genderCategory = await GenderCategory.find({softDelete : false}); 
    const user = await User.findById(req.session.userId) || req.user 
    res.render("../views/cart.ejs" , {logo, user, cartItems :[] ,cartTotal :2 , genderCategory })
}

//get catageorysection  
const categorySection = async ( req , res ) =>{
  const categoryId = req.params.id;

  try {
      // Fetch products with the specified gender category ID, and populate the related category and subcategory data
      const products = await Product.find({ genderCategory: categoryId })
          .populate("productCategory")
          .populate("productSubCategory"); 
      // Group subcategories by their parent categories
      const categories = {};
      products.forEach(product => { 
          const categoryName = product.productCategory.name ; 
          if (!categories[categoryName]) {
              categories[categoryName] = new Set();
          }
          product.productSubCategory.forEach(subcategory => {
              categories[categoryName].add(subcategory.name) ;  
          });
      });
      // Convert sets to arrays for easier use in EJS
      Object.keys(categories).forEach(category => {
          categories[category] = Array.from(categories[category]); 
      });
       
      res.render("partials/productCategory", { categories });
  } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).send("Server error");
  }
}

 
//get product page
const product = async (req,res) =>{
  try {
    const productId = req.params.id; // assuming product ID is passed as a URL parameter
    const logo = await Logo.findOne().sort({ updatedAt: -1 }); 
    const user = await User.findById(req.session.userId); // assuming user is authenticated and stored in session
    const genderCategory = await GenderCategory.find({softDelete : false});
    const product = await Product.findById(productId)
      .populate('genderCategory')
      .populate('productCategory')
      .populate('productSubCategory');

    if (!product) {
      return res.status(404).render('404'); // Render a 404 page if the product is not found
    }

    res.render('product-page', {
      logo,
      user,
      product,
      genderCategory,
      
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
 
}

module.exports = {blocked , wishlist , cart , categorySection, product } 