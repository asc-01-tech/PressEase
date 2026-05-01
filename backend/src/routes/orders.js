const express = require('express');
const router = express.Router();
const { getOrders, createOrder, getOrder, updateOrder, downloadBill, resendNotification } = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getOrders);
router.post('/', createOrder);
router.get('/:id', getOrder);
router.put('/:id', updateOrder);
router.get('/:id/bill', downloadBill);
router.post('/:id/notify', resendNotification);

module.exports = router;
