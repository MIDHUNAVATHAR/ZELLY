
const fs = require("fs");
const path = require('path');
const multer = require("multer") ;  
const moment = require('moment');


const uploadLogo = multer({
    storage :  multer.diskStorage ({ 
        destination : "uploads/logo",   
        filename    : (req , file , cb ) =>{ 
            cb(null , Date.now() + file.originalname)   
        }
     })
 }).single("logo");  



const uploadBanner = multer({
    storage :  multer.diskStorage ({ 
        destination : "uploads/banner",    
        filename    : (req , file , cb ) =>{ 
            cb(null , Date.now() + file.originalname ) ;   
        }
     })
 }).single("banner") ; 



//import schemas
const User = require("../../models/userSchema");
const GenderCategory = require("../../models/genderCategory");
const ProductCategory = require("../../models/productCategory"); 
const ProductSubCategory = require("../../models/productSubCategory");
const Logo = require("../../models/logoSchema");  
const Banner = require("../../models/bannerSchema");
const Product = require("../../models/product"); 
const  Order = require("../../models/orderSchema") ;





// Helper function to ensure the directory exists
const ensureDirectoryExistence = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true }); // Create the directory if it doesn't exist
    }
};



// Helper function to get date range
const getDateRange = (filter) => {
    const end = moment().endOf('day');
    let start;
    
    switch(filter) {
        case 'day':
            start = moment().startOf('day');
            break;
        case 'week':
            start = moment().subtract(7, 'days').startOf('day');
            break;
        case 'month':
            start = moment().subtract(30, 'days').startOf('day');
            break;
        case 'year':
            start = moment().subtract(365, 'days').startOf('day');
            break;
        default:
            start = moment().subtract(30, 'days').startOf('day');
    }
    
    return { start, end };
};





// render the admin dashboard
const dashboard = async ( req , res ) => { 
 
    try {
        const filter = req.query.filter || 'month';
        const { start, end } = getDateRange(filter);

        // Get orders within date range
        const orders = await Order.find({
            createdAt: { $gte: start.toDate(), $lte: end.toDate() },
            paymentStatus: 'completed'
        }).sort('createdAt');

        // Calculate daily sales data
        const salesData = [];
        let currentDate = moment(start);
        
        while (currentDate <= end) {
            const dayStart = moment(currentDate).startOf('day');
            const dayEnd = moment(currentDate).endOf('day');
            
            const dayOrders = orders.filter(order => 
                moment(order.createdAt).isBetween(dayStart, dayEnd)
            );
            
            const totalSales = dayOrders.reduce((sum, order) => sum + order.totalPrice, 0);
            
            salesData.push({
                x: currentDate.format('YYYY-MM-DD'),
                y: totalSales
            });
            
            currentDate.add(1, 'days');
        }

        // Calculate summary statistics
        const totalOrders = await Order.countDocuments({
            createdAt: { $gte: start.toDate(), $lte: end.toDate() }
        });
        
        const totalRevenue = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: start.toDate(), $lte: end.toDate() },
                    paymentStatus: 'completed'
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$totalPrice' }
                }
            }
        ]);

        const orderStatusCount = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: start.toDate(), $lte: end.toDate() } 
                }
            },
            {
                $group: {
                    _id: '$orderStatus',
                    count: { $sum: 1 }
                }
            }
        ]);


         // Fetch top 10 selling products
         const topProducts = await Order.aggregate([
            {
                $match: {
                    orderStatus: { $ne: 'cancelled' },
                    paymentStatus: 'completed'
                }
            },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    totalQuantity: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: '$items.totalPrice' },
                    orders: { $addToSet: '$_id' }
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails' },
            {
                $project: {
                    name: '$productDetails.title',
                    totalQuantity: 1,
                    totalRevenue: 1,
                    orderCount: { $size: '$orders' }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 }
        ]);

        


        // Fetch top 10 product categories with their gender category
        const topCategories = await Order.aggregate([
            
            {
                $match: {
                    orderStatus: { $ne: 'cancelled' },  // Only include non-cancelled orders
                    paymentStatus: 'completed'  // Only include completed payment orders
                }
            },
            { $unwind: '$items' },  // Unwind the items array to treat each item individually
            {
                $lookup: {
                    from: 'products',  // Lookup from the 'products' collection
                    localField: 'items.product',  // Match product ID from the order items
                    foreignField: '_id',  // Match the _id field in the 'products' collection
                    as: 'product'  // Alias the matched product details as 'product'
                }
            },
            { $unwind: '$product' },  // Unwind the product array to access individual product details
            {
                $group: {
                    _id: '$product.productCategory',  // Group by product category ID
                    totalQuantity: { $sum: '$items.quantity' },  // Sum the quantities for each category
                    totalRevenue: { $sum: '$items.totalPrice' },  // Sum the total price for each category
                    orders: { $addToSet: '$_id' },  // Collect unique order IDs
                    genderCategoryId: { $first: '$product.genderCategory' }  // Get the gender category ID from the product
                }
            },
            {
                $lookup: {
                    from: 'productcategories',  // Lookup from the 'categories' collection
                    localField: '_id',  // Match the product category ID
                    foreignField: '_id',  // Match with the _id field in the 'categories' collection
                    as: 'categoryDetails'  // Alias the matched category details as 'categoryDetails'
                }
            },
            { $unwind: '$categoryDetails' },  // Unwind to get the category name
            {
                $lookup: {
                    from: 'gendercategories',  // Lookup from the 'gendercategories' collection
                    localField: 'genderCategoryId',  // Match the gender category ID
                    foreignField: '_id',  // Match the _id field in the 'gendercategories' collection
                    as: 'genderCategoryDetails'  // Alias the matched gender category details as 'genderCategoryDetails'
                }
            },
            { $unwind: '$genderCategoryDetails' },  // Unwind to get the gender category details
            {
                $project: {
                    category: '$categoryDetails.name',  // Replace _id with the category name
                    genderCategory: '$genderCategoryDetails.name',  // Include the gender category name
                    totalQuantity: 1,  // Include total quantity in the result
                    totalRevenue: 1,  // Include total revenue in the result
                    orderCount: { $size: '$orders' }  // Calculate the number of unique orders
                }
            },
            { $sort: { totalQuantity: -1 } },  // Sort by total quantity in descending order
            { $limit: 10 }  // Limit the results to the top 10 categories
        ]);


 
        const topSubcategories = await Order.aggregate([
            {
                $match: {
                    orderStatus: { $ne: 'cancelled' },  // Only non-cancelled orders
                    paymentStatus: 'completed'          // Only completed payments
                }
            },
            { $unwind: '$items' },  // Unwind items array in orders
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.product',   // Match product in items with product _id
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },  // Unwind the product array
            {
                $lookup: {
                    from: 'productsubcategories',  // Lookup from subcategories collection
                    localField: 'product.productSubCategory',  // Match subcategory ID from product (correct field name)
                    foreignField: '_id',
                    as: 'subcategoryDetails'
                }
            },
            { $unwind: '$subcategoryDetails' },  // Unwind subcategory details
            {
                $lookup: {
                    from: 'productcategories',  // Lookup to get parent category from productcategories collection
                    localField: 'subcategoryDetails.productCategory',  // Assuming category field is named `productCategory`
                    foreignField: '_id',
                    as: 'categoryDetails'
                }
            },
            { $unwind: '$categoryDetails' },  // Unwind category details
            {
                $group: {
                    _id: '$product.productSubCategory',  // Group by subcategory
                    subcategoryName: { $first: '$subcategoryDetails.name' },  // Get subcategory name
                    categoryName: { $first: '$categoryDetails.name' },  // Get parent category name
                    totalQuantity: { $sum: '$items.quantity' },  // Sum total quantities sold
                    totalRevenue: { $sum: '$items.totalPrice' },  // Sum total revenue
                    orders: { $addToSet: '$_id' }  // Collect order IDs
                }
            },
            {
                $project: {
                    subcategory: '$subcategoryName',  // Project subcategory name
                    parentCategory: '$categoryName',  // Project parent category name
                    totalQuantity: 1,
                    totalRevenue: 1,
                    orderCount: { $size: '$orders' }  // Count of unique orders
                }
            },
            { $sort: { totalQuantity: -1 } },  // Sort by total quantity in descending order
            { $limit: 10 }  // Limit to top 10
        ]);
        
      
        

        res.render('admin-dashboard', {
            admin : "" ,
            partial : "partials/dashboard" ,
            salesData: JSON.stringify(salesData),
            totalOrders,
            totalRevenue: totalRevenue[0]?.total || 0 ,  
            orderStatusCount,
            currentFilter: filter,
            topProducts,
            topCategories,
            topSubcategories
        });
    } catch (error) {
        console.error('Dashboard Error : ' , error ) ; 
        res.status(500).send('Error loading dashboard') ; 
    } 
} 




const generateLedger = async (req, res) => {
    try {
        const startDate = moment().startOf('year').toDate();
        const endDate = moment().endOf('year').toDate();

        // Fetch orders from the start of the year to the current date
        const orders = await Order.find({
            createdAt: { $gte: startDate, $lte: endDate },
            paymentStatus: 'completed'
        }).populate('items.product'); // Populate product details

        // Create the ledger
        let ledgerData = "Product Name , Quantity Sold , Total Revenue , Order Date\n";

        orders.forEach(order => {
            order.items.forEach(item => { 
                const orderDate = `"${moment(order.createdAt).format('YYYY-MM-DD')}"` ; 

                ledgerData += `${item.product.title},${item.quantity},${item.totalPrice},${orderDate}\n`;
            });
        });
     

        // Directory to store the ledger file
        const ledgerDir = path.join(__dirname, '../../public/ledger');
        
        // Ensure the directory exists
        ensureDirectoryExistence(ledgerDir);
 
        // Generate file path for the ledger file
        const filePath = path.join(ledgerDir, `ledger_${moment().format('YYYYMMDD_HHmmss')}.csv`);

        // Save the ledger data to the file
        fs.writeFileSync(filePath, ledgerData);

        // Provide a download link to the generated ledger
        res.download(filePath, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                res.status(500).send('Error generating ledger');
            }

            // Optionally, delete the ledger file after sending it to the user
            fs.unlinkSync(filePath);
        });

    } catch (error) {
        console.error('Ledger generation error:', error);
        res.status(500).send('Error generating ledger');
    }
};




 //get front page logo banner 
 const frontPage = async (req,res) =>{ 
    const logo = await Logo.find(); 
    const banner = await Banner.find();
    res.render("admin-dashboard" ,{admin: req.session.adminEmail , partial :"partials/front-page-img-add" ,logo , banner} ); 
 }



 //post front page logo
 const frontPageLogo = (req , res) =>{ 
    uploadLogo(req,res , (err) =>{
        if(err){
            console.log(err);
            return;
        }else{ 
            const logo = new Logo({ 
                image : {
                    data :  `/uploads/logo/${req.file.filename}`, 
                    contentType: req.file.mimetype, 
                } 
            })
            logo.save().then(()=> res.redirect("/admin/frontPage")  ).catch((err)=>console.log(err)) ;  
        }
    })
 }



 //post front page banner images
 const frontPageBanner = ( req , res ) =>{   
    uploadBanner(req , res ,(err)=>{   
        if(err){
            console.log(err);
            return;
        }else{
            const banner = new Banner({
                image :{
                    data : `/uploads/banner/${req.file.filename}`,
                    ContentType : req.file.mimetype,
                }
            })
            banner.save().then(()=> res.redirect("/admin/frontPage")).catch((err)=>console.log(err)); 
        }
    })  
 } 



 //delete logo and banner images
 const deleteImages = async(req,res)=>{
    const { type , id } = req.params;
    try{
        let model , uploadPath;
        if(type === "logo"){
            model = Logo;
            uploadPath = __dirname,"uploads/logo" ;
        }else if(type === "banner"){
            model = Banner;
            uploadPath = __dirname,"uploads/Banner"; 
        }else{
            return res.status(400).send("Invalid image type"); 
        }

        const image = await model.findById(id); 
        if(!image){
            return res.status(404).send("Image not found"); 
        }
        
        //Delete from upload folder 
        const filePath = path.join(__dirname ,`../..${image.image.data}`) ;   
        fs.unlink(filePath , (err)=>{
            if(err) console.error("Error deleting file : ", err) ; 
        } )
        //Delete from database   
        await model.findByIdAndDelete(id); 
        res.status(200).send("Image deleted Succesfully") ;  
    }catch(err){   
        console.error("Delete error : " , err);
        res.status(500).send( "server error" ) ; 
    }
 }



 //updat logo date ,
 const updatelogoDate =async  ( req, res ) =>{
     
    try{
        const { logoId } = req.body;
        if (!logoId) {
            return res.status(400).json({ success: false, message: 'Logo ID is required' });
        }
        await Logo.findByIdAndUpdate(logoId, { updatedAt: Date.now() });

        res.json({ success: true, message: 'Logo date updated successfully' }); 
       
    }catch(error){
        console.error('Error updating logo date:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
    
 }




 //updat Banner date ,
 const updateBannerDate = async  ( req, res ) =>{
     
    try{
        const { bannerId } = req.body ; 
        console.log(bannerId)
        if (!bannerId) {
            return res.status(400).json({ success : false, message: 'Banner ID is required' }) ; 
        }
        await Banner.findByIdAndUpdate(bannerId, { updatedAt: Date.now() });   

        res.json({ success: true, message: 'Banner date updated successfully' }) ; 
       
    }catch(error){
        console.error('Error updating banner date:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
    
 }



  
 //get customers
 const customers = async (req, res) =>{
     //pagination 
     const page = parseInt(req.query.page) || 1 ;   
     const limit = 7;
     const sort = req.query.sort || 'asc' ; 
     const sortOrder =  sort === 'asc' ? 1 : -1 ;
     const startIndex = (page - 1) *limit ;
     const endIndex   = page * limit ;
     
     const search = req.query.search || '' ; 
     const query = search 
     ? { 
         $or: [
             { firstName: { $regex: search, $options: 'i' } }, 
             { email: { $regex: search , $options: 'i' } }     
         ] 
     }
     : {};

     const users = await User.find(query).sort({ joinedDate: sortOrder })  
     const totalUsers =users.length; // Get the total number of users

     const resultUsers = users.slice( startIndex , endIndex );
     res.render("admin-dashboard.ejs" , {partial : "partials/cust" ,admin : req.session.adminEmail , users : resultUsers,currentpage :page,totalUsers:totalUsers,limit:limit,sort:sort});

 }




 //get delete customers
 const userDel = async ( req ,res ) =>{ 
    try{
        const deletId = req.query.id;
        await User.findByIdAndDelete(deletId);
        res.redirect("/admin/customers") ; 
    }catch(err){ 
        console.log(err.message) ; 
    }
}



//get edit user
const userEdit = async (req,res) =>{ 
    try{
      const userId =  req.query.id;
      const user = await User.findById(userId);
      res.render("admin-dashboard.ejs" ,{ partial : "partials/edit-user",user:user ,admin : req.session.adminEmail}); 
    }catch(err){
        console.log(err.message);
    }
}




//post user edit
const updateUsers = async (req,res) =>{
    try {
        let { userId, firstName, lastName, email, password } = req.body ; 
        firstName = firstName.trim();
        lastName  = lastName.trim();
        email     = email.trim(); 
        password  = password.trim();
        const updates = { firstName, lastName, email };
        if (password) {
            updates.password = password ;  
        }
        await User.findByIdAndUpdate(userId, updates);
        res.redirect('/admin/customers');
    } catch (err) {
        console.log(err);
        res.status(500).send('Error updating user');
    }
}




//post user status
const updateStatus = async (req,res) =>{
     const userId = req.params.id;
     const { status } = req.body;
     await User.findByIdAndUpdate(userId , { status } );
     res.redirect('/admin/customers');
}  



//get addcategory
const addCategory = async (req , res) =>{  
    const genderCategories = await GenderCategory.find();
    const productCategories = await ProductCategory.find().populate('genderCategory');
    const productSubCategories = await ProductSubCategory.find().populate('genderCategory').populate('productCategory');
    res.render("admin-dashboard.ejs" ,{ partial : "partials/add-category", admin : req.session.adminEmail , genderCategories , productCategories , productSubCategories}) ; 
}



//post addGenderCategory
const addGenderCategory = async (req,res) =>{ 
    
    let {name} = req.body;
    name = name.trim().toUpperCase();       
    await GenderCategory.create({name}); 
    res.redirect("/admin/addCategory") ;
} 



//post addproduct category
const addProductCategory = async (req,res) =>{
    let {name , genderCategory} = req.body ;  
    name = name.trim().toUpperCase(); 
    await ProductCategory.create({name , genderCategory});  
    res.redirect("/admin/addCategory");  
}



//post addproductsub category  
const addProductSubCategory = async (req,res) =>{
    let {name , genderCategory , productCategory } = req.body ; 
    name = name.trim().toUpperCase(); 
    await ProductSubCategory.create({name ,genderCategory , productCategory});
    res.redirect("/admin/addCategory");
} 



//post gendercategory soft delete true
const softDeleteGenderCat =  async(req,res) =>{
   try{
    const { genderId } = req.body; 
    await GenderCategory.findByIdAndUpdate(genderId , {softDelete : true});
    res.json({ success: true, message: 'Gender catgegory deleted successfully' }) ; 

   }catch(err){
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
   }
}



//post gendercategory soft delete false
const softDeleteGenderCate =  async(req,res) =>{
    try{
     const { genderId } = req.body;
     await GenderCategory.findByIdAndUpdate(genderId , {softDelete : false});
     res.json({ success: true, message: 'Gender catgegory added successfully' }) ; 
 
    }catch(err){
     console.error(err);
     res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
 }



 //post product category soft delete true
  const deleteProductCategory = async ( req , res ) =>{
    try{
    const { productId } = req.body;
     await ProductCategory.findByIdAndUpdate(productId , {softDelete : true});
     res.json({ success: true, message: 'Product catgegory deleted successfully'});  
    }catch(err){
     console.error(err);
     res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  }



//post product category soft delete false
const softDeleteProductCate =  async(req,res) =>{
    try{
     const { productId } = req.body;
     await ProductCategory.findByIdAndUpdate(productId , {softDelete : false});
     res.json({ success: true, message: 'Product catgegory added successfully' }) ; 
    }catch(err){ 
     console.error(err);
     res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
 } 



 //post product subcategory soft delete true  
 const deleteProductSubCategory = async (req , res) =>{
    try{
        const { prosubId } = req.body;
        await ProductSubCategory.findByIdAndUpdate(prosubId , { softDelete : true});
        res.json({ success: true, message: 'Product subcatgegory added successfully' }) ; 
       }catch(err){  
        console.error(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
       }
 } 



 //post product subcategory soft delete false 
 const softDeleteProductSubCate = async ( req,res ) =>{
    try{
        const { prosubId } = req.body;
        await ProductSubCategory.findByIdAndUpdate(prosubId , {softDelete : false});
        res.json({ success: true, message: 'Product subcatgegory added successfully' }) ; 
       }catch(err){ 
        console.error(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
       }
 }






module.exports = {generateLedger , softDeleteProductSubCate , deleteProductSubCategory , softDeleteProductCate ,deleteProductCategory ,softDeleteGenderCat, 
    softDeleteGenderCate , updateBannerDate , updatelogoDate , deleteImages , dashboard , frontPageLogo, frontPageBanner, customers ,userDel ,
    userEdit ,updateUsers ,updateStatus, addCategory ,addGenderCategory ,addProductCategory ,addProductSubCategory ,frontPage } ;  