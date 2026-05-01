const Order = require('../models/Order');
const Customer = require('../models/Customer');
const { generateBillPDF } = require('../utils/pdfGenerator');
const { sendWhatsAppNotification } = require('../utils/whatsapp');
const path = require('path');
const fs = require('fs');

// GET /api/orders
const getOrders = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20, date } = req.query;
    let query = {};
    if (status) query.status = status;
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: start, $lte: end };
    }

    let orders;
    if (search) {
      // Search by order number or customer
      const customers = await Customer.find({
        $or: [{ name: new RegExp(search, 'i') }, { phone: new RegExp(search, 'i') }],
      }).select('_id');
      const customerIds = customers.map((c) => c._id);
      query.$or = [{ orderNumber: new RegExp(search, 'i') }, { customer: { $in: customerIds } }];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [ordersData, total] = await Promise.all([
      Order.find(query).populate('customer', 'name phone address').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Order.countDocuments(query),
    ]);
    res.json({ orders: ordersData, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/orders
const createOrder = async (req, res) => {
  try {
    const { customerId, items, notes } = req.body;
    if (!customerId || !items || items.length === 0) {
      return res.status(400).json({ message: 'Customer and at least one item are required' });
    }
    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const processedItems = items.map((item) => ({
      ...item,
      subtotal: item.quantity * item.price,
    }));
    const totalAmount = processedItems.reduce((sum, item) => sum + item.subtotal, 0);

    const order = await Order.create({ customer: customerId, items: processedItems, totalAmount, notes });
    const populated = await Order.findById(order._id).populate('customer', 'name phone address');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/orders/:id
const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('customer', 'name phone address notes');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/orders/:id
const updateOrder = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const order = await Order.findById(req.params.id).populate('customer', 'name phone address');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const prevStatus = order.status;
    if (status) order.status = status;
    if (notes !== undefined) order.notes = notes;

    let waResult = null;
    // If status changes to Ready for Pickup → generate bill + send WhatsApp
    if (status === 'Ready for Pickup' && prevStatus !== 'Ready for Pickup') {
      const shopName = process.env.SHOP_NAME || 'My Press Shop';
      const { filePath, fileName } = await generateBillPDF(order, order.customer, shopName);
      order.billFileUrl = `/api/orders/${order._id}/bill`;
      await order.save();

      // Send WhatsApp
      waResult = await sendWhatsAppNotification(
        order.customer.phone,
        order.customer.name,
        order.orderNumber,
        order.totalAmount,
        `${process.env.FRONTEND_URL}/orders/${order._id}`
      );
    } else {
      await order.save();
    }

    const updated = await Order.findById(order._id).populate('customer', 'name phone address');
    
    let updatedObj = updated.toObject();
    if (waResult && waResult.via === 'web') {
      updatedObj.waLink = waResult.waLink;
    }
    
    res.json(updatedObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/orders/:id/bill - stream PDF
const downloadBill = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('customer', 'name phone address');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const billsDir = path.join(__dirname, '../../bills');
    const filePath = path.join(billsDir, `order-${order._id}.pdf`);

    // Generate if not exists
    if (!fs.existsSync(filePath)) {
      const shopName = process.env.SHOP_NAME || 'My Press Shop';
      await generateBillPDF(order, order.customer, shopName);
      if (!order.billFileUrl) {
        order.billFileUrl = `/api/orders/${order._id}/bill`;
        await order.save();
      }
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="bill-${order.orderNumber}.pdf"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/orders/:id/notify - resend WhatsApp
const resendNotification = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('customer', 'name phone');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const result = await sendWhatsAppNotification(
      order.customer.phone,
      order.customer.name,
      order.orderNumber,
      order.totalAmount,
      `${process.env.FRONTEND_URL}/orders/${order._id}`
    );
    res.json({ message: 'Notification sent', result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getOrders, createOrder, getOrder, updateOrder, downloadBill, resendNotification };
