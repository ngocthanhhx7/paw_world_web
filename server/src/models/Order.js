const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    image: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderCode: { type: String, required: true, unique: true, index: true },

    // Khách không cần đăng nhập – lưu thông tin liên hệ
    customer: {
      fullName: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      email: { type: String, default: '', trim: true, lowercase: true },
    },

    shippingAddress: {
      address: { type: String, required: true },
      ward: { type: String, default: '' },
      district: { type: String, default: '' },
      province: { type: String, default: '' },
      note: { type: String, default: '' },
    },

    items: { type: [orderItemSchema], required: true },

    paymentMethod: {
      type: String,
      enum: ['cod', 'bank_transfer'],
      default: 'cod',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'pending', 'paid', 'cancelled', 'failed'],
      default: 'unpaid',
    },
    paymentProvider: { type: String, default: '' },
    paymentReference: { type: String, default: '' },
    payosOrderCode: { type: Number, index: true, sparse: true },
    paidAt: { type: Date },
    paymentRaw: { type: mongoose.Schema.Types.Mixed },

    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    packagingFee: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipping', 'completed', 'cancelled'],
      default: 'pending',
    },
    statusHistory: [
      {
        status: String,
        note: String,
        at: { type: Date, default: Date.now },
      },
    ],

    cartId: { type: String, default: '' }, // tham chiếu cookie cart đã tạo đơn
  },
  { timestamps: true },
);

module.exports = mongoose.model('Order', orderSchema);
