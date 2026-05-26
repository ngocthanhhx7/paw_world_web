const mongoose = require('mongoose');

/**
 * Lead = Khách hàng "muốn mua" để lại phương thức liên hệ.
 * Dùng cho các nút "Để lại thông tin liên hệ", "Tư vấn miễn phí" trên web.
 */
const leadSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: '', trim: true, lowercase: true },

    // Sản phẩm hoặc danh mục khách quan tâm (tuỳ chọn)
    interestedProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    productSnapshot: {
      name: String,
      image: String,
      price: Number,
    },

    message: { type: String, default: '' },
    source: { type: String, default: 'website' }, // ví dụ: product-detail, home-banner

    status: {
      type: String,
      enum: ['new', 'contacting', 'done', 'lost'],
      default: 'new',
    },
    note: { type: String, default: '' },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Lead', leadSchema);
