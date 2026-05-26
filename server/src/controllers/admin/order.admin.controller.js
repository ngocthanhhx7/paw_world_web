const Order = require('../../models/Order');

exports.list = async (req, res) => {
  const { q, status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (q) {
    filter.$or = [
      { orderCode: { $regex: q, $options: 'i' } },
      { 'customer.fullName': { $regex: q, $options: 'i' } },
      { 'customer.phone': { $regex: q, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));

  const [items, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Order.countDocuments(filter),
  ]);

  res.json({ items, pagination: { page: pageNum, limit: limitNum, total } });
};

exports.getById = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
  res.json(order);
};

exports.updateStatus = async (req, res) => {
  const { status, note } = req.body;
  const allowed = ['pending', 'confirmed', 'shipping', 'completed', 'cancelled'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
  }
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
  order.status = status;
  order.statusHistory.push({ status, note: note || '', at: new Date() });
  await order.save();
  res.json(order);
};
