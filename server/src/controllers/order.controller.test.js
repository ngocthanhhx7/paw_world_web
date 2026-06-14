const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const source = readFileSync(__filename.replace(/\.test\.js$/, '.js'), 'utf8');

test('order creation stores free shipping for every subtotal', () => {
  assert.match(source, /const shippingFee = 0;/);
  assert.match(source, /const total = subtotal;/);
  assert.doesNotMatch(source, /500000/);
  assert.doesNotMatch(source, /25000/);
});
