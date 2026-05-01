const express = require('express');
const router = express.Router();
const { getPricing, updatePricing } = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');

router.get('/pricing', protect, getPricing);
router.put('/pricing', protect, updatePricing);

module.exports = router;
