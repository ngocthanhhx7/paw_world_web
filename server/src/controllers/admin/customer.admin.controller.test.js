const assert = require('node:assert/strict');
const test = require('node:test');

const Customer = require('../../models/Customer');
const customerAdmin = require('./customer.admin.controller');

test('buildCustomerFilter supports search, status, and provider filters', () => {
  assert.deepEqual(customerAdmin.buildCustomerFilter({ q: ' sen@example.com ', status: 'locked', provider: 'google' }), {
    $and: [
      {
        $or: [
          { fullName: { $regex: 'sen@example.com', $options: 'i' } },
          { email: { $regex: 'sen@example.com', $options: 'i' } },
          { phone: { $regex: 'sen@example.com', $options: 'i' } },
        ],
      },
      { googleSub: { $exists: true, $nin: ['', null] } },
    ],
    isActive: false,
  });

  assert.deepEqual(customerAdmin.buildCustomerFilter({ status: 'active', provider: 'password' }), {
    isActive: true,
    $and: [{ $or: [{ googleSub: '' }, { googleSub: null }, { googleSub: { $exists: false } }] }],
  });
});

test('buildOrderContactFilter matches normalized email first and phone as fallback', () => {
  assert.deepEqual(
    customerAdmin.buildOrderContactFilter({ email: ' Sen@Example.com ', phone: ' 0909 000 111 ' }),
    {
      $or: [
        { 'customer.email': 'sen@example.com' },
        { 'customer.phone': '0909 000 111' },
      ],
    },
  );
});

test('toCustomerPayload hides sensitive fields and includes commerce summary', () => {
  const payload = customerAdmin.toCustomerPayload(
    {
      _id: 'customer-1',
      fullName: 'Sen',
      email: 'sen@example.com',
      phone: '0909',
      avatar: '',
      googleSub: 'google-sub',
      password: 'secret',
      resetPasswordTokenHash: 'hash',
      resetPasswordExpiresAt: new Date(),
      isActive: true,
      emailVerifiedAt: new Date('2026-06-01T00:00:00.000Z'),
      lastLoginAt: new Date('2026-06-02T00:00:00.000Z'),
      createdAt: new Date('2026-06-03T00:00:00.000Z'),
    },
    { orderCount: 2, totalSpent: 300000, latestOrderAt: new Date('2026-06-04T00:00:00.000Z') },
  );

  assert.deepEqual(payload, {
    id: 'customer-1',
    fullName: 'Sen',
    email: 'sen@example.com',
    phone: '0909',
    avatar: '',
    googleSub: 'google-sub',
    isActive: true,
    emailVerifiedAt: new Date('2026-06-01T00:00:00.000Z'),
    lastLoginAt: new Date('2026-06-02T00:00:00.000Z'),
    createdAt: new Date('2026-06-03T00:00:00.000Z'),
    orderCount: 2,
    totalSpent: 300000,
    latestOrderAt: new Date('2026-06-04T00:00:00.000Z'),
  });
  assert.equal(Object.hasOwn(payload, 'password'), false);
  assert.equal(Object.hasOwn(payload, 'resetPasswordTokenHash'), false);
});

test('summarizeOrders returns commerce totals and recent orders', () => {
  const orders = [
    {
      orderCode: 'PW-2',
      status: 'completed',
      paymentStatus: 'paid',
      total: 250000,
      createdAt: new Date('2026-06-05T00:00:00.000Z'),
    },
    {
      orderCode: 'PW-1',
      status: 'cancelled',
      paymentStatus: 'cancelled',
      total: 100000,
      createdAt: new Date('2026-06-01T00:00:00.000Z'),
    },
  ];

  assert.deepEqual(customerAdmin.summarizeOrders(orders), {
    summary: {
      orderCount: 2,
      completedOrderCount: 1,
      cancelledOrderCount: 1,
      totalSpent: 250000,
      averageOrderValue: 125000,
      latestOrderAt: new Date('2026-06-05T00:00:00.000Z'),
    },
    recentOrders: orders,
  });
});

test('updateStatus locks customers and bumps tokenVersion only when status changes', async () => {
  const originalFindById = Customer.findById;
  const customer = {
    _id: 'customer-1',
    fullName: 'Sen',
    email: 'sen@example.com',
    phone: '',
    avatar: '',
    googleSub: '',
    isActive: true,
    tokenVersion: 2,
    bumpTokenVersion() {
      this.tokenVersion += 1;
    },
    saveCalls: 0,
    async save() {
      this.saveCalls += 1;
      return this;
    },
  };
  Customer.findById = async (id) => {
    assert.equal(id, 'customer-1');
    return customer;
  };

  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };

  try {
    await customerAdmin.updateStatus({ params: { id: 'customer-1' }, body: { isActive: false } }, res);
    assert.equal(customer.isActive, false);
    assert.equal(customer.tokenVersion, 3);
    assert.equal(customer.saveCalls, 1);

    await customerAdmin.updateStatus({ params: { id: 'customer-1' }, body: { isActive: false } }, res);
    assert.equal(customer.tokenVersion, 3);
    assert.equal(customer.saveCalls, 2);
  } finally {
    Customer.findById = originalFindById;
  }
});
