

const moment = require("moment");
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');


const Order = require("../../models/orderSchema") ;
 

const generatePDF = async ( req , res ) => {  
 
  try {
    const { dateRange, fromDate, toDate } = req.query;
    
    let startDate = new Date();
    let endDate = new Date();
    
    // Process date range logic
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

    // Fetch sales data with populated references
    const salesReport = await Order.find({
        createdAt: { $gte: startDate, $lte: endDate }
    }).populate([
        { path: 'userId', select: 'firstName lastName email' },
        { path: 'shippingAddress' },
        { path: 'items.product', select: 'name category' }
    ]);

    // Calculate summary statistics
    const summary = {
        totalOrders: salesReport.length,
        totalRevenue: salesReport.reduce((sum, order) => sum + order.totalPrice, 0),
        totalDiscount: salesReport.reduce((sum, order) => sum + (order.totalDiscount || 0), 0),
        totalCoupons: salesReport.reduce((sum, order) => sum + (order.appliedCoupon || 0), 0),
        totalWallet: salesReport.reduce((sum, order) => sum + (order.appliedWallet || 0), 0),
    };

    // Create PDF document
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4'
  });

  // Set response headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=sales_report_${moment().format('YYYY-MM-DD')}.pdf`);
  doc.pipe(res);

  // Define consistent spacing and positioning
  const margins = {
      left: 50,
      right: 550,
      columnSpacing: 15
  };

  const columns = {
      orderId: { x: margins.left, width: 100 },
      customer: { x: margins.left + 120, width: 100 },
      date: { x: margins.left + 240, width: 80 },
      status: { x: margins.left + 340, width: 80 },
      amount: { x: margins.left + 440, width: 80 }
  };

  // Header
  doc.fontSize(20)
     .font('Helvetica-Bold')
     .text('Sales Report', { align: 'center' })
     .moveDown(0.5);

  // Date Range
  doc.fontSize(12)
     .font('Helvetica')
     .text(`Period: ${moment(startDate).format('MMMM D, YYYY')} - ${moment(endDate).format('MMMM D, YYYY')}`, {
         align: 'center'
     })
     .moveDown(2);

  // Summary Section with proper alignment
  doc.font('Helvetica-Bold')
     .fontSize(14)
     .text('Summary', margins.left)
     .moveDown();

  doc.fontSize(12)
     .font('Helvetica');

  // Summary items with consistent left margin
  const summaryItems = [
      `Total Orders: ${summary.totalOrders}`,
      `Total Revenue: ₹${summary.totalRevenue.toFixed(2)}`,
      `Total Discounts: ₹${summary.totalDiscount.toFixed(2)}`,
      `Total Coupon Deductions: ₹${summary.totalCoupons.toFixed(2)}`, 
      `Total Wallet Usage: ₹${summary.totalWallet.toFixed(2)}`
  ];

  summaryItems.forEach(item => {
      doc.text(item, margins.left);
  });

  doc.moveDown(2);

  // Detailed Orders Section
  doc.font('Helvetica-Bold')
     .fontSize(14)
     .text('Detailed Orders', margins.left)
     .moveDown();

  // Table Header with precise positioning
  const drawTableHeader = (y) => {
      doc.font('Helvetica-Bold')
         .fontSize(10);

      doc.text('Order ID', columns.orderId.x, y, { width: columns.orderId.width });
      doc.text('Customer', columns.customer.x, y, { width: columns.customer.width });
      doc.text('Date', columns.date.x, y, { width: columns.date.width });
      doc.text('Status', columns.status.x, y, { width: columns.status.width });
      doc.text('Amount', columns.amount.x, y, { width: columns.amount.width });

      // Draw header underline
      doc.moveTo(margins.left, y + 15)
         .lineTo(margins.right - 50, y + 15)
         .stroke();

      return y + 30; // Return new Y position
  };

  let currentY = drawTableHeader(doc.y);

  // Order Details with precise alignment
  salesReport.forEach((order) => {
      if (currentY > 700) {
          doc.addPage();
          currentY = drawTableHeader(50);
      }

      doc.font('Helvetica')
         .fontSize(9);

      // Main order information with precise positioning
      doc.text(order._id.toString().substring(0, 8), 
              columns.orderId.x, currentY, 
              { width: columns.orderId.width });
      
      doc.text(`${order.userId?.firstName || 'N/A'} ${order.userId?.lastName || ''}`,
              columns.customer.x, currentY,
              { width: columns.customer.width });
      
      doc.text(moment(order.createdAt).format('MM/DD/YY'),
              columns.date.x, currentY,
              { width: columns.date.width });
      
      doc.text(order.orderStatus,
              columns.status.x, currentY,
              { width: columns.status.width });
      
      doc.text(`₹${order.totalPrice.toFixed(2)}`,
              columns.amount.x, currentY,
              { width: columns.amount.width });

      currentY += 20;

      // Items section with proper indentation
      doc.text('Items:', margins.left + 20, currentY);
      currentY += 15;

      order.items.forEach(item => {
          doc.text(`• ${item.product.title}`, margins.left + 30, currentY);
          doc.text(`Qty: ${item.quantity}, Size: ${item.size}`, margins.left + 40, currentY + 12);
          doc.text(`Price: ₹${item.price}`, margins.left + 40, currentY + 24);
          currentY += 40;
      });

      // Separator line
      doc.moveTo(margins.left, currentY)
         .lineTo(margins.right - 50, currentY)
         .stroke();

      currentY += 20;
  });

  // Footer
  doc.fontSize(8)
     .text(
         `Report generated on ${moment().format('MMMM D, YYYY, h:mm A')}`,
         margins.left,
         doc.page.height - 50,
         { align: 'center' }
     );

  doc.end();


} catch (err) {
    console.error('Error generating PDF:', err);
    res.status(500).json({
        success: false,
        message: 'Error generating PDF',
        error: err.message
    });
}

}




const generateExcel = async (req, res) => {
  try {
      const { dateRange, fromDate, toDate } = req.query;
  
      let startDate = new Date();
      let endDate = new Date();
  
      // Process date range logic
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
          createdAt: { $gte: startDate, $lte: endDate }
      }).populate([
          { path: 'userId', select: 'firstName lastName email' },
          { path: 'shippingAddress' },
          { path: 'items.product', select: 'name category' }
      ]);

      // Calculate summary
      const summary = {
          totalOrders: salesReport.length,
          totalRevenue: salesReport.reduce((sum, order) => sum + order.totalPrice, 0),
          totalDiscount: salesReport.reduce((sum, order) => sum + (order.totalDiscount || 0), 0),
          totalCoupons: salesReport.reduce((sum, order) => sum + (order.appliedCoupon || 0), 0),
          totalWallet: salesReport.reduce((sum, order) => sum + (order.appliedWallet || 0), 0),
      };

      // Create new workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sales Report');

      // Add title
      worksheet.mergeCells('A1:G1');
      worksheet.getCell('A1').value = 'Sales Report';
      worksheet.getCell('A1').font = {
          bold: true,
          size: 16
      };
      worksheet.getCell('A1').alignment = { horizontal: 'center' };

      // Add date range
      worksheet.mergeCells('A2:G2');
      worksheet.getCell('A2').value = `Period: ${moment(startDate).format('MMMM D, YYYY')} - ${moment(endDate).format('MMMM D, YYYY')}`;
      worksheet.getCell('A2').alignment = { horizontal: 'center' };

      // Add summary section
      worksheet.getCell('A4').value = 'Summary';
      worksheet.getCell('A4').font = { bold: true };

      const summaryData = [
          ['Total Orders', summary.totalOrders],
          ['Total Revenue', summary.totalRevenue, 'currency'],
          ['Total Discounts', summary.totalDiscount, 'currency'],
          ['Total Coupon Deductions', summary.totalCoupons, 'currency'],
          ['Total Wallet Usage', summary.totalWallet, 'currency']
      ];

      summaryData.forEach((row, index) => {
          worksheet.getCell(`A${5 + index}`).value = row[0];  
          const cell = worksheet.getCell(`B${5 + index}`);
          cell.value = row[1];
          if (row[2] === 'currency') {
              cell.numFmt = '₹#,##0.00';
          }
      });

      // Add detailed orders section
      worksheet.getCell('A11').value = 'Detailed Orders';
      worksheet.getCell('A11').font = { bold: true };

      // Add headers for detailed orders
      const headers = ['Order ID', 'Customer', 'Date', 'Status', 'Amount', 'Items'];
      const headerRow = worksheet.getRow(13);
      headers.forEach((header, index) => {
          const cell = headerRow.getCell(index + 1);
          cell.value = header;
          cell.font = { bold: true };
      });

      // Style the header row
      worksheet.getRow(13).height = 20;
      worksheet.getRow(13).alignment = { vertical: 'middle' };

      // Add order data
      let currentRow = 14;
      salesReport.forEach(order => {
          const row = worksheet.getRow(currentRow);
          
          // Main order information
          row.getCell(1).value = order._id.toString();
          row.getCell(2).value = `${order.userId?.firstName || 'N/A'} ${order.userId?.lastName || ''}`;
          row.getCell(3).value = moment(order.createdAt).format('DD/MM/YYYY');
          row.getCell(4).value = order.orderStatus;
          
          const amountCell = row.getCell(5);
          amountCell.value = order.totalPrice;
          amountCell.numFmt = '₹#,##0.00';

          // Items information
          const itemsInfo = order.items.map(item => 
              `${item.product.name} (Qty: ${item.quantity}, Size: ${item.size}, Price: ₹${item.price})`
          ).join('\n');
          row.getCell(6).value = itemsInfo;
          
          // Adjust row height based on content
          row.height = 25 * Math.max(1, order.items.length);
          
          // Style alignment
          row.alignment = { vertical: 'middle', wrapText: true };
          
          currentRow++;
      });

      // Adjust column widths
      worksheet.columns.forEach((column, index) => {
          let maxLength = 0;
          column.eachCell({ includeEmpty: false }, cell => {
              const columnLength = cell.value ? cell.value.toString().length : 10;
              if (columnLength > maxLength) {
                  maxLength = columnLength;
              }
          });
          column.width = Math.min(maxLength + 2, 50);
      });

      // Set response headers
      res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
          'Content-Disposition',
          `attachment; filename=sales_report_${moment().format('YYYY-MM-DD')}.xlsx`
      );

      // Write to response
      await workbook.xlsx.write(res);

  } catch (err) {
      console.error('Error generating Excel report:', err);
      res.status(500).json({
          success: false,
          message: 'Error generating Excel report',
          error: err.message
      });
  }
};




module.exports = { generatePDF , generateExcel } 