const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    sku: { type: String, trim: true, default: '' },
    shortDescription: { type: String, default: '' },
    description: { type: String, default: '' },

    // Giá
    price: { type: Number, required: true, min: 0 }, // giá gốc
    salePrice: { type: Number, min: 0, default: null }, // giá khuyến mãi (null = không sale)

    // Tồn kho
    stock: { type: Number, default: 0, min: 0 },

    // Hình ảnh: ảnh chính + nhiều ảnh
    image: { type: String, default: '' },
    images: [{ type: String }],

    // Phân loại
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    brand: { type: String, default: '' },

    // Thuộc tính dành cho thức ăn mèo
    weight: { type: String, default: '' }, // ví dụ "1.5kg"
    flavor: { type: String, default: '' }, // ví dụ "Cá ngừ"
    ageRange: { type: String, default: 'all' }, // kitten | adult | senior | all
    foodType: {
      type: String,
      enum: ['wet', 'dry', 'mixed', 'supplement', 'accessory'],
      default: 'dry',
      index: true,
    },
    healthNeeds: [
      {
        type: String,
        enum: ['digestion', 'skin', 'hairball', 'mother'],
      },
    ],
    ingredients: { type: String, default: '' },

    tags: [{ type: String }],

    // Hiển thị
    isFeatured: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    // Metric
    rating: { type: Number, default: 5, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

productSchema.pre('validate', function genSlug(next) {
  if (this.name && (!this.slug || this.isModified('name'))) {
    const base = slugify(this.name, { lower: true, strict: true, locale: 'vi' });
    this.slug = `${base}-${Date.now().toString(36).slice(-4)}`;
  }
  next();
});

productSchema.virtual('finalPrice').get(function finalPrice() {
  return this.salePrice && this.salePrice > 0 ? this.salePrice : this.price;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
