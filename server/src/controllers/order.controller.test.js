const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const source = readFileSync(__filename.replace(/\.test\.js$/, '.js'), 'utf8');

test('order creation stores free shipping plus a fixed packaging fee for every subtotal', () => {
  assert.match(source, /const shippingFee = 0;/);
  assert.match(source, /const packagingFee = PACKAGING_FEE;/);
  assert.match(source, /const total = subtotal \+ packagingFee;/);
  assert.match(source, /packagingFee,/);
  assert.doesNotMatch(source, /500000/);
  assert.doesNotMatch(source, /25000/);
});

test('payOS webhook handler ignores verified setup probes without a numeric orderCode', () => {
  assert.match(source, /Number\.isSafeInteger\(payosOrderCode\)/);
  assert.match(source, /ignored:\s*true/);
  assert.doesNotMatch(source, /payosOrderCode:\s*Number\(data\.orderCode\)/);
});
