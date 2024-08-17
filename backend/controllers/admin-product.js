

const multer = require("multer") ;  

 const uploadProduct = multer({
    storage :  multer.diskStorage ({  
        destination : "uploads/product",   
        filename    : (req , file , cb ) =>{ 
            cb(null , Date.now() + file.originalname)   
        }
     })
 }).array('productImages', 10);     


//import schemas
const User = require("../../models/userSchema");
const GenderCategory = require("../../models/genderCategory");
const ProductCategory = require("../../models/productCategory"); 
const ProductSubCategory = require("../../models/productSubCategory") ; 
const Logo = require("../../models/logoSchema");  
const Banner = require("../../models/bannerSchema");
const Product = require("../../models/product"); 
const genderCategory = require("../../models/genderCategory");
const productSubCategory = require("../../models/productSubCategory");


//get add product
const addProduct = async (req,res) =>{

    const genderCategories = await GenderCategory.find();
    const productCategories = await ProductCategory.find().populate('genderCategory');
    const productSubCategories = await productSubCategory.find().populate('genderCategory').populate('productCategory') ; 

    res.render("admin-dashboard.ejs" ,{message : '',admin : req.session.adminEmail , partial : "partials/add-product" , genderCategories , productCategories , productSubCategories}) ;  
}

//post add product
const addProductPost = async (req, res) => {
    uploadProduct(req, res, async function (err) {
        if (err) {
            return res.status(400).json({ error: 'Error uploading files: ' + err.message }) ; 
        }
        
        try {
            const {
                title, titleDescription, price, discountedPrice, discountPercentage,
                sizes, productDescription, highlights, details,
                genderCategory, productCategory, productSubCategory,totalStocks
            } = req.body;

            const sizeArray = sizes.split(',').map(size => size.trim());

            let imageUrls = [];
            if (req.files && req.files.length > 0) {
                imageUrls = req.files.map(file => `/uploads/product/${file.filename}`); 
            }

            const product = new Product({
                title,
                titleDescription,
                price: Number(price),
                discountedPrice: Number(discountedPrice),
                discountedPercentage: Number(discountPercentage),
                sizes: sizeArray,
                productDescription,
                highlights,
                details,
                genderCategory,
                productCategory,
                productSubCategory,
                images: imageUrls,
                totalStocks
            });

            await product.save();
            res.status(200).json({ message: 'Product added successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error saving product: ' + error.message });
        }
    });
};

//get product list page
const listProducts  = async (req,res) =>{ 
    const products = await Product.find({ }).populate( "genderCategory").populate("productCategory").populate("productSubCategory");  
    res.render("admin-dashboard.ejs" ,{message : '',admin : req.session.adminEmail , partial : "partials/product-list", products }) ;  
}

//get edit product page
const editProduct = async (req,res) =>{
    const productId = req.params.id;
    const product = await Product.findById(productId);
    const genderCategories = await GenderCategory.find();
    const productCategories = await ProductCategory.find().populate('genderCategory'); 
    const productSubCategories = await productSubCategory.find().populate('genderCategory').populate('productCategory');
     
    res.render("admin-dashboard.ejs" ,{message : '',admin : req.session.adminEmail , partial : "partials/edit-product" , genderCategories , productCategories , productSubCategories , product}) ; 
}

//delete product images
const deleteproduct = async ( req , res ) =>{
    
}



//post edit product
const editProductPost = async ( req,res ) =>{  
    try {
        const { id } = req.params ; 
        const product = await Product.findById(id); 
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Update product fields  
        let { title } = req.body;
      
        // product.title = req.body.title;
        // product.titleDescription = req.body.titleDescription;
        // product.price = req.body.price;
        // product.discountedPrice = req.body.discountedPrice;
        // product.discountedPercentage = req.body.discountPercentage;
        // product.sizes = req.body.sizes;
        // product.totalStocks = req.body.totalStocks;
        // product.productDescription = req.body.productDescription;
        // product.highlights = req.body.highlights;
        // product.details = req.body.details;
        // product.genderCategory = req.body.genderCategory;
        // product.productCategory = req.body.productCategory;
        // product.productSubCategory = req.body.productSubCategory;


        //await product.save();

        res.json({ message: 'Product updated successfully' });

       
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
}
  

module.exports = { addProduct , addProductPost , listProducts , editProduct ,deleteproduct , editProductPost} ; 