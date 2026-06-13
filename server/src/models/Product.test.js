const assert = require('node:assert/strict');
const test = require('node:test');

const Product = require('./Product');

test('Product has indexed isAiComboOnly flag defaulting to false', () => {
  const path = Product.schema.path('isAiComboOnly');

  assert.equal(path.instance, 'Boolean');
  assert.equal(path.defaultValue, false);
  assert.equal(path.options.index, true);
});
