const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

function generateOrderCode() {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
    date.getDate(),
  ).padStart(2, '0')}`;
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `PW${ymd}${rand}`;
}

/**
 * POST /api/orders
 * body: { customer, shippingAddress, paymentMethod, items? }
 * - Nếu có cookie cart -> dùng cart đó để tạo order
 * - items optional: cho phép "Mua ngay" không qua cart
 */
exports.create = async (req, res) => {
  const { customer, shippingAddress, paymentMethod = 'cod', items: directItems } = req.body;

  if (!customer?.fullName || !customer?.phone) {
    return res.status(400).json({ message: 'Vui lòng nhập họ tên và số điện thoại' });
  }
  if (!shippingAddress?.address) {
    return res.status(400).json({ message: 'Vui lòng nhập địa chỉ giao hàng' });
  }

  const cartId = req.cookies?.paw_cart_id || req.headers['x-cart-id'];
  let sourceItems = directItems;

  if ((!sourceItems || !sourceItems.length) && cartId) {
    const cart = await Cart.findOne({ cartId });
    if (cart && cart.items.length) sourceItems = cart.items;
  }

  if (!sourceItems || !sourceItems.length) {
    return res.status(400).json({ message: 'Giỏ hàng đang trống' });
  }

  // Re-validate price từ DB để chống bypass giá
  const productIds = sourceItems.map((it) => it.product || it.productId);
  const products = await Product.find({ _id: { $in: productIds }, isActive: true });
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  const items = [];
  for (const raw of sourceItems) {
    const pid = String(raw.product || raw.productId);
    const p = productMap.get(pid);
    if (!p) continue;
    const qty = Math.max(1, Number(raw.quantity || 1));
    items.push({
      product: p._id,
      name: p.name,
      image: p.image,
      price: p.salePrice || p.price,
      quantity: qty,
    });
  }
  if (!items.length) return res.status(400).json({ message: 'Không có sản phẩm hợp lệ trong đơn' });

  const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
  const shippingFee = subtotal >= 500000 ? 0 : 25000; // miễn ship đơn >= 500k
  const total = subtotal + shippingFee;

  const order = await Order.create({
    orderCode: generateOrderCode(),
    customer,
    shippingAddress,
    items,
    paymentMethod,
    subtotal,
    shippingFee,
    discount: 0,
    total,
    status: 'pending',
    statusHistory: [{ status: 'pending', note: 'Đơn vừa được tạo', at: new Date() }],
    cartId: cartId || '',
  });

  // Cập nhật soldCount + giảm tồn kho (best-effort)
  await Promise.all(
    items.map((it) =>
      Product.updateOne(
        { _id: it.product },
        { $inc: { soldCount: it.quantity, stock: -it.quantity } },
      ),
    ),
  );

  // Xoá cart sau khi đặt thành công
  if (cartId) {
    await Cart.updateOne({ cartId }, { $set: { items: [] } });
  }

  res.status(201).json(order);
};

/** GET /api/orders/:code — khách tra cứu theo mã đơn */
exports.getByCode = async (req, res) => {
  const order = await Order.findOne({ orderCode: req.params.code });
  if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
  res.json(order);
};
