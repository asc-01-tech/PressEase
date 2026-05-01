const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  clothType: { type: String, required: true },
  serviceType: { type: String, required: true, enum: ['Press', 'Starch', 'Wash', 'Dry Clean'] },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  items: [orderItemSchema],
  status: {
    type: String,
    enum: ['Received', 'Processing', 'Ready for Pickup', 'Delivered'],
    default: 'Received',
  },
  totalAmount: { type: Number, required: true },
  billFileUrl: { type: String, default: null },
  notes: { type: String, default: '' },
}, { timestamps: true });

// Auto-generate order number before saving
orderSchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    this.orderNumber = `PE${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
