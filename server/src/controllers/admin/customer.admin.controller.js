const Customer = require('../../models/Customer');
const Order = require('../../models/Order');

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizePhone(value) {
  return String(value || '').trim();
}

function toPlain(value) {
  if (!value) return value;
  if (typeof value.toObject === 'function') return value.toObject();
  return value;
}

function buildCustomerFilter(query = {}) {
  const { q, status, provider } = query;
  const filter = {};
  const conditions = [];
  const term = String(q || '').trim();

  if (term) {
    conditions.push({
      $or: [
      { fullName: { $regex: term, $options: 'i' } },
      { email: { $regex: term, $options: 'i' } },
      { phone: { $regex: term, $options: 'i' } },
      ],
    });
  }

  if (status === 'active') filter.isActive = true;
  if (status === 'locked') filter.isActive = false;

  if (provider === 'google') conditions.push({ googleSub: { $exists: true, $nin: ['', null] } });
  if (provider === 'password') {
    conditions.push({ $or: [{ googleSub: '' }, { googleSub: null }, { googleSub: { $exists: false } }] });
  }

  if (conditions.length) filter.$and = conditions;

  return filter;
}

function buildOrderContactFilter(customer) {
  const email = normalizeEmail(customer?.email);
  const phone = normalizePhone(customer?.phone);
  const conditions = [];

  if (email) conditions.push({ 'customer.email': email });
  if (phone) conditions.push({ 'customer.phone': phone });

  return conditions.length ? { $or: conditions } : { _id: null };
}

function summarizeOrders(orders = []) {
  const sorted = [...orders].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const orderCount = sorted.length;
  const completedOrderCount = sorted.filter((order) => order.status === 'completed').length;
  const cancelledOrderCount = sorted.filter((order) => order.status === 'cancelled').length;
  const totalSpent = sorted
    .filter((order) => order.status !== 'cancelled')
    .reduce((sum, order) => sum + Number(order.total || 0), 0);

  return {
    summary: {
      orderCount,
      completedOrderCount,
      cancelledOrderCount,
      totalSpent,
      averageOrderValue: orderCount ? Math.round(totalSpent / orderCount) : 0,
      latestOrderAt: sorted[0]?.createdAt || null,
    },
    recentOrders: sorted.slice(0, 10),
  };
}

function toCustomerPayload(customer, summary = {}) {
  const plain = toPlain(customer);
  const commerce = {
    orderCount: 0,
    totalSpent: 0,
    latestOrderAt: null,
    ...summary,
  };

  return {
    id: String(plain._id || plain.id || ''),
    fullName: plain.fullName,
    email: plain.email,
    phone: plain.phone || '',
    avatar: plain.avatar || '',
    googleSub: plain.googleSub || '',
    isActive: plain.isActive,
    emailVerifiedAt: plain.emailVerifiedAt || null,
    lastLoginAt: plain.lastLoginAt || null,
    createdAt: plain.createdAt || null,
    orderCount: commerce.orderCount,
    totalSpent: commerce.totalSpent,
    latestOrderAt: commerce.latestOrderAt || null,
  };
}

async function findOrdersForCustomer(customer) {
  return Order.find(buildOrderContactFilter(customer))
    .sort({ createdAt: -1 })
    .select('orderCode status paymentStatus total createdAt')
    .lean();
}

exports.buildCustomerFilter = buildCustomerFilter;
exports.buildOrderContactFilter = buildOrderContactFilter;
exports.summarizeOrders = summarizeOrders;
exports.toCustomerPayload = toCustomerPayload;

exports.list = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const filter = buildCustomerFilter(req.query);
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));

  const [customers, total] = await Promise.all([
    Customer.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .select('-password -resetPasswordTokenHash -resetPasswordExpiresAt')
      .lean(),
    Customer.countDocuments(filter),
  ]);

  const items = await Promise.all(
    customers.map(async (customer) => {
      const orders = await findOrdersForCustomer(customer);
      return toCustomerPayload(customer, summarizeOrders(orders).summary);
    }),
  );

  res.json({ items, pagination: { page: pageNum, limit: limitNum, total } });
};

exports.getById = async (req, res) => {
  const customer = await Customer.findById(req.params.id)
    .select('-password -resetPasswordTokenHash -resetPasswordExpiresAt')
    .lean();

  if (!customer) return res.status(404).json({ message: 'Khong tim thay khach hang' });

  const orders = await findOrdersForCustomer(customer);
  const { summary, recentOrders } = summarizeOrders(orders);

  res.json({
    customer: toCustomerPayload(customer, summary),
    summary,
    recentOrders,
  });
};

exports.updateStatus = async (req, res) => {
  const { isActive } = req.body;
  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ message: 'Trang thai khong hop le' });
  }

  const customer = await Customer.findById(req.params.id);
  if (!customer) return res.status(404).json({ message: 'Khong tim thay khach hang' });

  if (customer.isActive !== isActive) {
    customer.isActive = isActive;
    customer.bumpTokenVersion();
  }

  await customer.save();
  return res.json({ customer: toCustomerPayload(customer) });
};
