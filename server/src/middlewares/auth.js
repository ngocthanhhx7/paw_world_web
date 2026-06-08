const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Customer = require('../models/Customer');

async function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const tokenFromHeader = header.startsWith('Bearer ') ? header.slice(7) : null;
    const token = tokenFromHeader || req.cookies?.paw_admin_token;

    if (!token) {
      return res.status(401).json({ message: 'Ban can dang nhap voi tai khoan admin' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin || !admin.isActive) {
      return res.status(401).json({ message: 'Tai khoan admin khong ton tai hoac da bi khoa' });
    }

    req.admin = admin;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Token khong hop le hoac da het han' });
  }
}

async function requireCustomer(req, res, next) {
  try {
    const token = req.cookies?.paw_customer_token;

    if (!token) {
      return res.status(401).json({ message: 'Ban can dang nhap de tiep tuc' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'customer') {
      return res.status(401).json({ message: 'Token khong hop le hoac da het han' });
    }

    const customer = await Customer.findById(decoded.id).select('-password');
    if (!customer || !customer.isActive) {
      return res.status(401).json({ message: 'Tai khoan khong ton tai hoac da bi khoa' });
    }

    req.customer = customer;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Token khong hop le hoac da het han' });
  }
}

module.exports = { requireAdmin, requireCustomer };
