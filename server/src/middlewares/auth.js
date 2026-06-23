const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Customer = require('../models/Customer');

async function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const tokenFromHeader = header.startsWith('Bearer ') ? header.slice(7) : null;
    const token = tokenFromHeader || req.cookies?.paw_admin_token;

    if (!token) {
      return res.status(401).json({ message: 'Bạn cần đăng nhập với tài khoản admin' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin || !admin.isActive) {
      return res.status(401).json({ message: 'Tài khoản admin không tồn tại hoặc đã bị khóa' });
    }

    req.admin = admin;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
}

async function requireCustomer(req, res, next) {
  try {
    const token = req.cookies?.paw_customer_token;

    if (!token) {
      return res.status(401).json({ message: 'Bạn cần đăng nhập để tiếp tục' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'customer') {
      return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }

    const customer = await Customer.findById(decoded.id).select('-password');
    if (!customer || !customer.isActive) {
      return res.status(401).json({ message: 'Tài khoản không tồn tại hoặc đã bị khóa' });
    }

    if (Number(decoded.tokenVersion || 0) !== Number(customer.tokenVersion || 0)) {
      return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }

    req.customer = customer;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
}

function requireSameOriginJson(req, res, next) {
  if (!req.is('application/json')) {
    return res.status(415).json({ message: 'Yêu cầu phải sử dụng JSON' });
  }

  const origin = req.get('origin');
  if (!origin) return next();

  const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (!allowedOrigins.includes(origin)) {
    return res.status(403).json({ message: 'Nguồn yêu cầu không hợp lệ' });
  }

  return next();
}

module.exports = { requireAdmin, requireCustomer, requireSameOriginJson };
