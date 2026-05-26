const Category = require('../models/Category');

exports.list = async (req, res) => {
  const items = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
  res.json({ items });
};

exports.getBySlug = async (req, res) => {
  const cat = await Category.findOne({ slug: req.params.slug, isActive: true });
  if (!cat) return res.status(404).json({ message: 'Danh mục không tồn tại' });
  res.json(cat);
};
