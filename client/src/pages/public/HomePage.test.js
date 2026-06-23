import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const homeSource = readFileSync(new URL('./HomePage.jsx', import.meta.url), 'utf8');

test('HomePage pain point cards use readable type and spacing', () => {
  assert.match(homeSource, /md:grid-cols-\[1fr_340px_1fr\]/);
  assert.match(homeSource, /rounded-\[22px\].*px-6 py-7.*md:px-8 md:py-8/);
  assert.match(homeSource, /text-\[20px\].*md:text-\[22px\]/);
  assert.match(homeSource, /text-\[15px\].*md:text-\[16px\]/);
});

test('HomePage step connector starts and ends at step centers', () => {
  assert.doesNotMatch(homeSource, /left-\[12%\] right-\[12%\]/);
  assert.match(homeSource, /left-\[16\.666%\] right-\[16\.666%\]/);
  assert.match(homeSource, /top-\[44px\]/);
});
