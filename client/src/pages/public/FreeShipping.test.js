import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const cartSource = readFileSync(new URL('./CartPage.jsx', import.meta.url), 'utf8');
const checkoutSource = readFileSync(new URL('./CheckoutPage.jsx', import.meta.url), 'utf8');

test('CartPage treats every non-empty cart as free shipping without an order threshold', () => {
  assert.match(cartSource, /const shippingFee = 0;/);
  assert.match(cartSource, /const total = subtotal;/);
  assert.doesNotMatch(cartSource, /500000/);
  assert.doesNotMatch(cartSource, /25000/);
  assert.doesNotMatch(cartSource, /freeship/i);
});

test('CheckoutPage submits orders with a free-shipping total preview', () => {
  assert.match(checkoutSource, /const shippingFee = 0;/);
  assert.match(checkoutSource, /const total = subtotal;/);
  assert.doesNotMatch(checkoutSource, /500000/);
  assert.doesNotMatch(checkoutSource, /25000/);
});
