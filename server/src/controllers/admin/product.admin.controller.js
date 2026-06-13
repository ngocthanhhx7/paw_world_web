const Product = require('../../models/Product');

function buildImageUrl(req, file) {
  if (!file) return null;
  return `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
  return value;
}

function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return value;
  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'on', 'yes'].includes(normalized)) return true;
  if (['false', '0', 'off', 'no', ''].includes(normalized)) return false;
  return value;
}

function normalizeProductData(data) {
  data.tags = normalizeArray(data.tags);
  data.healthNeeds = normalizeArray(data.healthNeeds);

  ['isFeatured', 'isBestSeller', 'isActive', 'isAiComboOnly'].forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(data, field)) data[field] = parseBoolean(data[field]);
  });

  if (data.salePrice === '' || data.salePrice === null) data.salePrice = null;
  if (data.foodType === '') data.foodType = 'dry';
  if (!data.healthNeeds) data.healthNeeds = [];

  return data;
}

exports.list = async (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (q) filter.name = { $regex: q, $options: 'i' };

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));

  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Product.countDocuments(filter),
  ]);

  res.json({ items, pagination: { page: pageNum, limit: limitNum, total } });
};

exports.normalizeProductData = normalizeProductData;

exports.getById = async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name slug');
  if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
  res.json(product);
};

exports.create = async (req, res) => {
  const data = normalizeProductData({ ...req.body });

  if (req.files?.image?.[0]) {
    data.image = buildImageUrl(req, req.files.image[0]);
  }
  if (req.files?.images?.length) {
    data.images = req.files.images.map((f) => buildImageUrl(req, f));
  }

  const product = await Product.create(data);
  res.status(201).json(product);
};

exports.update = async (req, res) => {
  const data = normalizeProductData({ ...req.body });
  if (req.files?.image?.[0]) {
    data.image = buildImageUrl(req, req.files.image[0]);
  }
  if (req.files?.images?.length) {
    data.images = req.files.images.map((f) => buildImageUrl(req, f));
  }
  // ép null/empty về undefined để không ghi đè
  const product = await Product.findByIdAndUpdate(req.params.id, data, {
    new: true,
    runValidators: true,
  });
  if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
  res.json(product);
};

exports.remove = async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
  res.json({ message: 'Đã xoá sản phẩm' });
};
