const express = require('express');
const router = express.Router();
const { getCustomers, createCustomer, getCustomer, updateCustomer, searchCustomer } = require('../controllers/customerController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/search', searchCustomer);
router.get('/', getCustomers);
router.post('/', createCustomer);
router.get('/:id', getCustomer);
router.put('/:id', updateCustomer);

module.exports = router;
