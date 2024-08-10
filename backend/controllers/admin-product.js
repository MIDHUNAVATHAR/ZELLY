

const multer = require("multer") ;  

 const uploadProduct = multer({
    storage :  multer.diskStorage ({  
        destination : "uploads/product",   
        filename    : (req , file , cb ) =>{ 
            cb(null , Date.now() + file.originalname)   
        }
     })
 }).array("productImages", 3);    


//import schemas
const User = require("../../models/userSchema");
const GenderCategory = require("../../models/genderCategory");
const ProductCategory = require("../../models/productCategory"); 
const ProductSubCategory = require("../../models/productSubCategory");
const Logo = require("../../models/logoSchema");  
const Banner = require("../../models/bannerSchema");
const Product = require("../../models/product"); 
const genderCategory = require("../../models/genderCategory");
const productSubCategory = require("../../models/productSubCategory");


//get add product
const addProduct = async (req,res) =>{

    genderCategories = await GenderCategory.find();
    productCategories = await ProductCategory.find().populate('genderCategory');
    productSubCategories = await productSubCategory.find().populate('genderCategory').populate('productCategory');

    res.render("admin-dashboard.ejs" ,{message : '',admin : req.session.adminEmail , partial : "partials/add-product" , genderCategories , productCategories , productSubCategories}) ;  
}

//post add product
const addProductPost = async (req, res) => {
    uploadProduct(req, res, async function (err) {
        if (err) {
            // Handle multer errors
            return res.status(400).send('Error uploading files: ' + err.message);
        }
        
        try {
            const { 
                title, titleDescription, price, discountedPrice, discountedPercentage, 
                sizes, productDescription, highlights, details, 
                genderCategory, productCategory, productSubCategory 
            } = req.body;

            // Handle sizes (assuming it's coming as a comma-separated string)
            const sizeArray = sizes.split(',').map(size => size.trim());

            // Handle images
            const imageUrls = req.files.map(file => `/uploads/product/${file.filename}`);

            const product = new Product({
                title,
                titleDescription,
                price,
                discountedPrice,
                discountedPercentage,
                sizes: sizeArray,
                productDescription,
                highlights,
                details,
                genderCategory,
                productCategory,
                productSubCategory,
                images: imageUrls 
            });

            await product.save();
            res.redirect("/admin/addProduct");
        } catch (error) {
            console.error(error);
            res.status(500).send('Error saving product: ' + error.message);
        }
    });
};

 

module.exports = {addProduct ,addProductPost }