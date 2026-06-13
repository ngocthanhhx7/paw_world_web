import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('./AdminProductsPage.jsx', import.meta.url), 'utf8');

test('AdminProductsPage supports AI-combo-only products without submitting spread API fields', () => {
  assert.match(source, /isAiComboOnly:\s*false/);
  assert.match(source, /Chỉ dùng cho AI combo/);
  assert.match(source, /p\.isAiComboOnly/);
  assert.match(source, /AI combo/);
  assert.match(source, /const PRODUCT_FORM_FIELDS = \[/);
  assert.match(source, /'isAiComboOnly'/);
  assert.doesNotMatch(source, /Object\.entries\(editing\)\.forEach/);
});
