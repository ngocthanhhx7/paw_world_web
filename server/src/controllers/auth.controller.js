const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

function signToken(admin) {
  return jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu' });
  }

  const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');
  if (!admin || !admin.isActive) {
    return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
  }

  const ok = await admin.comparePassword(password);
  if (!ok) return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });

  const token = signToken(admin);

  res.cookie('paw_admin_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    token,
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
  });
};

exports.me = async (req, res) => {
  res.json({ admin: req.admin });
};

exports.logout = async (req, res) => {
  res.clearCookie('paw_admin_token');
  res.json({ message: 'Đã đăng xuất' });
};
