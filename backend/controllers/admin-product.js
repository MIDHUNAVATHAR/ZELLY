
const fs = require('fs');
const path = require('path');
const multer = require("multer") ;  

 const uploadProduct = multer({
    storage :  multer.diskStorage ({  
        destination : "uploads/product",   
        filename    : (req , file , cb ) =>{ 
            cb(null , Date.now() + file.originalname)   
        }
     })
 }).array( 'productImages' , 10 ) ;     


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
const Orders = require("../../models/orderSchema");
const { search } = require('../../routes/user-routes');


//get add product
const addProduct = async (req,res) =>{  

    const genderCategories = await GenderCategory.find();
    const productCategories = await ProductCategory.find().populate('genderCategory');
    const productSubCategories = await productSubCategory.find().populate('genderCategory').populate('productCategory') ; 

    res.render("admin-dashboard.ejs" ,{ message : '', admin : req.session.adminEmail , partial : "partials/add-product" , genderCategories , productCategories , productSubCategories }) ;  
}


//post add product
const addProductPost = async (req, res) => {
    uploadProduct(req, res, async function (err) {
        if (err) {
            return res.status(400).json({ error: 'Error uploading files: ' + err.message }) ; 
        }
        
        try {
           
             const {
                 title, titleDescription, productDescription, highlights, details,
                 genderCategory, productCategory, productSubCategory , size , quantity , price , discountedPrice , discountedPercentage 
             } = req.body ;
              

            const sizes = [] ;
            for(let i = 0 ; i < size.length ; i++){
                const productObject = { 
                    size : size[i],
                    price : parseFloat(price[i]), 
                    quantity : parseInt(quantity[i]),
                    discountedPrice : parseFloat(discountedPrice[i]),
                    discountedPercentage : parseFloat(discountedPercentage[i])
                }
                sizes.push( productObject );
            }

            let imageUrls = [];
            if (req.files && req.files.length > 0) {
                imageUrls = req.files.map(file => `/uploads/product/${file.filename}`) ; 
            }
 
            
             const product = new Product({
                 title ,
                 titleDescription ,
                 sizes ,
                 productDescription ,
                 highlights ,
                 details ,
                 genderCategory ,
                 productCategory ,
                 productSubCategory ,
                 images: imageUrls ,
                 sizes ,
             });
             
            
            await product.save().then( savedproduct => console.log( savedproduct )).catch( error => console.log(error) );
            
            res.status(200).json({ message: 'Product added successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error saving product: ' + error.message });
        }
    });
};

//get product list page
const listProducts  = async ( req , res ) =>{ 
    if(!req.session.adminId){
        return res.redirect("/admin");
    }
    
    try{

    const page = parseInt(req.query.page) || 1 ;
    const limit = 8 ; 
    const searchKeyword = req.query.search || "" ;

    const searchQuery = { title : { $regex : searchKeyword , $options : "i" } } ; 
    
    const totalProducts = await Product.countDocuments(searchQuery) ;
    const skip = ( page-1 ) * limit ; 
    
    const products = await Product.find(searchQuery).skip(skip).limit(limit) ; 
    const totalPages = Math.ceil( totalProducts/limit ) ;  

    res.render("admin-dashboard.ejs" ,{message : '', admin : req.session.adminEmail , partial : "partials/product-list" , products , totalPages , currentPage : page , searchKeyword }) ;

    }catch(err){
        console.log(err) ; 
    }
      
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


//post edit product
const editProductPost = async ( req , res ) => {  
    try {
        const { id } = req.params ; 
        const product = await Product.findById(id); 
    
        if (!product) {
            return res.status(404).json( { error : 'Product not found' } ) ;
        } 
          

        const {
            title, titleDescription, productDescription, highlights, details,
            genderCategory, productCategory, productSubCategory , size , quantity , price , discountedPrice , discountedPercentage 
        } = req.body ;
         

       const sizes = [] ;
       for(let i = 0 ; i < size.length ; i++){
           const productObject = {
               size : size[i],
               price : parseFloat(price[i]),
               quantity : parseInt(quantity[i]),
               discountedPrice : parseFloat(discountedPrice[i]),
               discountedPercentage : parseFloat(discountedPercentage[i])
           }
           sizes.push( productObject );
       }

        let newImageUrls = [];
       if (req.files && req.files.length > 0) {
           newImageUrls = req.files.map(file => `/uploads/product/${file.filename}` ) ; 
       }



      // Append the new images to the existing image array without overwriting the old images
      const allImageUrls = [...product.images, ...newImageUrls];

      // Update the product fields with the new data, keeping existing ones where no new data is provided
      product.title = title || product.title;
      product.titleDescription = titleDescription || product.titleDescription;
      product.productDescription = productDescription || product.productDescription;
      product.highlights = highlights || product.highlights;
      product.details = details || product.details;
      product.genderCategory = genderCategory || product.genderCategory;
      product.productCategory = productCategory || product.productCategory;
      product.productSubCategory = productSubCategory || product.productSubCategory;
      product.sizes = sizes.length > 0 ? sizes : product.sizes;  // Update sizes if provided
      product.images = allImageUrls;  // Merge new images with the existing ones

      // Save the updated product
      await product.save();

      res.status(200).json({ message: 'Product updated successfully' });
      
       
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
}



// delete size
const deleteSize =async (req,res)=>{
    try {
      const { productid , sizeid } = req.params;  // Get the ID from the URL
      await Product.updateOne({ _id : productid  } , { $pull: { sizes: { _id: sizeid } } } );   //find product and delete the size based on the size id
      res.status(200).json({ message: 'Size deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting size', error }) ;
    }
  }
 

//delete image
const deleteProductImage = async(req,res) =>{
    try{
    const { imgSrc , productId } = req.body ;
    const filePath = path.join(__dirname,"../","../", imgSrc);
    
    if (fs.existsSync(filePath)) {
        fs.unlink(filePath, async (err) => {
            if (err) {
                console.error('Error deleting file:', err);
                return res.status(500).json({ success: false, message: 'Failed to delete the image file' });
            }

            // After file deletion, remove the image path from the MongoDB product document
            try {
                const updatedProduct = await Product.findByIdAndUpdate(
                    productId,
                    { $pull: { images: imgSrc } },  // Remove the image path from the `images` array
                    { new: true }  // Return the updated product document
                );

                if (!updatedProduct) {
                    return res.status(404).json({ success: false, message: 'Product not found' });
                }

                res.json({ success: true, message: 'Image deleted from server and database', product: updatedProduct }) ;
            } catch (mongoError) {
                console.error('Error updating product:', mongoError);
                res.status(500).json({ success: false, message: 'Failed to update product in database' });
            }
        });
    }else{
        res.status(404).json({ success : false, message: 'File not found on the server' });
    }

    }catch(err){
        console.error( "Error : " , err ) ; 
        res.status(500).json({ success: false, message: 'Server error' });
    }

}


//block product
const blockProduct = async (req,res) =>{
    const { productId } = req.body ; 
    const product = await Product.findById(productId) ;
   //  console.log(req.body)

        // Toggle the `softDelete` field
    product.softDelete = !product.softDelete ; 

    await product.save();
    res.status(404).json({ status : true });    
}


//delete product 
const deleteproduct = async ( req , res ) => {
    try {
        const productId = req.body.id
    
        // Find the product in the database
        const product = await Product.findById(productId);
        if (!product) {
          return res.status(404).json({ message: 'Product not found' });
        }
    
        // Delete product images from server
        product.images.forEach((imagePath) => {
          const fullPath = path.join(__dirname, '../..', imagePath);
          console.log(fullPath)
          fs.unlink(fullPath, (err) => {
            if (err) {
              console.error(`Error deleting image: ${fullPath}`, err);
            }
          });
        });
    
        // Delete product from the database
        await Product.findByIdAndDelete(productId);
    
        // Respond to client
        res.status(200).json({ success : true ,message: 'Product and images deleted successfully' });
      } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Server error' });
      }
}




 //get orders 
 const orders = async (req,res) =>{ 
    try{
        if(!req.session.adminId){ 
            return res.redirect("/admin");
        }
        
        const orders = await Orders.find({}).populate("userId") ; 
        console.log(orders)

        res.render("admin-dashboard.ejs" ,{message : '',admin : req.session.adminEmail , partial : "partials/orders" , orders } ) ; 


    }catch(err){
        console.log(err);
    }
 }

 
 //get view order
 const viewOrder = async ( req , res ) =>{
    try{
        if(!req.session.adminId){
            res.redirect("/admin");
        } 
        
        const order = await Orders.findById(req.params.orderId).populate("items.product").populate("shippingAddress") ;
        // Format order date
        const orderDate = new Date(order.createdAt).toLocaleString();
        res.render("admin-dashboard.ejs" ,{message : '',admin : req.session.adminEmail , partial : "partials/viewOrder" , order ,orderDate } ) ; 
        
    }catch(err){
        console.error(err);
    }  
 }



 //post update order status
 const updateOrderStatus = async (req,res) =>{
    const { orderStatus , orderId } = req.body;
    try{
    const status = await Orders.findByIdAndUpdate( orderId , { orderStatus  });
    if(status){
        res.status(200).json({success : true })
    }else{
        res.status(404).json({message : "order not found" })
    }
    }catch(err){
        res.status(500).json({ message: "Internal server error" });
    }
 }

 
 //post update payment status
 const updatePaymentStatus = async (req,res) =>{
    const { paymentStatus , orderId } = req.body ; 
    try{
        const status = await Orders.findByIdAndUpdate( orderId , { paymentStatus  });
        if(status){
            res.status(200).json({success : true })
        }else{
            res.status(404).json({message : "order not found" })
        }
    }catch(err){
            res.status(500).json({ message: "Internal server error" });
    }
 }



module.exports = { addProduct , addProductPost , listProducts , editProduct  , deleteSize , editProductPost  , deleteProductImage , 
    blockProduct , deleteproduct , orders , viewOrder , updateOrderStatus , updatePaymentStatus } ; 