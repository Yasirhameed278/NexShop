const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');

// Admin dashboard overview
router.get('/stats', protect, admin, async (req, res) => {
  const [
    totalProducts, totalUsers, totalOrders,
    revenueData, lowStockProducts, topProducts
  ] = await Promise.all([
    Product.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'user' }),
    Order.countDocuments(),
    Order.aggregate([{ $match: { isPaid: true } }, { $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
    Product.find({ stock: { $lte: 5 }, isActive: true }).select('name stock thumbnail price').limit(10),
    Product.find({ isActive: true }).sort({ soldCount: -1 }).limit(5).select('name soldCount price thumbnail'),
  ]);

  const monthlyData = await Order.aggregate([
    { $match: { createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        revenue: { $sum: '$totalPrice' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const categoryStats = await Product.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 }, revenue: { $sum: { $multiply: ['$price', '$soldCount'] } } } },
    { $sort: { count: -1 } },
  ]);

  res.json({
    totalProducts,
    totalUsers,
    totalOrders,
    totalRevenue: revenueData[0]?.total || 0,
    lowStockProducts,
    topProducts,
    monthlyData,
    categoryStats,
  });
});

module.exports = router;
