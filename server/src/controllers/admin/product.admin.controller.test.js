const assert = require('node:assert/strict');
const test = require('node:test');

const { normalizeProductData } = require('./product.admin.controller');

test('normalizeProductData parses boolean form strings and normalizes arrays', () => {
  const normalized = normalizeProductData({
    isFeatured: 'true',
    isBestSeller: 'false',
    isActive: '0',
    isAiComboOnly: 'on',
    tags: ' kitten, , salmon ',
    healthNeeds: [' digestion ', '', 'skin_coat'],
  });

  assert.equal(normalized.isFeatured, true);
  assert.equal(normalized.isBestSeller, false);
  assert.equal(normalized.isActive, false);
  assert.equal(normalized.isAiComboOnly, true);
  assert.deepEqual(normalized.tags, ['kitten', 'salmon']);
  assert.deepEqual(normalized.healthNeeds, ['digestion', 'skin_coat']);
});
