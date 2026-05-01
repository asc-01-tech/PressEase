const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateBillPDF = async (order, customer, shopName) => {
  return new Promise((resolve, reject) => {
    const billsDir = path.join(__dirname, '../../bills');
    if (!fs.existsSync(billsDir)) {
      fs.mkdirSync(billsDir, { recursive: true });
    }

    const fileName = `order-${order._id}.pdf`;
    const filePath = path.join(billsDir, fileName);
    const doc = new PDFDocument({ margin: 40, size: 'A5' });
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#1a3c5e').text(shopName, { align: 'center' });
    doc.fontSize(10).font('Helvetica').fillColor('#555').text('Laundry & Press Services', { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).strokeColor('#cccccc').stroke();
    doc.moveDown(0.5);

    // Order Info
    doc.fontSize(9).fillColor('#333');
    doc.font('Helvetica-Bold').text('Order ID: ', { continued: true }).font('Helvetica').text(order.orderNumber);
    doc.font('Helvetica-Bold').text('Date: ', { continued: true }).font('Helvetica').text(new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }));
    doc.font('Helvetica-Bold').text('Status: ', { continued: true }).font('Helvetica').text(order.status);
    doc.moveDown(0.5);

    // Customer Info
    doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).strokeColor('#cccccc').stroke();
    doc.moveDown(0.3);
    doc.fontSize(9).font('Helvetica-Bold').text('CUSTOMER DETAILS');
    doc.font('Helvetica').text(`Name: ${customer.name}`);
    doc.text(`Phone: ${customer.phone}`);
    if (customer.address) doc.text(`Address: ${customer.address}`);
    doc.moveDown(0.5);

    // Items Table Header
    doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).strokeColor('#cccccc').stroke();
    doc.moveDown(0.3);
    const tableTop = doc.y;
    const col1 = 40, col2 = 155, col3 = 245, col4 = 290, col5 = 335;

    doc.fontSize(8).font('Helvetica-Bold').fillColor('#1a3c5e');
    doc.text('Item', col1, tableTop);
    doc.text('Service', col2, tableTop);
    doc.text('Qty', col3, tableTop);
    doc.text('Price', col4, tableTop);
    doc.text('Amount', col5, tableTop);

    doc.moveDown(0.2);
    doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).strokeColor('#aaaaaa').stroke();
    doc.moveDown(0.2);

    // Items
    doc.font('Helvetica').fillColor('#333');
    order.items.forEach((item) => {
      const y = doc.y;
      doc.fontSize(8);
      doc.text(item.clothType, col1, y);
      doc.text(item.serviceType, col2, y);
      doc.text(String(item.quantity), col3, y);
      doc.text(`₹${item.price.toFixed(2)}`, col4, y);
      doc.text(`₹${item.subtotal.toFixed(2)}`, col5, y);
      doc.moveDown(0.5);
    });

    doc.moveDown(0.3);
    doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).strokeColor('#cccccc').stroke();
    doc.moveDown(0.3);

    // Total
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1a3c5e');
    doc.text(`TOTAL: ₹${order.totalAmount.toFixed(2)}`, { align: 'right' });
    doc.moveDown(1);

    // Footer
    doc.fontSize(8).font('Helvetica').fillColor('#777');
    doc.text('Thank you for choosing our services!', { align: 'center' });
    doc.text('Please bring this bill when collecting your order.', { align: 'center' });

    doc.end();

    stream.on('finish', () => resolve({ filePath, fileName }));
    stream.on('error', reject);
  });
};

module.exports = { generateBillPDF };
