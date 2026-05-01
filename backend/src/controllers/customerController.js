const Customer = require('../models/Customer');

// GET /api/customers
const getCustomers = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    let query = {};
    if (search) {
      const regex = new RegExp(search, 'i');
      query = { $or: [{ name: regex }, { phone: regex }] };
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [customers, total] = await Promise.all([
      Customer.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Customer.countDocuments(query),
    ]);
    res.json({ customers, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/customers
const createCustomer = async (req, res) => {
  try {
    const { name, phone, address, notes } = req.body;
    if (!name || !phone) return res.status(400).json({ message: 'Name and phone are required' });
    const existing = await Customer.findOne({ phone: phone.trim() });
    if (existing) return res.status(409).json({ message: 'Customer with this phone already exists', customer: existing });
    const customer = await Customer.create({ name: name.trim(), phone: phone.trim(), address, notes });
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/customers/:id
const getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/customers/:id
const updateCustomer = async (req, res) => {
  try {
    const { name, phone, address, notes } = req.body;
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { name, phone, address, notes },
      { new: true, runValidators: true }
    );
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/customers/search?q=
const searchCustomer = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const regex = new RegExp(q, 'i');
    const customers = await Customer.find({ $or: [{ name: regex }, { phone: regex }] }).limit(10);
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCustomers, createCustomer, getCustomer, updateCustomer, searchCustomer };
