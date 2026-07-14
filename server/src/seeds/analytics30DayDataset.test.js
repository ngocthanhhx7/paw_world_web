const assert = require('node:assert/strict');
const test = require('node:test');

const {
  NAMESPACE,
  TARGETS,
  buildAnalytics30DayDataset,
  validateAnalyticsDataset,
} = require('./analytics30DayDataset');

const NOW = new Date('2026-07-14T06:00:00.000Z');
const BASELINE = {
  uniqueVisitors: 80,
  sessions: 108,
  pageViews: 511,
  aiUsers: 0,
  aiInvocations: 0,
  checkoutUsers: 0,
  buyers: 0,
  aiBuyers: 0,
  bouncedSessions: 60,
  sources: [
    { value: 'Direct', count: 83 },
    { value: 'Google', count: 11 },
    { value: 'Facebook', count: 9 },
    { value: 'Zalo', count: 2 },
  ],
  devices: [
    { value: 'desktop', count: 61 },
    { value: 'mobile', count: 44 },
    { value: 'tablet', count: 3 },
  ],
  publicPages: ['/', '/meow-quizz', '/meow-quizz/ho-so', '/danh-muc', '/gio-hang', '/thanh-toan'],
};

test('builds a deterministic namespaced dataset in approved target ranges', () => {
  const first = buildAnalytics30DayDataset({ now: NOW, baseline: BASELINE });
  const second = buildAnalytics30DayDataset({ now: NOW, baseline: BASELINE });
  assert.deepEqual(first, second);
  assert.equal(validateAnalyticsDataset(first), true);
  assert.ok(first.sessions.every((item) => item.sessionId.startsWith(NAMESPACE)));
  assert.ok(first.events.every((item) => item.eventId.startsWith(NAMESPACE)));
  for (const [key, target] of Object.entries(TARGETS)) {
    if (!target || typeof target !== 'object') continue;
    assert.ok(first.summary[key] >= target.min, `${key} below target`);
    assert.ok(first.summary[key] <= target.max, `${key} above target`);
  }
  assert.ok(first.summary.purchaseConversionRate >= 4 && first.summary.purchaseConversionRate <= 5.5);
  assert.ok(first.summary.bounceRate >= 40 && first.summary.bounceRate <= 48);
  const viewsBySession = new Map();
  for (const view of first.pageViews) viewsBySession.set(view.sessionId, (viewsBySession.get(view.sessionId) || 0) + 1);
  const generatedBounces = [...viewsBySession.values()].filter((count) => count === 1).length;
  assert.equal(generatedBounces, first.summary.bouncedSessions - BASELINE.bouncedSessions);
});

test('covers 30 Vietnam days and keeps references and chronology valid', () => {
  const dataset = buildAnalytics30DayDataset({ now: NOW, baseline: BASELINE });
  const sessionById = new Map(dataset.sessions.map((item) => [item.sessionId, item]));
  const formatDay = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
  });
  assert.equal(new Set(dataset.sessions.map((item) => formatDay.format(item.startedAt))).size, 30);
  for (const item of [...dataset.pageViews, ...dataset.events]) {
    const session = sessionById.get(item.sessionId);
    assert.ok(session, `missing ${item.sessionId}`);
    assert.equal(item.anonymousId, session.anonymousId);
    assert.ok(item.createdAt >= session.startedAt && item.createdAt <= session.lastActivityAt);
    assert.doesNotMatch(item.pagePath, /^\/admin(?:\/|$)/);
  }
  const grouped = new Map();
  for (const event of dataset.events) {
    const events = grouped.get(event.anonymousId) || [];
    events.push(event);
    grouped.set(event.anonymousId, events);
  }
  for (const events of grouped.values()) {
    const firstAi = events.filter((item) => item.eventType === 'ai').sort((a, b) => a.createdAt - b.createdAt)[0];
    const purchase = events.find((item) => item.eventName === 'purchase_success');
    if (firstAi && purchase) assert.ok(firstAi.createdAt < purchase.createdAt);
  }
});
