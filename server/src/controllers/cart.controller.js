const crypto = require('crypto');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

const CART_COOKIE = 'paw_cart_id';
const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

function ensureCartId(req, res) {
  let cartId = req.cookies?.[CART_COOKIE] || req.headers['x-cart-id'];
  if (!cartId) {
    cartId = crypto.randomBytes(16).toString('hex');
  }
  res.cookie(CART_COOKIE, cartId, {
    httpOnly: false, // client cũng cần đọc nếu muốn
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  return cartId;
}

async function getOrCreateCart(cartId) {
  let cart = await Cart.findOne({ cartId });
  if (!cart) cart = await Cart.create({ cartId, items: [] });
  return cart;
}

exports.getCart = async (req, res) => {
  const cartId = ensureCartId(req, res);
  const cart = await getOrCreateCart(cartId);
  res.json(cart);
};

exports.addItem = async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  if (!productId) return res.status(400).json({ message: 'Thiếu productId' });

  const product = await Product.findById(productId);
  if (!product || !product.isActive || product.isAiComboOnly) {
    return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
  }

  const cartId = ensureCartId(req, res);
  const cart = await getOrCreateCart(cartId);

  const qty = Math.max(1, Number(quantity));
  const existing = cart.items.find((it) => String(it.product) === String(product._id));
  if (existing) {
    existing.quantity += qty;
  } else {
    cart.items.push({
      product: product._id,
      name: product.name,
      image: product.image,
      price: product.salePrice || product.price,
      quantity: qty,
    });
  }
  await cart.save();
  res.json(cart);
};

exports.addComboItems = async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  if (!items.length) return res.status(400).json({ message: 'items must include at least one productId' });

  const quantitiesByProductId = new Map();
  for (const item of items) {
    const productId = item?.productId;
    if (typeof productId !== 'string' || !OBJECT_ID_RE.test(productId)) {
      return res.status(400).json({ message: 'Invalid productId in combo items' });
    }
    const parsedQuantity = Number(item.quantity);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({ message: 'Invalid quantity in combo items' });
    }
    const quantity = Math.max(1, parsedQuantity);
    quantitiesByProductId.set(productId, (quantitiesByProductId.get(productId) || 0) + quantity);
  }

  const productIds = [...quantitiesByProductId.keys()];
  const products = await Product.find({ _id: { $in: productIds }, isActive: true });
  if (products.length !== productIds.length) {
    return res.status(404).json({ message: 'Sáº£n pháº©m khÃ´ng tá»“n táº¡i' });
  }

  const cartId = ensureCartId(req, res);
  const cart = await getOrCreateCart(cartId);

  products.forEach((product) => {
    const qty = quantitiesByProductId.get(String(product._id));
    const existing = cart.items.find((it) => String(it.product) === String(product._id));
    if (existing) {
      existing.quantity += qty;
    } else {
      cart.items.push({
        product: product._id,
        name: product.name,
        image: product.image,
        price: product.salePrice || product.price,
        quantity: qty,
      });
    }
  });

  await cart.save();
  return res.json(cart);
};

exports.updateItem = async (req, res) => {
  const { productId, quantity } = req.body;
  const cartId = ensureCartId(req, res);
  const cart = await getOrCreateCart(cartId);

  const item = cart.items.find((it) => String(it.product) === String(productId));
  if (!item) return res.status(404).json({ message: 'Sản phẩm không có trong giỏ' });

  const qty = Number(quantity);
  if (qty <= 0) {
    cart.items = cart.items.filter((it) => String(it.product) !== String(productId));
  } else {
    item.quantity = qty;
  }
  await cart.save();
  res.json(cart);
};

exports.removeItem = async (req, res) => {
  const { productId } = req.params;
  const cartId = ensureCartId(req, res);
  const cart = await getOrCreateCart(cartId);
  cart.items = cart.items.filter((it) => String(it.product) !== String(productId));
  await cart.save();
  res.json(cart);
};

exports.clearCart = async (req, res) => {
  const cartId = ensureCartId(req, res);
  const cart = await getOrCreateCart(cartId);
  cart.items = [];
  await cart.save();
  res.json(cart);
};
