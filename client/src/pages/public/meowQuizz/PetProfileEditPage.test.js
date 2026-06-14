import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('./PetProfileEditPage.jsx', import.meta.url), 'utf8');

test('PetProfileEditPage keeps save actions in normal form flow', () => {
  assert.match(source, /edit-profile-action-footer/);
  assert.doesNotMatch(source, /edit-profile-action-bar/);
  assert.doesNotMatch(source, /edit-profile-bottom-spacer/);
  assert.doesNotMatch(source, /fixed bottom-0/);
  assert.doesNotMatch(source, /pb-\[calc\(7rem\+env\(safe-area-inset-bottom\)\)\]/);
});
