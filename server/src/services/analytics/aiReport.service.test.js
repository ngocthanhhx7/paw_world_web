const assert = require('node:assert/strict');
const test = require('node:test');

const { buildFallbackAnalyticsReport } = require('./aiReport.service');

test('buildFallbackAnalyticsReport returns Vietnamese deterministic sections without raw user data', () => {
  const report = buildFallbackAnalyticsReport({
    dateRangeLabel: 'Last 7 days',
    overview: {
      totalVisitors: 20,
      uniqueVisitors: 10,
      aiUsers: 4,
      buyers: 2,
      aiOnlyUsers: 3,
      purchaseConversionRate: 20,
      aiToPurchaseRate: 25,
      bounceRate: 40,
      topTrafficSource: 'Facebook',
    },
    funnel: {
      steps: [
        { step: 'Visitor', users: 10, dropOffRate: 0 },
        { step: 'AI Used', users: 4, dropOffRate: 60 },
      ],
    },
    topPages: [{ pagePath: '/meow-quizz', bounceRate: 70 }],
    trafficSources: [{ source: 'Facebook', visitors: 5, buyers: 1, conversionRate: 20 }],
    aiUsage: [{ aiFeature: 'meow_quizz', totalUses: 4, successRate: 75 }],
  });

  assert.match(report.markdown, /Tóm tắt điều hành/);
  assert.match(report.markdown, /Chỉ số chính/);
  assert.match(report.markdown, /Facebook/);
  assert.match(report.markdown, /Khuyến nghị/);
  assert.match(report.markdown, /Hành động tiếp theo/);
  assert.doesNotMatch(report.markdown, /password|token|rawPrompt/i);
  assert.equal(report.provider, 'fallback');
});
