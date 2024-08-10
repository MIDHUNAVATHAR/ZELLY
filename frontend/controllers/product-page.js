

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
   const logo = await Logo.findOne().sort({ createdAt: -1 });
   const genderCategory = await GenderCategory.find();
   const user = await User.findById(req.session.userId) || req.user 
   res.render("../views/wish-list.ejs" ,{logo, genderCategory , user , wishlist : [] , breadcrumbs: [
    { label: 'Men', url: '/' }, 
    { label: 'Clothing', url: '/men/clothing' },
    { label: 'Basic-Tee', url: null }
  ] });
}

//get cart
const cart = async ( req,res ) =>{
    const logo = await Logo.findOne().sort({ createdAt: -1 });
    const genderCategory = await GenderCategory.find();
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
  const logo = await Logo.findOne().sort({ createdAt: -1 });
  const user = await User.find();
  res.render("../views/product-page.ejs" , {product :"" ,logo , genderCategory :[] ,user})
}

module.exports = {blocked , wishlist , cart , categorySection, product } 