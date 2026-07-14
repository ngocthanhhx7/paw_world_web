import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const source = readFileSync(new URL('./AdminAnalyticsPage.jsx', import.meta.url), 'utf8');

test('AdminAnalyticsPage uses Vietnamese analytics labels for local admins', () => {
  [
    'Phân tích kinh doanh',
    'Lượt truy cập',
    'Khách duy nhất',
    'Nguồn truy cập',
    'Phễu chuyển đổi',
    'Báo cáo AI',
    'Chưa có dữ liệu',
  ].forEach((label) => assert.match(source, new RegExp(label)));
});

test('AdminAnalyticsPage no longer exposes English dashboard chrome', () => {
  [
    'Total Visitors',
    'Traffic Over Time',
    'No rows yet',
    'Loading analytics',
    'Traffic Source Table',
    'Buyer vs Non-buyer By Source',
  ].forEach((label) => assert.doesNotMatch(source, new RegExp(label)));
});

test('AdminAnalyticsPage defaults and resets to the last 30 days preset', () => {
  assert.equal(source.match(/preset:\s*'last_30_days'/g)?.length, 2);
  assert.equal(source.match(/preset:\s*'last_7_days'/g)?.length ?? 0, 0);
});
