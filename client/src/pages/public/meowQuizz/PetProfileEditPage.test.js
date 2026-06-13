import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('./PetProfileEditPage.jsx', import.meta.url), 'utf8');

test('PetProfileEditPage reserves space so the fixed action bar does not cover fields', () => {
  assert.match(source, /edit-profile-action-bar/);
  assert.match(source, /edit-profile-bottom-spacer/);
  assert.match(source, /pb-\[calc\(7rem\+env\(safe-area-inset-bottom\)\)\]/);
  assert.match(source, /pb-\[calc\(1\.25rem\+env\(safe-area-inset-bottom\)\)\]/);
});
