const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    image: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false },
);

const cartSchema = new mongoose.Schema(
  {
    cartId: { type: String, required: true, unique: true, index: true },
    items: [cartItemSchema],
    expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }, // 30 ngày
  },
  { timestamps: true },
);

cartSchema.virtual('totalQuantity').get(function totalQuantity() {
  return this.items.reduce((sum, it) => sum + it.quantity, 0);
});

cartSchema.virtual('subtotal').get(function subtotal() {
  return this.items.reduce((sum, it) => sum + it.price * it.quantity, 0);
});

cartSchema.set('toJSON', { virtuals: true });
cartSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Cart', cartSchema);
