const Order = require('../../models/Order');
const Product = require('../../models/Product');
const Lead = require('../../models/Lead');
const Customer = require('../../models/Customer');

function buildDashboardTotals({
  totalOrders,
  completedOrders,
  pendingLeads,
  totalProducts,
  revenueThisMonth,
  totalCustomers,
  activeCustomers,
  lockedCustomers,
  newCustomersThisMonth,
}) {
  return {
    orders: totalOrders,
    completedOrders,
    pendingLeads,
    products: totalProducts,
    revenueThisMonth,
    customers: totalCustomers,
    activeCustomers,
    lockedCustomers,
    newCustomersThisMonth,
  };
}

exports.buildDashboardTotals = buildDashboardTotals;

exports.overview = async (req, res) => {
  const now = new Date();
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const start7days = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);

  const [
    totalOrders,
    completedOrders,
    pendingLeads,
    totalProducts,
    totalCustomers,
    activeCustomers,
    lockedCustomers,
    newCustomersThisMonth,
    revenueAgg,
    last7DaysOrders,
    topProducts,
    topCustomerOrders,
  ] = await Promise.all([
    Order.countDocuments({}),
    Order.countDocuments({ status: 'completed' }),
    Lead.countDocuments({ status: { $in: ['new', 'contacting'] } }),
    Product.countDocuments({ isActive: true }),
    Customer.countDocuments({}),
    Customer.countDocuments({ isActive: true }),
    Customer.countDocuments({ isActive: false }),
    Customer.countDocuments({ createdAt: { $gte: startMonth } }),
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
    Order.aggregate([
      { $match: { status: { $ne: 'cancelled' }, 'customer.email': { $ne: '' } } },
      {
        $group: {
          _id: '$customer.email',
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$total' },
          latestOrderAt: { $max: '$createdAt' },
        },
      },
      { $sort: { totalSpent: -1, orderCount: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const topCustomerEmails = topCustomerOrders.map((item) => item._id).filter(Boolean);
  const topCustomerDocs = await Customer.find({ email: { $in: topCustomerEmails } })
    .select('fullName email phone avatar isActive')
    .lean();
  const topCustomersByEmail = new Map(topCustomerDocs.map((customer) => [customer.email, customer]));
  const topCustomers = topCustomerOrders.map((item) => {
    const customer = topCustomersByEmail.get(item._id);
    return {
      id: customer?._id ? String(customer._id) : '',
      fullName: customer?.fullName || item._id,
      email: item._id,
      phone: customer?.phone || '',
      avatar: customer?.avatar || '',
      isActive: customer?.isActive ?? true,
      orderCount: item.orderCount || 0,
      totalSpent: item.totalSpent || 0,
      latestOrderAt: item.latestOrderAt || null,
    };
  });

  res.json({
    totals: buildDashboardTotals({
      totalOrders,
      completedOrders,
      pendingLeads,
      totalProducts,
      revenueThisMonth: revenueAgg[0]?.revenue || 0,
      totalCustomers,
      activeCustomers,
      lockedCustomers,
      newCustomersThisMonth,
    }),
    chart: last7DaysOrders,
    topProducts,
    topCustomers,
  });
};
