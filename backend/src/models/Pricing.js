const mongoose = require('mongoose');

const pricingSchema = new mongoose.Schema({
  clothType: { type: String, required: true },
  serviceType: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
}, { timestamps: true });

pricingSchema.index({ clothType: 1, serviceType: 1 }, { unique: true });

module.exports = mongoose.model('Pricing', pricingSchema);
