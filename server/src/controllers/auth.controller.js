const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const Admin = require('../models/Admin');
const Customer = require('../models/Customer');
const { sendMail } = require('../config/mail');

const googleOAuthClient = new OAuth2Client();
let googleVerifierForTest = null;

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

async function verifyGoogleCredential(credential, audience) {
  if (googleVerifierForTest) {
    return googleVerifierForTest(credential, audience);
  }

  const ticket = await googleOAuthClient.verifyIdToken({
    idToken: credential,
    audience,
  });
  return ticket.getPayload();
}

function normalizeGoogleEmail(email) {
  return String(email || '').toLowerCase().trim();
}

function fallbackGoogleName(email) {
  return normalizeGoogleEmail(email).split('@')[0] || 'PawWorld User';
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
  if (!ok) {
    return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
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
  return res.json({ message: 'Đã đăng xuất' });
};

exports.customerRegister = async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập họ tên, email và mật khẩu' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await Customer.findOne({ email: normalizedEmail });
  if (existing) {
    return res.status(409).json({ message: 'Email này đã được đăng ký' });
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
    return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu' });
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

exports.customerGoogleLogin = async (req, res) => {
  const { credential } = req.body || {};
  if (!credential) {
    return res.status(400).json({ message: 'Thiếu thông tin đăng nhập Google' });
  }

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  if (!googleClientId || googleClientId === 'undefined') {
    return res.status(500).json({ message: 'Đăng nhập Google chưa được cấu hình' });
  }

  let googlePayload;
  try {
    googlePayload = await verifyGoogleCredential(credential, googleClientId);
  } catch (err) {
    return res.status(401).json({ message: 'Đăng nhập Google không hợp lệ' });
  }

  if (!googlePayload?.email_verified) {
    return res.status(401).json({ message: 'Email Google chưa được xác minh' });
  }

  const normalizedEmail = normalizeGoogleEmail(googlePayload.email);
  if (!normalizedEmail) {
    return res.status(401).json({ message: 'Đăng nhập Google không hợp lệ' });
  }

  const now = new Date();
  let customer = await Customer.findOne({ email: normalizedEmail });
  if (customer && !customer.isActive) {
    return res.status(401).json({ message: 'Tài khoản không tồn tại hoặc đã bị khóa' });
  }

  if (!customer) {
    customer = await Customer.create({
      fullName: String(googlePayload.name || '').trim() || fallbackGoogleName(normalizedEmail),
      email: normalizedEmail,
      avatar: googlePayload.picture || '',
      googleSub: googlePayload.sub || '',
      emailVerifiedAt: now,
      lastLoginAt: now,
    });
  } else {
    customer.googleSub = customer.googleSub || googlePayload.sub || '';
    customer.avatar = customer.avatar || googlePayload.picture || '';
    customer.emailVerifiedAt = customer.emailVerifiedAt || now;
    customer.lastLoginAt = now;
    await customer.save();
  }

  const token = signCustomerToken(customer);
  setCustomerCookie(res, token);

  return res.json({ customer: customerPayload(customer) });
};

exports.customerMe = async (req, res) => {
  return res.json({ customer: customerPayload(req.customer) });
};

exports.customerLogout = async (req, res) => {
  res.clearCookie('paw_customer_token');
  return res.json({ message: 'Đã đăng xuất' });
};

exports.customerForgotPassword = async (req, res) => {
  const { email } = req.body;
  const response = { message: 'Nếu email tồn tại, PawWorld sẽ gửi hướng dẫn đặt lại mật khẩu' };

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

  const resetLink = `${process.env.CLIENT_RESET_PASSWORD_URL || ''}/${token}`;
  try {
    await sendMail({
      to: customer.email,
      subject: 'Đặt lại mật khẩu PawWorld',
      html: `<p>Bạn đã yêu cầu đặt lại mật khẩu tại PawWorld.</p><p>Nhấn vào liên kết bên dưới để đặt lại mật khẩu:</p><p><a href="${resetLink}">${resetLink}</a></p><p>Liên kết có hiệu lực trong 30 phút.</p>`,
    });
  } catch (err) {
    console.error('[forgot-password] Failed to send email:', err.message);
  }

  return res.json(response);
};

exports.customerResetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ message: 'Thiếu token hoặc mật khẩu mới' });
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const customer = await Customer.findOne({
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpiresAt: { $gt: new Date() },
  }).select('+password');

  if (!customer) {
    return res.status(400).json({ message: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn' });
  }

  customer.password = password;
  customer.bumpTokenVersion();
  customer.clearPasswordResetToken();
  await customer.save();

  return res.json({ message: 'Đã cập nhật mật khẩu' });
};

exports.__setGoogleVerifierForTest = (verifier) => {
  googleVerifierForTest = verifier;
};

