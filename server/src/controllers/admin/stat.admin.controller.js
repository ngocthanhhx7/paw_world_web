const Order = require('../../models/Order');
const Product = require('../../models/Product');
const Lead = require('../../models/Lead');

exports.overview = async (req, res) => {
  const now = new Date();
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const start7days = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);

  const [
    totalOrders,
    completedOrders,
    pendingLeads,
    totalProducts,
    revenueAgg,
    last7DaysOrders,
    topProducts,
  ] = await Promise.all([
    Order.countDocuments({}),
    Order.countDocuments({ status: 'completed' }),
    Lead.countDocuments({ status: { $in: ['new', 'contacting'] } }),
    Product.countDocuments({ isActive: true }),
    Order.aggregate([
      { $match: { status: { $ne: 'cancelled' }, createdAt: { $gte: startMonth } } },
      { $group: { _id: null, revenue: { $sum: '$total' } } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: start7days } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          revenue: { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Product.find({ isActive: true })
      .sort({ soldCount: -1, viewCount: -1 })
      .limit(5)
      .select('name image price salePrice soldCount viewCount'),
  ]);

  res.json({
    totals: {
      orders: totalOrders,
      completedOrders,
      pendingLeads,
      products: totalProducts,
      revenueThisMonth: revenueAgg[0]?.revenue || 0,
    },
    chart: last7DaysOrders,
    topProducts,
  });
};
