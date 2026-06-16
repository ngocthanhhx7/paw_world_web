const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const {
  buildPayosOrderCode,
  createPaymentLink,
  getMissingPayosConfig,
  mapPayosWebhookStatus,
  verifyWebhook,
} = require('../services/payos.service');

const PACKAGING_FEE = 5000;

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

  if (!['cod', 'bank_transfer'].includes(paymentMethod)) {
    return res.status(400).json({ message: 'Hình thức thanh toán không hợp lệ' });
  }
  if (!customer?.fullName || !customer?.phone) {
    return res.status(400).json({ message: 'Vui lòng nhập họ tên và số điện thoại' });
  }
  if (!shippingAddress?.address) {
    return res.status(400).json({ message: 'Vui lòng nhập địa chỉ giao hàng' });
  }
  if (paymentMethod === 'bank_transfer') {
    const missingPayosConfig = getMissingPayosConfig();
    if (missingPayosConfig.length) {
      return res.status(503).json({
        message: `Thiếu cấu hình payOS: ${missingPayosConfig.join(', ')}`,
      });
    }
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
  const shippingFee = 0;
  const packagingFee = PACKAGING_FEE;
  const total = subtotal + packagingFee;
  const orderCode = generateOrderCode();
  const payosOrderCode = paymentMethod === 'bank_transfer' ? buildPayosOrderCode(orderCode) : undefined;

  const order = await Order.create({
    orderCode,
    customer,
    shippingAddress,
    items,
    paymentMethod,
    paymentStatus: paymentMethod === 'bank_transfer' ? 'pending' : 'unpaid',
    paymentProvider: paymentMethod === 'bank_transfer' ? 'payos' : '',
    payosOrderCode,
    subtotal,
    shippingFee,
    packagingFee,
    discount: 0,
    total,
    status: 'pending',
    statusHistory: [{ status: 'pending', note: 'Đơn vừa được tạo', at: new Date() }],
    cartId: cartId || '',
  });

  let payment = null;
  if (paymentMethod === 'bank_transfer') {
    payment = await createPaymentLink(order);
    order.paymentReference = payment.paymentLinkId || payment.id || '';
    await order.save();
  }

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

  const responseBody = order.toObject();
  if (payment) {
    responseBody.payment = {
      checkoutUrl: payment.checkoutUrl,
      qrCode: payment.qrCode,
      paymentLinkId: payment.paymentLinkId || payment.id || '',
    };
  }

  res.status(201).json(responseBody);
};

/** GET /api/orders/:code — khách tra cứu theo mã đơn */
exports.getByCode = async (req, res) => {
  const order = await Order.findOne({ orderCode: req.params.code });
  if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
  res.json(order);
};

/** POST /api/orders/payos/webhook — payOS payment status callback */
exports.handlePayosWebhook = async (req, res) => {
  let verified;
  try {
    verified = verifyWebhook(req.body);
  } catch (err) {
    return res.status(400).json({ message: 'Webhook payOS không hợp lệ' });
  }

  const webhookData = verified?.data ? verified : { ...req.body, data: verified };
  const data = webhookData.data || {};
  const payosOrderCode = Number(data.orderCode);
  if (!Number.isSafeInteger(payosOrderCode)) {
    return res.json({ ok: true, ignored: true });
  }

  const order = await Order.findOne({ payosOrderCode });

  if (!order) {
    return res.json({ ok: true, ignored: true });
  }

  const paymentStatus = mapPayosWebhookStatus(webhookData);
  order.paymentStatus = paymentStatus;
  order.paymentProvider = 'payos';
  order.paymentReference = data.paymentLinkId || order.paymentReference || '';
  order.paymentRaw = webhookData;
  if (paymentStatus === 'paid' && !order.paidAt) {
    order.paidAt = new Date();
  }
  await order.save();

  res.json({ ok: true });
};
