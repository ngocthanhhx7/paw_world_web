const Lead = require('../../models/Lead');

exports.list = async (req, res) => {
  const { q, status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (q) {
    filter.$or = [
      { fullName: { $regex: q, $options: 'i' } },
      { phone: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));

  const [items, total] = await Promise.all([
    Lead.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Lead.countDocuments(filter),
  ]);

  res.json({ items, pagination: { page: pageNum, limit: limitNum, total } });
};

exports.update = async (req, res) => {
  const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!lead) return res.status(404).json({ message: 'Không tìm thấy lead' });
  res.json(lead);
};

exports.remove = async (req, res) => {
  const lead = await Lead.findByIdAndDelete(req.params.id);
  if (!lead) return res.status(404).json({ message: 'Không tìm thấy lead' });
  res.json({ message: 'Đã xoá' });
};
