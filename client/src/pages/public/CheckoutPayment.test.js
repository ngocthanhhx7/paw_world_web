import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const checkoutSource = readFileSync(new URL('./CheckoutPage.jsx', import.meta.url), 'utf8');
const successSource = readFileSync(new URL('./OrderSuccessPage.jsx', import.meta.url), 'utf8');
const trackingSource = readFileSync(new URL('./OrderTrackingPage.jsx', import.meta.url), 'utf8');

test('CheckoutPage keeps two payment methods and redirects bank transfer orders to payOS checkoutUrl', () => {
  assert.match(checkoutSource, /v:\s*'cod'/);
  assert.match(checkoutSource, /v:\s*'bank_transfer'/);
  assert.match(checkoutSource, /paymentMethod\s*===\s*'bank_transfer'/);
  assert.match(checkoutSource, /payment\?\.checkoutUrl/);
  assert.match(checkoutSource, /window\.location\.assign\(order\.payment\.checkoutUrl\)/);
});

test('public order pages can display paymentStatus returned by the server', () => {
  assert.match(successSource, /paymentStatus/);
  assert.match(trackingSource, /paymentStatus/);
});

test('OrderSuccessPage handles payOS cancelled return query without showing a pure success message', () => {
  assert.match(successSource, /useSearchParams/);
  assert.match(successSource, /isPaymentCancelled/);
  assert.match(successSource, /Bạn đã huỷ thanh toán online/);
});
