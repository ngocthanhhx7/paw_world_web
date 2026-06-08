const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Customer = require('../models/Customer');

function signToken(admin) {
  return jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function signCustomerToken(customer) {
  return jwt.sign(
    { id: customer._id, type: 'customer', tokenVersion: customer.tokenVersion || 0 },
    process.env.JWT_SECRET,
    {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
  );
}

function customerPayload(customer) {
  return {
    id: customer._id,
    fullName: customer.fullName,
    email: customer.email,
    phone: customer.phone || '',
    avatar: customer.avatar || '',
  };
}

function setCustomerCookie(res, token) {
  res.cookie('paw_customer_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Vui long nhap email va mat khau' });
  }

  const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');
  if (!admin || !admin.isActive) {
    return res.status(401).json({ message: 'Email hoac mat khau khong dung' });
  }

  const ok = await admin.comparePassword(password);
  if (!ok) {
    return res.status(401).json({ message: 'Email hoac mat khau khong dung' });
  }

  const token = signToken(admin);

  res.cookie('paw_admin_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.json({
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
  return res.json({ admin: req.admin });
};

exports.logout = async (req, res) => {
  res.clearCookie('paw_admin_token');
  return res.json({ message: 'Da dang xuat' });
};

exports.customerRegister = async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'Vui long nhap ho ten, email va mat khau' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await Customer.findOne({ email: normalizedEmail });
  if (existing) {
    return res.status(409).json({ message: 'Email nay da duoc dang ky' });
  }

  const customer = await Customer.create({
    fullName: fullName.trim(),
    email: normalizedEmail,
    password,
  });

  const token = signCustomerToken(customer);
  setCustomerCookie(res, token);

  return res.status(201).json({ customer: customerPayload(customer) });
};

exports.customerLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Vui long nhap email va mat khau' });
  }

  const customer = await Customer.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!customer || !customer.isActive) {
    return res.status(401).json({ message: 'Email hoac mat khau khong dung' });
  }

  const ok = await customer.comparePassword(password);
  if (!ok) {
    return res.status(401).json({ message: 'Email hoac mat khau khong dung' });
  }

  customer.lastLoginAt = new Date();
  await customer.save();

  const token = signCustomerToken(customer);
  setCustomerCookie(res, token);

  return res.json({ customer: customerPayload(customer) });
};

exports.customerMe = async (req, res) => {
  return res.json({ customer: customerPayload(req.customer) });
};

exports.customerLogout = async (req, res) => {
  res.clearCookie('paw_customer_token');
  return res.json({ message: 'Da dang xuat' });
};

exports.customerForgotPassword = async (req, res) => {
  const { email } = req.body;
  const response = { message: 'Neu email ton tai, PawWorld se gui huong dan dat lai mat khau' };

  if (!email) {
    return res.json(response);
  }

  const customer = await Customer.findOne({ email: email.toLowerCase().trim() });
  if (!customer) {
    return res.json(response);
  }

  const token = customer.createPasswordResetToken();
  await customer.save();

  if (process.env.NODE_ENV !== 'production') {
    return res.json({ ...response, resetUrl: `/dat-lai-mat-khau/${token}` });
  }

  return res.json(response);
};

exports.customerResetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ message: 'Thieu token hoac mat khau moi' });
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const customer = await Customer.findOne({
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpiresAt: { $gt: new Date() },
  }).select('+password');

  if (!customer) {
    return res.status(400).json({ message: 'Lien ket dat lai mat khau khong hop le hoac da het han' });
  }

  customer.password = password;
  customer.bumpTokenVersion();
  customer.clearPasswordResetToken();
  await customer.save();

  return res.json({ message: 'Da cap nhat mat khau' });
};
