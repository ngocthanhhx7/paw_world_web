const assert = require('node:assert/strict');
const test = require('node:test');

const Cart = require('../models/Cart');
const Product = require('../models/Product');
const cartController = require('./cart.controller');

function createRes() {
  return {
    statusCode: 200,
    payload: null,
    cookies: {},
    cookie(name, value) {
      this.cookies[name] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

test('addComboItems rejects null and fallback product ids', async () => {
  for (const productId of [null, 'fallback-dry-digestion']) {
    const res = createRes();

    await cartController.addComboItems({ body: { items: [{ productId, quantity: 1 }] }, cookies: {}, headers: {} }, res);

    assert.equal(res.statusCode, 400);
    assert.match(res.payload.message, /productId/i);
  }
});

test('addComboItems rejects non-numeric quantities before db lookup', async () => {
  const originalFind = Product.find;
  Product.find = async () => {
    throw new Error('database should not be queried for invalid quantities');
  };

  try {
    const res = createRes();
    await cartController.addComboItems(
      {
        body: { items: [{ productId: '507f1f77bcf86cd799439011', quantity: 'nope' }] },
        cookies: {},
        headers: {},
      },
      res,
    );

    assert.equal(res.statusCode, 400);
    assert.match(res.payload.message, /quantity/i);
  } finally {
    Product.find = originalFind;
  }
});

test('addItem rejects AI-combo-only products from the generic cart route', async () => {
  const originalFindById = Product.findById;
  Product.findById = async () => ({
    _id: '507f1f77bcf86cd799439011',
    name: 'AI Only Food',
    isActive: true,
    isAiComboOnly: true,
  });

  try {
    const res = createRes();
    await cartController.addItem(
      {
        body: { productId: '507f1f77bcf86cd799439011', quantity: 1 },
        cookies: {},
        headers: {},
      },
      res,
    );

    assert.equal(res.statusCode, 404);
    assert.match(res.payload.message, /không tồn tại/i);
  } finally {
    Product.findById = originalFindById;
  }
});

test('addItem still allows public active products from the generic cart route', async () => {
  const originalFindById = Product.findById;
  const originalFindOne = Cart.findOne;
  const originalCreate = Cart.create;
  const productId = '507f1f77bcf86cd799439011';
  const cart = {
    items: [],
    saveCalled: false,
    async save() {
      this.saveCalled = true;
      return this;
    },
  };

  Product.findById = async () => ({
    _id: productId,
    name: 'Public Food',
    image: 'public.jpg',
    price: 100,
    salePrice: 80,
    isActive: true,
    isAiComboOnly: false,
  });
  Cart.findOne = async () => cart;
  Cart.create = async () => {
    throw new Error('existing cart should be used');
  };

  try {
    const res = createRes();
    await cartController.addItem(
      {
        body: { productId, quantity: 2 },
        cookies: { paw_cart_id: 'cart-id' },
        headers: {},
      },
      res,
    );

    assert.equal(res.statusCode, 200);
    assert.equal(cart.items[0].product, productId);
    assert.equal(cart.items[0].quantity, 2);
    assert.equal(cart.saveCalled, true);
  } finally {
    Product.findById = originalFindById;
    Cart.findOne = originalFindOne;
    Cart.create = originalCreate;
  }
});

test('addComboItems validates active db products and merges quantities', async () => {
  const originalFind = Product.find;
  const originalFindOne = Cart.findOne;
  const originalCreate = Cart.create;
  const productId = '507f1f77bcf86cd799439011';
  const cart = {
    items: [
      {
        product: productId,
        quantity: 2,
        name: 'Existing Food',
        image: '',
        price: 10,
      },
    ],
    saveCalled: false,
    async save() {
      this.saveCalled = true;
      return this;
    },
  };

  Product.find = async (filter) => {
    assert.equal(filter.isActive, true);
    assert.deepEqual(filter._id.$in.map(String), [productId]);
    return [
      {
        _id: productId,
        name: 'Combo Food',
        image: 'combo.jpg',
        price: 100,
        salePrice: 80,
        isActive: true,
        isAiComboOnly: true,
      },
    ];
  };
  Cart.findOne = async () => cart;
  Cart.create = async () => {
    throw new Error('existing cart should be used');
  };

  try {
    const res = createRes();
    await cartController.addComboItems(
      {
        body: { items: [{ productId, quantity: 3 }] },
        cookies: { paw_cart_id: 'cart-id' },
        headers: {},
      },
      res,
    );

    assert.equal(res.statusCode, 200);
    assert.equal(cart.items[0].quantity, 5);
    assert.equal(cart.saveCalled, true);
  } finally {
    Product.find = originalFind;
    Cart.findOne = originalFindOne;
    Cart.create = originalCreate;
  }
});
