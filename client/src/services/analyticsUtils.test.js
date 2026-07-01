import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  classifyTrafficSource,
  createAnalyticsId,
  getDeviceInfo,
  shouldStartNewSession,
} from './analyticsUtils.js';

test('client classifyTrafficSource prefers UTM and detects direct', () => {
  assert.equal(classifyTrafficSource('https://pawworld.vn/?utm_source=tiktok&utm_medium=social', 'https://google.com').source, 'tiktok');
  assert.equal(classifyTrafficSource('https://pawworld.vn/', '').source, 'Direct');
});

test('shouldStartNewSession refreshes after thirty minutes of inactivity', () => {
  assert.equal(shouldStartNewSession(null, 1000), true);
  assert.equal(shouldStartNewSession(1000, 1000 + 29 * 60 * 1000), false);
  assert.equal(shouldStartNewSession(1000, 1000 + 31 * 60 * 1000), true);
});

test('createAnalyticsId prefixes generated ids and getDeviceInfo maps user agents', () => {
  assert.match(createAnalyticsId('anon'), /^anon_/);
  assert.equal(getDeviceInfo('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)').deviceType, 'mobile');
  assert.equal(getDeviceInfo('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0').browser, 'Chrome');
});
