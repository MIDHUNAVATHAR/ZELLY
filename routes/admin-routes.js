const passport = require("passport");
const express = require("express") ;
const multer = require("multer");
const router = express.Router() ;

//import controllers
const adminAuth = require( "../backend/controllers/admin-auth" );
const adminDash = require( "../backend/controllers/admin-dashboard"); 
const adminProduct = require("../backend/controllers/admin-product");  
const couponOffer = require("../backend/controllers/coupon-offer") ; 
const pdfExcelDown = require("../backend/controllers/pdf-excel-controller"); 


const uploadProduct = multer({
    storage :  multer.diskStorage ({  
        destination : "uploads/product",   
        filename    : (req , file , cb ) =>{ 
            cb(null , Date.now() + file.originalname)   
        }
     })
 }).array( 'productImages' , 10 ) ;     



// ADMIN AUTH // 
//get admin login page  
router.get( "/" , adminAuth.adminLogin );

//post admin login
router.post( "/loginPost" , adminAuth.loginPost );  

//admin logout
router.get("/adminLogout" , adminAuth.adminLogout);

//get admin signup page
router.get( "/adminSignup" , adminAuth.adminSignup ); 

//post signup
router.post("/adminSignup" , adminAuth.adminSignupPost);

//post resendEmailOtp
router.post("/resendEmailOtp" ,adminAuth.resendEmailOtp);

//post adminCheckOtp
router.post("/adminCheckOtp" , adminAuth.adminCheckOtp); 


//get forgot password
router.get("/forgotPassword" ,adminAuth.forgotPassword );       //
 
//post forgot password
router.post("/forgotPassword" , adminAuth.forgotPasswordPost);  //

//get reset password
router.get("/adminResetPassword/:token" , adminAuth.resetPassword);   //

//post reset password
router.post("/adminResetPassword/:token" , adminAuth.resetPasswordPost);  // 




//ADMIN DASH 
//get dashboard
router.get("/dashboard" , adminDash.dashboard) ; 

router.post('/dashboard/generate-ledger', adminDash.generateLedger); 

//get front page logo banner
router.get("/frontPage",adminDash.frontPage);

//post logo
router.post("/uploadLogo" , adminDash.frontPageLogo)

//post banner
router.post("/uploadBanner", adminDash.frontPageBanner);

//update logo date 
router.post("/updateLogoDate", adminDash.updatelogoDate) ;  

//update banner date - for selection
router.post("/updateBannerDate" , adminDash.updateBannerDate);

//get customers 
router.get("/customers" , adminDash.customers) ; 

//get delete users
router.get("/delete-user" , adminDash.userDel) ; 

//get edit user 
router.get("/edit-user" , adminDash.userEdit) ;

//post edit user
router.post("/updateUser" , adminDash.updateUsers);

//post update status block
router.post("/update-status/:id" , adminDash.updateStatus); 

//get addcategory
router.get( "/addCategory" ,adminDash.addCategory);

//post gender category
router.post("/addGenderCategory", adminDash.addGenderCategory);

//post product category
router.post("/addProductCategory" , adminDash.addProductCategory); 

//post product sub category
router.post("/addProductSubCategory" , adminDash.addProductSubCategory); 

//post gendercategroy softdelete true 
router.post("/deleteGenderCategory" , adminDash.softDeleteGenderCat) ; 

//post gendercategory softdelete false
router.post("/softDeleteGenderCate" , adminDash.softDeleteGenderCate);

//post product categroy softdelete true
router.post("/deleteProductCategory" , adminDash.deleteProductCategory); 

//post product categroy softdelete false
router.post("/softDeleteProductCate" , adminDash.softDeleteProductCate);

//post product subcategory softdelete true
router.post("/deleteProductSubCategory" , adminDash.deleteProductSubCategory );

//post productsubcategory soft delete false  
router.post("/softDeleteProductSubCate" , adminDash.softDeleteProductSubCate) ;  

//delete images - logo , banner
router.delete("/deleteImage/:type/:id" ,adminDash.deleteImages) ; 

//get add product page 
router.get("/addProduct" , adminProduct.addProduct ) ; 

//post add product
router.post("/addProductPost" , adminProduct.addProductPost);  

//get product list  
router.get("/listProduct" , adminProduct.listProducts);

//get edit product
router.get("/editProduct/:id" ,adminProduct.editProduct) ; 

//delete edit product size
 router.delete('/products/:productid/sizes/:sizeid' , adminProduct.deleteSize ) ;

//delete product image
router.delete("/delete-product-image" , adminProduct.deleteProductImage ) ;

//post edit product
router.post("/editProductPost/:id" , uploadProduct , adminProduct.editProductPost);

//block product
router.post("/blockProduct" , adminProduct.blockProduct ) ; 

//delete product
router.delete("/deleteproduct" , adminProduct.deleteproduct ) 

//get orders
router.get("/orders" , adminProduct.orders );

//get order view
router.get("/orders/:orderId" , adminProduct.viewOrder );

//post update  order status
router.post("/updateOrderStatus" , adminProduct.updateOrderStatus );

//post  update paymwnt status
router.post("/updatePaymentStatus" , adminProduct.updatePaymentStatus );






//get coupon add
router.get("/coupon" , couponOffer.getCoupon);

//post coupon
router.post("/coupon-add" , couponOffer.addCoupon ) ;

//delete coupon
router.delete("/coupon-delete/:id" , couponOffer.deleteCoupon ) ; 

//get offers
router.get("/offers" , couponOffer.Offers ) ;

//post category offer
router.post("/save-category-offer", couponOffer.saveCategoryOffer );

//post product offer
router.post("/save-product-offer" ,couponOffer.saveProductOffer );

//get sales report
router.get("/sales-report" , couponOffer.salesReport);

//post downlaod sales report
router.get( '/download-pdf' , pdfExcelDown.generatePDF) ;

//post downlaod excel report
router.get("/download-excel" , pdfExcelDown.generateExcel);

 




 




module.exports = router;

