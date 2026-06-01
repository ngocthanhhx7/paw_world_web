import test from 'node:test';
import assert from 'node:assert/strict';

import { getMealProductCartId } from './homePageProducts.js';

test('getMealProductCartId returns Mongo product id for cartable home products', () => {
  assert.equal(
    getMealProductCartId({ _id: '665f81fe3f3d37a5e2e4a111' }),
    '665f81fe3f3d37a5e2e4a111',
  );
});

test('getMealProductCartId returns null for static fallback products', () => {
  assert.equal(getMealProductCartId({ _id: 'a' }), null);
  assert.equal(getMealProductCartId({}), null);
});
