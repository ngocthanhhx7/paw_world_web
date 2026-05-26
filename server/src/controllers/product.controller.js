const Product = require('../models/Product');

/**
 * GET /api/products
 * query: q, category (slug or id), brand, minPrice, maxPrice,
 *        sort (newest|price_asc|price_desc|best_seller),
 *        page, limit
 */
exports.list = async (req, res) => {
  const {
    q,
    category,
    brand,
    minPrice,
    maxPrice,
    sort = 'newest',
    featured,
    bestSeller,
    ageRange,
    foodType,
    healthNeed,
    page = 1,
    limit = 12,
  } = req.query;

  const filter = { isActive: true };
  if (q) filter.name = { $regex: q, $options: 'i' };
  if (brand) filter.brand = brand;
  if (featured === 'true') filter.isFeatured = true;
  if (bestSeller === 'true') filter.isBestSeller = true;
  if (ageRange) filter.ageRange = ageRange;
  if (foodType) {
    filter.foodType = ['wet', 'dry'].includes(foodType) ? { $in: [foodType, 'mixed'] } : foodType;
  }
  if (healthNeed) filter.healthNeeds = healthNeed;

  if (category) {
    if (category.match(/^[0-9a-fA-F]{24}$/)) {
      filter.category = category;
    } else {
      const Category = require('../models/Category');
      const cat = await Category.findOne({ slug: category });
      if (cat) filter.category = cat._id;
      else filter.category = null;
    }
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const sortMap = {
    newest: { createdAt: -1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    best_seller: { soldCount: -1 },
  };

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(60, Math.max(1, Number(limit)));

  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .sort(sortMap[sort] || sortMap.newest)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Product.countDocuments(filter),
  ]);

  res.json({
    items,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
};

exports.getBySlug = async (req, res) => {
  const product = await Product.findOneAndUpdate(
    { slug: req.params.slug, isActive: true },
    { $inc: { viewCount: 1 } },
    { new: true },
  ).populate('category', 'name slug');

  if (!product) return res.status(404).json({ message: 'Sản phẩm không tồn tại' });

  // Sản phẩm liên quan cùng category
  const related = await Product.find({
    _id: { $ne: product._id },
    category: product.category?._id,
    isActive: true,
  })
    .limit(8)
    .populate('category', 'name slug');

  res.json({ product, related });
};
