const Order = require('../models/Order');

// GET /api/dashboard/stats
const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      todayOrders,
      processing,
      readyForPickup,
      completedToday,
      revenueResult,
      recentOrders,
    ] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      Order.countDocuments({ status: 'Processing' }),
      Order.countDocuments({ status: 'Ready for Pickup' }),
      Order.countDocuments({ status: 'Delivered', updatedAt: { $gte: today, $lt: tomorrow } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: today, $lt: tomorrow } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.find({ createdAt: { $gte: today, $lt: tomorrow } })
        .populate('customer', 'name phone')
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    res.json({
      todayOrders,
      processing,
      readyForPickup,
      completedToday,
      todayRevenue: revenueResult[0]?.total || 0,
      recentOrders,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardStats };
