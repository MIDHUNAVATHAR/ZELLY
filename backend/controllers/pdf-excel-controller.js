


const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');


const Order = require("../../models/orderSchema") ;
 

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




const generateExcel = async ( req,res ) =>{

}




module.exports = { generatePDF , generateExcel }