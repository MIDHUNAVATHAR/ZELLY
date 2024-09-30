

const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');



//import schemas
const coupon = require("../../models/couponSchema") ; 
const GenderCategory = require("../../models/genderCategory");
const Product = require("../../models/product");
const Order = require("../../models/orderSchema");



//get coupon page
const getCoupon = async (req,res) =>{
    try{
    
    if(!req.session.adminEmail){
       return res.redirect('/admin')
    }
    const coupons = await coupon.find({});
    res.render("admin-dashboard" ,{ admin : req.session.adminEmail , partial : "partials/coupon" ,coupons }) ;

    }catch(err){
        console.log(err)
    }
}


//add coupon
const addCoupon = async (req,res) =>{

    try{
      const { code, discountValue, expiryDate, usageLimit } = req.body;
      if(!code){
        return res.redirect("/admin/coupon")
      }
     
      const submittedCoupons = code.map((code, index) => ({
        code,
        couponBalance : discountValue[index], 
        expiryDate: expiryDate[index],
        usageLimit: usageLimit[index]
    }));
   
    // Update or add each submitted coupon
    for (const submittedCoupon of submittedCoupons) {
        await coupon.updateOne(
            { code: submittedCoupon.code },
            {
                $set: {
                    couponBalance: submittedCoupon.couponBalance ,
                    expiryDate: submittedCoupon.expiryDate ,
                    usageLimit: submittedCoupon.usageLimit
                }
            },
            { upsert : true }  // Creates a new coupon if it doesn't exist 
        );
    }
     return res.redirect("/admin/coupon?add=1")
    }catch(err){
        console.log(err) ;
    }
}



//delete coupon
const deleteCoupon = async ( req,res ) =>{
    const couponId = req.params.id ;
    try {
        await coupon.findByIdAndDelete( couponId ); 
        res.json({ success: true }); // Send a success response
      } catch (err) {
        console.error('Error deleting coupon : ', err) ;
        res.json({ success: false, error: err }); // Send an error response
      }
}



//get offers
const Offers = async ( req,res ) =>{
    try{
        const genderCategories = await GenderCategory.find();
        const products = await Product.find(); 
        res.render("admin-dashboard" , { admin : req.session.adminEmail , partial : "partials/offers" , genderCategories , products }) ;
    }catch(err){
        console.log(err) ;
    }
}


//post save category offer
const saveCategoryOffer = async (req,res) =>{
    const categoryId = req.body.id ;
    const offer = req.body.offer ;
    const expiryDate = req.body.expiryDate || new Date(Date.now() + 24 * 60 * 60 * 1000); ;
   try{
    await GenderCategory.findByIdAndUpdate( categoryId , { offer : offer , offerExpiry : expiryDate  }); 
    res.status(200).json({ 
        message: 'Category offer updated successfully' ,  
    });
   }catch(err){
    console.error(err);
    res.status(500).json({ message: 'An error occurred while updating the offer' });
   }
}


//post save product offer
const saveProductOffer = async (req,res)=>{ 
    const productId = req.body.id;
    const offer = req.body.offer ;
    const expiryDate = req.body.expiryDate || new Date(Date.now() + 24 * 60 * 60 * 1000);  ;
   try{
    await Product.findByIdAndUpdate(productId , { offer : offer , offerExpiry : expiryDate  });
    res.status(200).json({ 
        message: 'Product offer updated successfully', 
    });
   }catch(err){
    console.error(err);
    res.status(500).json({ message: 'An error occurred while updating the offer' });
   }
}




//get sales report
const salesReport = async ( req , res ) =>{
   try{
    if(!req.session.adminId){
        return res.redirect("/admin");
    }

  const { dateRange, fromDate, toDate } = req.query;

  let startDate = new Date();
  let endDate = new Date();

  switch (dateRange) {
    case 'day':
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'custom':
      startDate = new Date(fromDate);
      endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
      break;
    default:
      break;
  }

  const salesReport = await Order.find({
    createdAt: { $gte: startDate, $lte: endDate },
  }).populate("userId");
  
  // Calculate summary data
  const totalSalesCount = salesReport.length;
  const totalOrderAmount = salesReport.reduce((sum, order) => sum + order.totalPrice, 0);
  const totalDiscount = salesReport.reduce((sum, order) => sum + order.totalDiscount , 0);
  const totalCouponDeduction = salesReport.reduce((sum, order) => sum + order.appliedCoupon, 0);

  res.render("admin-dashboard" , {
    partial : "partials/sales-report" ,
    salesReport,
    totalSalesCount,
    totalOrderAmount,
    totalDiscount,
    totalCouponDeduction,
    admin : req.session.adminEmail
  });

   }catch(err){
    console.log(err)
   }
}


const generatePDF = async (req,res ) =>{
    try {
        const { dateRange, fromDate, toDate } = req.query;
    
        let startDate = new Date();
        let endDate = new Date();
    
        // Process date range logic (same as your sales report logic)
        switch (dateRange) {
            case 'day':
              startDate.setHours(0, 0, 0, 0);
              endDate.setHours(23, 59, 59, 999);
              break;
            case 'week':
              startDate.setDate(startDate.getDate() - 7);
              endDate.setHours(23, 59, 59, 999);
              break;
            case 'month':
              startDate.setMonth(startDate.getMonth() - 1);
              endDate.setHours(23, 59, 59, 999);
              break;
            case 'year':
              startDate.setFullYear(startDate.getFullYear() - 1);
              endDate.setHours(23, 59, 59, 999);
              break;
            case 'custom':
              startDate = new Date(fromDate);
              endDate = new Date(toDate);
              endDate.setHours(23, 59, 59, 999);
              break;
            default:
              break;
          }
        
    
        // Fetch sales data
        const salesReport = await Order.find({
          createdAt: { $gte: startDate, $lte: endDate },
        }).populate('userId');
    
        // Create a PDF document
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=sales_report.pdf');
        doc.pipe(res);
    
        // Add content to the PDF
        doc.fontSize(20).text('Sales Report', { align: 'center' });
        doc.moveDown();
    
        salesReport.forEach(order => {
          doc.fontSize(12).text(`Order ID: ${order._id}`);
          doc.text(`User: ${order.userId.firstName} ${order.userId.lastName}`);
          doc.text(`Total Price: ${order.totalPrice}`);
          doc.text(`Discount: ${order.totalDiscount}`);
          doc.text(`Coupon Deduction: ${order.appliedCoupon}`);
          doc.moveDown();
        });
    
        doc.end();
      } catch (err) {
        console.error('Error generating PDF:', err);
        res.status(500).send('Server error while generating PDF');
      }
}



const generateExcel = async (req,res) =>{
    try {
        const { dateRange, fromDate, toDate } = req.query;
    
        let startDate = new Date();
        let endDate = new Date();
    
        // Process date range logic (same as your sales report logic)
        switch (dateRange) {
            case 'day':
              startDate.setHours(0, 0, 0, 0);
              endDate.setHours(23, 59, 59, 999);
              break;
            case 'week':
              startDate.setDate(startDate.getDate() - 7);
              endDate.setHours(23, 59, 59, 999);
              break;
            case 'month':
              startDate.setMonth(startDate.getMonth() - 1);
              endDate.setHours(23, 59, 59, 999);
              break;
            case 'year':
              startDate.setFullYear(startDate.getFullYear() - 1);
              endDate.setHours(23, 59, 59, 999);
              break;
            case 'custom':
              startDate = new Date(fromDate);
              endDate = new Date(toDate);
              endDate.setHours(23, 59, 59, 999);
              break;
            default:
              break; 
          }
        
    
        // Fetch sales data
        const salesReport = await Order.find({
          createdAt: { $gte: startDate, $lte: endDate },
        }).populate('userId');
    
        // Create a new Excel workbook and sheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');
    
        // Add column headers
        worksheet.columns = [
          { header: 'Order ID', key: 'id', width: 30 },
          { header: 'User', key: 'user', width: 30 },
          { header: 'Total Price', key: 'totalPrice', width: 15 },
          { header: 'Total Discount', key: 'totalDiscount', width: 15 },
          { header: 'Coupon Deduction', key: 'appliedCoupon', width: 15 },
        ];
    
        // Add rows
        salesReport.forEach(order => {
          worksheet.addRow({
            id: order._id,
            user: `${order.userId.firstName} ${order.userId.lastName}`,
            totalPrice: order.totalPrice,
            totalDiscount: order.totalDiscount,
            appliedCoupon: order.appliedCoupon,
          });
        });
    
        // Set the response headers for Excel download
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
          'Content-Disposition',
          'attachment; filename=sales_report.xlsx'
        );
    
        // Write the Excel file to the response
        await workbook.xlsx.write(res);
        res.end();
      } catch (err) {
        console.error('Error generating Excel:', err);
        res.status(500).send('Server error while generating Excel');
      }
}


    




   
  

  
 

 
module.exports = { getCoupon ,addCoupon  , deleteCoupon , Offers , saveCategoryOffer , saveProductOffer , salesReport, generatePDF , generateExcel }  