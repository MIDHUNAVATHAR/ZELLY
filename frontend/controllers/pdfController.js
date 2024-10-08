const PDFDocument = require('pdfkit');
const Order = require("../../models/orderSchema");



const generateOrderPDF = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId).populate('items.product').populate("shippingAddress");
      
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Create a new PDF document
        const doc = new PDFDocument({
            margin: 50,
            size: 'A4'
        });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=order-${orderId}.pdf`);

        // Pipe the PDF directly to the response
        doc.pipe(res);

        // Add content to the PDF
        // Header
        doc.fontSize(20)
           .text('Order Summary', { align: 'center' })
           .moveDown();

        // Order Details
        doc.fontSize(12)
           .text(`Order ID: ${order._id}`)
           .text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`)
           .text(`Order Status: ${order.orderStatus}`)
           .text(`Payment Method: ${order.paymentMethod}`)
           .text(`Payment Status: ${order.paymentStatus}`)
           .moveDown();

        // Shipping Address
        doc.fontSize(14)
           .text('Shipping Address', { underline: true })
           .fontSize(12)
           .text(order.shippingAddress.address)
           .text(order.shippingAddress.landmark || '')
           .text(`${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.pincode}`)
           .text(`Phone: ${order.shippingAddress.phone}`)
           .text(`Address Type: ${order.shippingAddress.addresstype}`)
           .moveDown();

        // Items Table
        doc.fontSize(14)
           .text('Items Purchased', { underline: true })
           .moveDown();

        // Table headers
        const tableTop = doc.y;
        const itemX = 50;
        const sizeX = 200;
        const qtyX = 280;
        const priceX = 350;
        const totalX = 450;

        doc.fontSize(12)
           .text('Product', itemX, tableTop)
           .text('Size', sizeX, tableTop)
           .text('Qty', qtyX, tableTop)
           .text('Price', priceX, tableTop)
           .text('Total', totalX, tableTop);

        // Draw line
        doc.moveTo(50, doc.y + 10)
           .lineTo(550, doc.y + 10)
           .stroke();

        // Table rows
        let yPosition = doc.y + 20;
        order.items.forEach(item => {
            // Check if we need a new page
            if (yPosition > 700) {
                doc.addPage();
                yPosition = 50;
            }

            doc.fontSize(12)
               .text(item.product.title, itemX, yPosition)
               .text(item.size, sizeX, yPosition)
               .text(item.quantity.toString(), qtyX, yPosition)
               .text(`₹${item.price}`, priceX, yPosition)
               .text(`₹${item.totalPrice}`, totalX, yPosition);

            yPosition += 30;
        });

        // Draw line
        doc.moveTo(50, yPosition)
           .lineTo(550, yPosition)
           .stroke();

        // Total amount
        doc.fontSize(14)
           .text(`Total Amount: ₹${order.totalPrice}`, { align: 'right' })
           .moveDown();

        // Footer
        doc.fontSize(10)
           .text('Thank you for your order!', { align: 'center' });

        // Finalize the PDF
        doc.end();

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ 
            message: 'Failed to generate PDF',
            error: error.message 
        });
    }
};




module.exports = { generateOrderPDF };