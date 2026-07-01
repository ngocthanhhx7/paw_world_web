const assert = require('node:assert/strict');
const test = require('node:test');

const { calculateRates, classifyVisitorSegments } = require('./metrics');

test('calculateRates uses safe zero division and percentage ratios', () => {
  assert.deepEqual(calculateRates({ uniqueVisitors: 10, aiUsers: 4, buyers: 2, aiToBuyerUsers: 1, bouncedSessions: 3, totalSessions: 6 }), {
    aiUsageRate: 40,
    purchaseConversionRate: 20,
    aiToPurchaseRate: 25,
    bounceRate: 50,
  });

  assert.deepEqual(calculateRates({ uniqueVisitors: 0, aiUsers: 0, buyers: 0, aiToBuyerUsers: 0, bouncedSessions: 0, totalSessions: 0 }), {
    aiUsageRate: 0,
    purchaseConversionRate: 0,
    aiToPurchaseRate: 0,
    bounceRate: 0,
  });
});

test('classifyVisitorSegments separates AI-only, AI-to-buyer, and buyers without AI', () => {
  const events = [
    { identityKey: 'anon:a', eventName: 'ai_completed', createdAt: new Date('2026-07-02T01:00:00Z') },
    { identityKey: 'anon:a', eventName: 'purchase_success', createdAt: new Date('2026-07-02T02:00:00Z') },
    { identityKey: 'anon:b', eventName: 'ai_started', createdAt: new Date('2026-07-02T03:00:00Z') },
    { identityKey: 'user:c', eventName: 'purchase_success', createdAt: new Date('2026-07-02T04:00:00Z') },
  ];

  assert.deepEqual(classifyVisitorSegments(events), {
    aiUsers: 2,
    buyers: 2,
    aiOnlyUsers: 1,
    aiToBuyerUsers: 1,
    buyerWithoutAIUsers: 1,
    nonBuyers: 1,
  });
});
