import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const cartSource = readFileSync(new URL('./CartPage.jsx', import.meta.url), 'utf8');
const checkoutSource = readFileSync(new URL('./CheckoutPage.jsx', import.meta.url), 'utf8');

test('CartPage treats every non-empty cart as free shipping with a fixed packaging fee', () => {
  assert.match(cartSource, /const shippingFee = 0;/);
  assert.match(cartSource, /const packagingFee = 5000;/);
  assert.match(cartSource, /const total = subtotal \+ packagingFee;/);
  assert.match(cartSource, /formatPrice\(packagingFee\)/);
  assert.doesNotMatch(cartSource, /500000/);
  assert.doesNotMatch(cartSource, /25000/);
  assert.doesNotMatch(cartSource, /freeship/i);
});

test('CheckoutPage submits orders with free shipping and packaging fee total preview', () => {
  assert.match(checkoutSource, /const shippingFee = 0;/);
  assert.match(checkoutSource, /const packagingFee = 5000;/);
  assert.match(checkoutSource, /const total = subtotal \+ packagingFee;/);
  assert.match(checkoutSource, /formatPrice\(packagingFee\)/);
  assert.doesNotMatch(checkoutSource, /500000/);
  assert.doesNotMatch(checkoutSource, /25000/);
});
