const assert = require('node:assert/strict');
const test = require('node:test');

const Product = require('../models/Product');
const productController = require('./product.controller');

function createRes() {
  return {
    statusCode: 200,
    payload: null,
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

test('public list excludes AI-only products while allowing missing flag', async () => {
  let findFilter;
  let countFilter;
  const originalFind = Product.find;
  const originalCountDocuments = Product.countDocuments;

  Product.find = (filter) => {
    findFilter = filter;
    return {
      populate() {
        return this;
      },
      sort() {
        return this;
      },
      skip() {
        return this;
      },
      limit: async () => [],
    };
  };
  Product.countDocuments = async (filter) => {
    countFilter = filter;
    return 0;
  };

  try {
    const res = createRes();
    await productController.list({ query: {} }, res);

    assert.deepEqual(findFilter.isAiComboOnly, { $ne: true });
    assert.deepEqual(countFilter.isAiComboOnly, { $ne: true });
  } finally {
    Product.find = originalFind;
    Product.countDocuments = originalCountDocuments;
  }
});

test('public detail and related exclude AI-only products while allowing missing flag', async () => {
  let detailFilter;
  let relatedFilter;
  const originalFindOneAndUpdate = Product.findOneAndUpdate;
  const originalFind = Product.find;
  const product = {
    _id: 'product-id',
    category: { _id: 'category-id' },
  };

  Product.findOneAndUpdate = (filter) => {
    detailFilter = filter;
    return {
      populate: async () => product,
    };
  };
  Product.find = (filter) => {
    relatedFilter = filter;
    return {
      limit() {
        return this;
      },
      populate: async () => [],
    };
  };

  try {
    const res = createRes();
    await productController.getBySlug({ params: { slug: 'public-product' } }, res);

    assert.deepEqual(detailFilter.isAiComboOnly, { $ne: true });
    assert.deepEqual(relatedFilter.isAiComboOnly, { $ne: true });
  } finally {
    Product.findOneAndUpdate = originalFindOneAndUpdate;
    Product.find = originalFind;
  }
});
