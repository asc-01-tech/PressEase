const Pricing = require('../models/Pricing');

const DEFAULT_PRICING = [
  { clothType: 'Shirt', serviceType: 'Press', price: 14 },
  { clothType: 'Shirt', serviceType: 'Starch', price: 60 },
  { clothType: 'Pant', serviceType: 'Press', price: 14 },
  { clothType: 'Pant', serviceType: 'Starch', price: 60 },
  { clothType: 'Jeans', serviceType: 'Press', price: 18 },
  { clothType: 'Jeans', serviceType: 'Starch', price: 65 },
  { clothType: 'Saree', serviceType: 'Press', price: 30 },
  { clothType: 'Saree', serviceType: 'Starch', price: 80 },
  { clothType: 'Blazer', serviceType: 'Press', price: 40 },
  { clothType: 'Blazer', serviceType: 'Starch', price: 100 },
  { clothType: 'Kurta', serviceType: 'Press', price: 14 },
  { clothType: 'Kurta', serviceType: 'Starch', price: 55 },
  { clothType: 'T-Shirt', serviceType: 'Press', price: 12 },
  { clothType: 'T-Shirt', serviceType: 'Starch', price: 50 },
  { clothType: 'Dupatta', serviceType: 'Press', price: 15 },
  { clothType: 'Dupatta', serviceType: 'Starch', price: 40 },
  { clothType: 'Bedsheet', serviceType: 'Press', price: 25 },
  { clothType: 'Bedsheet', serviceType: 'Starch', price: 60 },
];

// GET /api/settings/pricing
const getPricing = async (req, res) => {
  try {
    let pricing = await Pricing.find().sort({ clothType: 1, serviceType: 1 });
    if (pricing.length === 0) {
      // Seed defaults
      pricing = await Pricing.insertMany(DEFAULT_PRICING);
    }
    res.json(pricing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/settings/pricing
const updatePricing = async (req, res) => {
  try {
    const { items } = req.body; // Array of { clothType, serviceType, price }
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: 'Items array is required' });
    }
    const operations = items.map((item) => ({
      updateOne: {
        filter: { clothType: item.clothType, serviceType: item.serviceType },
        update: { $set: { price: item.price } },
        upsert: true,
      },
    }));
    await Pricing.bulkWrite(operations);
    const updated = await Pricing.find().sort({ clothType: 1, serviceType: 1 });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPricing, updatePricing };
