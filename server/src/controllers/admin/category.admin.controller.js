const Category = require('../../models/Category');
const Product = require('../../models/Product');

exports.list = async (req, res) => {
  const items = await Category.find().sort({ sortOrder: 1, name: 1 });
  res.json({ items });
};

exports.create = async (req, res) => {
  const cat = await Category.create(req.body);
  res.status(201).json(cat);
};

exports.update = async (req, res) => {
  const cat = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!cat) return res.status(404).json({ message: 'Không tìm thấy danh mục' });
  res.json(cat);
};

exports.remove = async (req, res) => {
  const inUse = await Product.countDocuments({ category: req.params.id });
  if (inUse > 0) {
    return res.status(400).json({
      message: `Đang có ${inUse} sản phẩm thuộc danh mục này, vui lòng chuyển danh mục trước khi xoá.`,
    });
  }
  const cat = await Category.findByIdAndDelete(req.params.id);
  if (!cat) return res.status(404).json({ message: 'Không tìm thấy danh mục' });
  res.json({ message: 'Đã xoá danh mục' });
};
