const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

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
      return res.status(401).json({ message: 'Tài khoản admin không tồn tại hoặc đã bị khoá' });
    }

    req.admin = admin;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
}

module.exports = { requireAdmin };
