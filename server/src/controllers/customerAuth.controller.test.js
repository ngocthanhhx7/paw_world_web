const assert = require('node:assert/strict');
const crypto = require('crypto');
const test = require('node:test');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const Customer = require('../models/Customer');
const authController = require('./auth.controller');
const { requireCustomer } = require('../middlewares/auth');

function createMockRes() {
  return {
    statusCode: 200,
    body: null,
    cookies: [],
    clearedCookies: [],
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    cookie(name, value, options) {
      this.cookies.push({ name, value, options });
      return this;
    },
    clearCookie(name, options) {
      this.clearedCookies.push({ name, options });
      return this;
    },
  };
}

test('Customer createPasswordResetToken stores only a hash and expiry', () => {
  const customer = new Customer({
    fullName: 'Reset User',
    email: 'reset@example.com',
    password: '12345678',
  });

  const token = customer.createPasswordResetToken();

  assert.equal(typeof token, 'string');
  assert.equal(token.length > 20, true);
  assert.notEqual(customer.resetPasswordTokenHash, token);
  assert.equal(
    customer.resetPasswordTokenHash,
    crypto.createHash('sha256').update(token).digest('hex'),
  );
  assert.ok(customer.resetPasswordExpiresAt instanceof Date);
});

test('customerRegister creates a customer, sets paw_customer_token cookie, and returns customer payload', async () => {
  const req = {
    body: {
      fullName: '  Nguyen Con Sen  ',
      email: '  Sen@Example.com ',
      password: '12345678',
    },
  };
  const res = createMockRes();

  const originalFindOne = Customer.findOne;
  const originalCreate = Customer.create;

  Customer.findOne = async (query) => {
    assert.deepEqual(query, { email: 'sen@example.com' });
    return null;
  };

  Customer.create = async (payload) => ({
    _id: 'customer-1',
    fullName: payload.fullName,
    email: payload.email,
    phone: '',
    avatar: '',
  });

  try {
    await authController.customerRegister(req, res);
  } finally {
    Customer.findOne = originalFindOne;
    Customer.create = originalCreate;
  }

  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.body, {
    customer: {
      id: 'customer-1',
      fullName: 'Nguyen Con Sen',
      email: 'sen@example.com',
      phone: '',
      avatar: '',
    },
  });
  assert.equal(res.cookies.length, 1);
  assert.equal(res.cookies[0].name, 'paw_customer_token');
  assert.equal(res.cookies[0].options.httpOnly, true);
});

test('customerForgotPassword returns a generic response and exposes resetUrl outside production', async () => {
  const req = {
    body: {
      email: 'reset@example.com',
    },
  };
  const res = createMockRes();
  const customer = new Customer({
    fullName: 'Reset User',
    email: 'reset@example.com',
    password: '12345678',
  });

  customer.save = async () => customer;

  const originalNodeEnv = process.env.NODE_ENV;
  const originalFindOne = Customer.findOne;

  process.env.NODE_ENV = 'test';
  Customer.findOne = async (query) => {
    assert.deepEqual(query, { email: 'reset@example.com' });
    return customer;
  };

  try {
    await authController.customerForgotPassword(req, res);
  } finally {
    process.env.NODE_ENV = originalNodeEnv;
    Customer.findOne = originalFindOne;
  }

  assert.equal(
    res.body.message,
    'Neu email ton tai, PawWorld se gui huong dan dat lai mat khau',
  );
  assert.match(res.body.resetUrl, /^\/dat-lai-mat-khau\/[a-f0-9]{64}$/);
  assert.equal(customer.resetPasswordTokenHash.length, 64);
});

test('customerResetPassword hashes the token, clears reset state, and updates the password', async () => {
  const token = 'plain-reset-token';
  const req = {
    body: {
      token,
      password: 'new-password-123',
    },
  };
  const res = createMockRes();
  const customer = new Customer({
    fullName: 'Reset User',
    email: 'reset@example.com',
    password: 'old-password',
  });

  customer.save = async () => customer;

  const originalFindOne = Customer.findOne;
  Customer.findOne = (query) => {
    assert.equal(
      query.resetPasswordTokenHash,
      crypto.createHash('sha256').update(token).digest('hex'),
    );
    assert.ok(query.resetPasswordExpiresAt.$gt instanceof Date);
    return {
      select: async (selection) => {
        assert.equal(selection, '+password');
        return customer;
      },
    };
  };

  try {
    await authController.customerResetPassword(req, res);
  } finally {
    Customer.findOne = originalFindOne;
  }

  assert.equal(customer.password, 'new-password-123');
  assert.equal(customer.resetPasswordTokenHash, '');
  assert.equal(customer.resetPasswordExpiresAt, null);
  assert.deepEqual(res.body, { message: 'Da cap nhat mat khau' });
});

test('requireCustomer reads paw_customer_token cookie and attaches req.customer', async () => {
  const req = {
    cookies: { paw_customer_token: 'signed-token' },
  };
  const res = createMockRes();
  let nextCalled = false;

  const jwt = require('jsonwebtoken');
  const originalVerify = jwt.verify;
  const originalFindById = Customer.findById;

  jwt.verify = (token, secret) => {
    assert.equal(token, 'signed-token');
    assert.equal(secret, process.env.JWT_SECRET);
    return { id: 'customer-1', type: 'customer' };
  };

  Customer.findById = (id) => {
    assert.equal(id, 'customer-1');
    return {
      select: async (selection) => {
        assert.equal(selection, '-password');
        return { _id: 'customer-1', fullName: 'Sen', isActive: true };
      },
    };
  };

  try {
    await requireCustomer(req, res, () => {
      nextCalled = true;
    });
  } finally {
    jwt.verify = originalVerify;
    Customer.findById = originalFindById;
  }

  assert.equal(nextCalled, true);
  assert.deepEqual(req.customer, { _id: 'customer-1', fullName: 'Sen', isActive: true });
});
