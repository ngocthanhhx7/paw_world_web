const assert = require('node:assert/strict');
const crypto = require('crypto');
const test = require('node:test');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const Customer = require('../models/Customer');
const authController = require('./auth.controller');
const { requireCustomer, requireSameOriginJson } = require('../middlewares/auth');

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

test('customerGoogleLogin rejects missing credential', async () => {
  const req = { body: {} };
  const res = createMockRes();

  await authController.customerGoogleLogin(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { message: 'Thieu thong tin dang nhap Google' });
});

test('customerGoogleLogin reports missing server Google client id', async () => {
  const req = { body: { credential: 'google-credential' } };
  const res = createMockRes();
  const originalClientId = process.env.GOOGLE_CLIENT_ID;

  delete process.env.GOOGLE_CLIENT_ID;

  try {
    await authController.customerGoogleLogin(req, res);
  } finally {
    process.env.GOOGLE_CLIENT_ID = originalClientId;
  }

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { message: 'Dang nhap Google chua duoc cau hinh' });
});

test('customerGoogleLogin rejects invalid Google credential', async () => {
  const req = { body: { credential: 'bad-google-credential' } };
  const res = createMockRes();
  const originalClientId = process.env.GOOGLE_CLIENT_ID;

  process.env.GOOGLE_CLIENT_ID = 'google-client-id';
  authController.__setGoogleVerifierForTest(async () => {
    throw new Error('invalid token');
  });

  try {
    await authController.customerGoogleLogin(req, res);
  } finally {
    process.env.GOOGLE_CLIENT_ID = originalClientId;
    authController.__setGoogleVerifierForTest(null);
  }

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { message: 'Dang nhap Google khong hop le' });
});

test('customerGoogleLogin rejects unverified Google email', async () => {
  const req = { body: { credential: 'google-credential' } };
  const res = createMockRes();
  const originalClientId = process.env.GOOGLE_CLIENT_ID;

  process.env.GOOGLE_CLIENT_ID = 'google-client-id';
  authController.__setGoogleVerifierForTest(async () => ({
    sub: 'google-sub-1',
    email: 'sen@example.com',
    email_verified: false,
    name: 'Sen Google',
    picture: 'https://example.com/avatar.png',
  }));

  try {
    await authController.customerGoogleLogin(req, res);
  } finally {
    process.env.GOOGLE_CLIENT_ID = originalClientId;
    authController.__setGoogleVerifierForTest(null);
  }

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { message: 'Email Google chua duoc xac minh' });
});

test('customerGoogleLogin creates a customer for a verified new Google email', async () => {
  const req = { body: { credential: 'google-credential' } };
  const res = createMockRes();
  const originalClientId = process.env.GOOGLE_CLIENT_ID;
  const originalFindOne = Customer.findOne;
  const originalCreate = Customer.create;

  process.env.GOOGLE_CLIENT_ID = 'google-client-id';
  authController.__setGoogleVerifierForTest(async (credential, audience) => {
    assert.equal(credential, 'google-credential');
    assert.equal(audience, 'google-client-id');
    return {
      sub: 'google-sub-1',
      email: ' Sen@Example.com ',
      email_verified: true,
      name: 'Sen Google',
      picture: 'https://example.com/avatar.png',
    };
  });

  Customer.findOne = async (query) => {
    assert.deepEqual(query, { email: 'sen@example.com' });
    return null;
  };

  Customer.create = async (payload) => {
    assert.equal(payload.fullName, 'Sen Google');
    assert.equal(payload.email, 'sen@example.com');
    assert.equal(payload.googleSub, 'google-sub-1');
    assert.equal(payload.avatar, 'https://example.com/avatar.png');
    assert.ok(payload.emailVerifiedAt instanceof Date);
    assert.ok(payload.lastLoginAt instanceof Date);
    assert.equal(Object.hasOwn(payload, 'password'), false);
    return { _id: 'customer-google-1', phone: '', tokenVersion: 0, ...payload };
  };

  try {
    await authController.customerGoogleLogin(req, res);
  } finally {
    process.env.GOOGLE_CLIENT_ID = originalClientId;
    Customer.findOne = originalFindOne;
    Customer.create = originalCreate;
    authController.__setGoogleVerifierForTest(null);
  }

  assert.equal(res.statusCode, 200);
  assert.equal(res.cookies[0].name, 'paw_customer_token');
  assert.deepEqual(res.body.customer, {
    id: 'customer-google-1',
    fullName: 'Sen Google',
    email: 'sen@example.com',
    phone: '',
    avatar: 'https://example.com/avatar.png',
  });
});

test('customerGoogleLogin links and logs in an existing customer without changing password', async () => {
  const req = { body: { credential: 'google-credential' } };
  const res = createMockRes();
  const originalClientId = process.env.GOOGLE_CLIENT_ID;
  const originalFindOne = Customer.findOne;
  const customer = {
    _id: 'existing-customer-1',
    fullName: 'Existing Sen',
    email: 'sen@example.com',
    password: 'hashed-password',
    phone: '',
    avatar: '',
    isActive: true,
    tokenVersion: 2,
    googleSub: '',
    emailVerifiedAt: null,
    lastLoginAt: null,
    saveCalls: 0,
    async save() {
      this.saveCalls += 1;
      return this;
    },
  };

  process.env.GOOGLE_CLIENT_ID = 'google-client-id';
  authController.__setGoogleVerifierForTest(async () => ({
    sub: 'google-sub-1',
    email: 'sen@example.com',
    email_verified: true,
    name: 'Sen Google',
    picture: 'https://example.com/avatar.png',
  }));

  Customer.findOne = async (query) => {
    assert.deepEqual(query, { email: 'sen@example.com' });
    return customer;
  };

  try {
    await authController.customerGoogleLogin(req, res);
  } finally {
    process.env.GOOGLE_CLIENT_ID = originalClientId;
    Customer.findOne = originalFindOne;
    authController.__setGoogleVerifierForTest(null);
  }

  assert.equal(customer.password, 'hashed-password');
  assert.equal(customer.googleSub, 'google-sub-1');
  assert.equal(customer.avatar, 'https://example.com/avatar.png');
  assert.ok(customer.emailVerifiedAt instanceof Date);
  assert.ok(customer.lastLoginAt instanceof Date);
  assert.equal(customer.saveCalls, 1);
  assert.equal(res.cookies[0].name, 'paw_customer_token');
  assert.equal(res.body.customer.id, 'existing-customer-1');
});

test('customerFacebookLogin rejects missing access token', async () => {
  const req = { body: {} };
  const res = createMockRes();

  await authController.customerFacebookLogin(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { message: 'Thieu thong tin dang nhap Facebook' });
});

test('customerFacebookLogin reports missing Facebook config', async () => {
  const req = { body: { accessToken: 'facebook-token' } };
  const res = createMockRes();
  const originalAppId = process.env.FACEBOOK_APP_ID;
  const originalAppSecret = process.env.FACEBOOK_APP_SECRET;

  delete process.env.FACEBOOK_APP_ID;
  delete process.env.FACEBOOK_APP_SECRET;

  try {
    await authController.customerFacebookLogin(req, res);
  } finally {
    process.env.FACEBOOK_APP_ID = originalAppId;
    process.env.FACEBOOK_APP_SECRET = originalAppSecret;
  }

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { message: 'Dang nhap Facebook chua duoc cau hinh' });
});

test('customerFacebookLogin rejects invalid Facebook access token', async () => {
  const req = { body: { accessToken: 'bad-facebook-token' } };
  const res = createMockRes();
  const originalAppId = process.env.FACEBOOK_APP_ID;
  const originalAppSecret = process.env.FACEBOOK_APP_SECRET;

  process.env.FACEBOOK_APP_ID = 'facebook-app-id';
  process.env.FACEBOOK_APP_SECRET = 'facebook-app-secret';
  authController.__setFacebookVerifierForTest(async () => ({
    isValid: false,
    appId: 'facebook-app-id',
    userId: 'facebook-user-1',
  }));

  try {
    await authController.customerFacebookLogin(req, res);
  } finally {
    process.env.FACEBOOK_APP_ID = originalAppId;
    process.env.FACEBOOK_APP_SECRET = originalAppSecret;
    authController.__setFacebookVerifierForTest(null);
  }

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { message: 'Dang nhap Facebook khong hop le' });
});

test('customerFacebookLogin rejects Facebook token from another app', async () => {
  const req = { body: { accessToken: 'facebook-token' } };
  const res = createMockRes();
  const originalAppId = process.env.FACEBOOK_APP_ID;
  const originalAppSecret = process.env.FACEBOOK_APP_SECRET;

  process.env.FACEBOOK_APP_ID = 'facebook-app-id';
  process.env.FACEBOOK_APP_SECRET = 'facebook-app-secret';
  authController.__setFacebookVerifierForTest(async () => ({
    isValid: true,
    appId: 'another-app-id',
    userId: 'facebook-user-1',
  }));

  try {
    await authController.customerFacebookLogin(req, res);
  } finally {
    process.env.FACEBOOK_APP_ID = originalAppId;
    process.env.FACEBOOK_APP_SECRET = originalAppSecret;
    authController.__setFacebookVerifierForTest(null);
  }

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { message: 'Dang nhap Facebook khong hop le' });
});

test('customerFacebookLogin rejects Facebook profile without email', async () => {
  const req = { body: { accessToken: 'facebook-token' } };
  const res = createMockRes();
  const originalAppId = process.env.FACEBOOK_APP_ID;
  const originalAppSecret = process.env.FACEBOOK_APP_SECRET;

  process.env.FACEBOOK_APP_ID = 'facebook-app-id';
  process.env.FACEBOOK_APP_SECRET = 'facebook-app-secret';
  authController.__setFacebookVerifierForTest(async () => ({
    isValid: true,
    appId: 'facebook-app-id',
    userId: 'facebook-user-1',
  }));
  authController.__setFacebookProfileFetcherForTest(async () => ({
    id: 'facebook-user-1',
    name: 'Sen Facebook',
  }));

  try {
    await authController.customerFacebookLogin(req, res);
  } finally {
    process.env.FACEBOOK_APP_ID = originalAppId;
    process.env.FACEBOOK_APP_SECRET = originalAppSecret;
    authController.__setFacebookVerifierForTest(null);
    authController.__setFacebookProfileFetcherForTest(null);
  }

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { message: 'Tai khoan Facebook chua cung cap email' });
});

test('customerFacebookLogin creates a customer for a valid Facebook profile', async () => {
  const req = { body: { accessToken: 'facebook-token' } };
  const res = createMockRes();
  const originalAppId = process.env.FACEBOOK_APP_ID;
  const originalAppSecret = process.env.FACEBOOK_APP_SECRET;
  const originalFindOne = Customer.findOne;
  const originalCreate = Customer.create;

  process.env.FACEBOOK_APP_ID = 'facebook-app-id';
  process.env.FACEBOOK_APP_SECRET = 'facebook-app-secret';
  authController.__setFacebookVerifierForTest(async (accessToken, appId, appSecret) => {
    assert.equal(accessToken, 'facebook-token');
    assert.equal(appId, 'facebook-app-id');
    assert.equal(appSecret, 'facebook-app-secret');
    return {
      isValid: true,
      appId: 'facebook-app-id',
      userId: 'facebook-user-1',
    };
  });
  authController.__setFacebookProfileFetcherForTest(async (accessToken) => {
    assert.equal(accessToken, 'facebook-token');
    return {
      id: 'facebook-user-1',
      email: ' Sen.Facebook@Example.com ',
      name: 'Sen Facebook',
      picture: { data: { url: 'https://example.com/facebook-avatar.png' } },
    };
  });

  Customer.findOne = async (query) => {
    assert.deepEqual(query, { email: 'sen.facebook@example.com' });
    return null;
  };

  Customer.create = async (payload) => {
    assert.equal(payload.fullName, 'Sen Facebook');
    assert.equal(payload.email, 'sen.facebook@example.com');
    assert.equal(payload.facebookSub, 'facebook-user-1');
    assert.equal(payload.avatar, 'https://example.com/facebook-avatar.png');
    assert.ok(payload.emailVerifiedAt instanceof Date);
    assert.ok(payload.lastLoginAt instanceof Date);
    assert.equal(Object.hasOwn(payload, 'password'), false);
    return { _id: 'customer-facebook-1', phone: '', tokenVersion: 0, ...payload };
  };

  try {
    await authController.customerFacebookLogin(req, res);
  } finally {
    process.env.FACEBOOK_APP_ID = originalAppId;
    process.env.FACEBOOK_APP_SECRET = originalAppSecret;
    Customer.findOne = originalFindOne;
    Customer.create = originalCreate;
    authController.__setFacebookVerifierForTest(null);
    authController.__setFacebookProfileFetcherForTest(null);
  }

  assert.equal(res.statusCode, 200);
  assert.equal(res.cookies[0].name, 'paw_customer_token');
  assert.deepEqual(res.body.customer, {
    id: 'customer-facebook-1',
    fullName: 'Sen Facebook',
    email: 'sen.facebook@example.com',
    phone: '',
    avatar: 'https://example.com/facebook-avatar.png',
  });
});

test('customerFacebookLogin links and logs in an existing customer without changing password', async () => {
  const req = { body: { accessToken: 'facebook-token' } };
  const res = createMockRes();
  const originalAppId = process.env.FACEBOOK_APP_ID;
  const originalAppSecret = process.env.FACEBOOK_APP_SECRET;
  const originalFindOne = Customer.findOne;
  const customer = {
    _id: 'existing-facebook-customer-1',
    fullName: 'Existing Facebook Sen',
    email: 'sen@example.com',
    password: 'hashed-password',
    phone: '',
    avatar: '',
    isActive: true,
    tokenVersion: 2,
    facebookSub: '',
    emailVerifiedAt: null,
    lastLoginAt: null,
    saveCalls: 0,
    async save() {
      this.saveCalls += 1;
      return this;
    },
  };

  process.env.FACEBOOK_APP_ID = 'facebook-app-id';
  process.env.FACEBOOK_APP_SECRET = 'facebook-app-secret';
  authController.__setFacebookVerifierForTest(async () => ({
    isValid: true,
    appId: 'facebook-app-id',
    userId: 'facebook-user-1',
  }));
  authController.__setFacebookProfileFetcherForTest(async () => ({
    id: 'facebook-user-1',
    email: 'sen@example.com',
    name: 'Sen Facebook',
    picture: { data: { url: 'https://example.com/facebook-avatar.png' } },
  }));

  Customer.findOne = async (query) => {
    assert.deepEqual(query, { email: 'sen@example.com' });
    return customer;
  };

  try {
    await authController.customerFacebookLogin(req, res);
  } finally {
    process.env.FACEBOOK_APP_ID = originalAppId;
    process.env.FACEBOOK_APP_SECRET = originalAppSecret;
    Customer.findOne = originalFindOne;
    authController.__setFacebookVerifierForTest(null);
    authController.__setFacebookProfileFetcherForTest(null);
  }

  assert.equal(customer.password, 'hashed-password');
  assert.equal(customer.facebookSub, 'facebook-user-1');
  assert.equal(customer.avatar, 'https://example.com/facebook-avatar.png');
  assert.ok(customer.emailVerifiedAt instanceof Date);
  assert.ok(customer.lastLoginAt instanceof Date);
  assert.equal(customer.saveCalls, 1);
  assert.equal(res.cookies[0].name, 'paw_customer_token');
  assert.equal(res.body.customer.id, 'existing-facebook-customer-1');
});

test('customerFacebookLogin rejects locked existing customer', async () => {
  const req = { body: { accessToken: 'facebook-token' } };
  const res = createMockRes();
  const originalAppId = process.env.FACEBOOK_APP_ID;
  const originalAppSecret = process.env.FACEBOOK_APP_SECRET;
  const originalFindOne = Customer.findOne;

  process.env.FACEBOOK_APP_ID = 'facebook-app-id';
  process.env.FACEBOOK_APP_SECRET = 'facebook-app-secret';
  authController.__setFacebookVerifierForTest(async () => ({
    isValid: true,
    appId: 'facebook-app-id',
    userId: 'facebook-user-1',
  }));
  authController.__setFacebookProfileFetcherForTest(async () => ({
    id: 'facebook-user-1',
    email: 'locked@example.com',
    name: 'Locked Facebook',
  }));

  Customer.findOne = async () => ({
    _id: 'locked-customer-1',
    email: 'locked@example.com',
    isActive: false,
  });

  try {
    await authController.customerFacebookLogin(req, res);
  } finally {
    process.env.FACEBOOK_APP_ID = originalAppId;
    process.env.FACEBOOK_APP_SECRET = originalAppSecret;
    Customer.findOne = originalFindOne;
    authController.__setFacebookVerifierForTest(null);
    authController.__setFacebookProfileFetcherForTest(null);
  }

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { message: 'Tai khoan khong ton tai hoac da bi khoa' });
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
    tokenVersion: 2,
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
  assert.equal(customer.tokenVersion, 3);
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
    return { id: 'customer-1', type: 'customer', tokenVersion: 4 };
  };

  Customer.findById = (id) => {
    assert.equal(id, 'customer-1');
    return {
      select: async (selection) => {
        assert.equal(selection, '-password');
        return { _id: 'customer-1', fullName: 'Sen', isActive: true, tokenVersion: 4 };
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
  assert.deepEqual(req.customer, { _id: 'customer-1', fullName: 'Sen', isActive: true, tokenVersion: 4 });
});

test('requireCustomer rejects stale customer tokens after tokenVersion changes', async () => {
  const req = {
    cookies: { paw_customer_token: 'signed-token' },
  };
  const res = createMockRes();

  const jwt = require('jsonwebtoken');
  const originalVerify = jwt.verify;
  const originalFindById = Customer.findById;

  jwt.verify = () => ({ id: 'customer-1', type: 'customer', tokenVersion: 1 });

  Customer.findById = () => ({
    select: async () => ({ _id: 'customer-1', isActive: true, tokenVersion: 2 }),
  });

  try {
    await requireCustomer(req, res, () => {
      throw new Error('next should not be called');
    });
  } finally {
    jwt.verify = originalVerify;
    Customer.findById = originalFindById;
  }

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { message: 'Token khong hop le hoac da het han' });
});

test('requireSameOriginJson rejects non-json customer auth requests', () => {
  const req = {
    is: () => false,
    get: () => 'http://localhost:5173',
  };
  const res = createMockRes();

  requireSameOriginJson(req, res, () => {
    throw new Error('next should not be called');
  });

  assert.equal(res.statusCode, 415);
  assert.deepEqual(res.body, { message: 'Yeu cau phai su dung JSON' });
});

test('requireSameOriginJson rejects disallowed origins', () => {
  const req = {
    is: (type) => type === 'application/json',
    get: () => 'https://evil.example',
  };
  const res = createMockRes();

  requireSameOriginJson(req, res, () => {
    throw new Error('next should not be called');
  });

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { message: 'Nguon yeu cau khong hop le' });
});

test('requireSameOriginJson accepts allowed json requests', () => {
  const req = {
    is: (type) => type === 'application/json',
    get: () => 'http://localhost:5173',
  };
  const res = createMockRes();
  let nextCalled = false;

  requireSameOriginJson(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
});
