require('../config/env');

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const AnalyticsPageView = require('../models/AnalyticsPageView');
const AnalyticsSession = require('../models/AnalyticsSession');
const controller = require('../controllers/admin/analytics.admin.controller');
const { parseDateRange } = require('../services/analytics/dateRange');
const { classifyVisitorSegments } = require('../services/analytics/metrics');
const {
  NAMESPACE,
  buildAnalytics30DayDataset,
  validateAnalyticsDataset,
} = require('./analytics30DayDataset');

const AI_EVENT_NAMES = ['ai_started', 'ai_submitted', 'ai_completed', 'ai_failed'];

function readMode(argv) {
  const known = new Set(['--dry-run', '--apply', '--cleanup']);
  const flags = argv.filter((value) => value.startsWith('--'));
  const unknown = flags.filter((value) => !known.has(value));
  if (unknown.length) throw new Error(`Unknown option: ${unknown.join(', ')}`);
  if (flags.length > 1) throw new Error('Choose only one of --dry-run, --apply, or --cleanup');
  return flags[0] || '--dry-run';
}

function namespaceRegex() {
  return new RegExp(`^${NAMESPACE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
}

function identityExpr() {
  return {
    $cond: [
      { $and: [{ $ne: ['$userId', null] }, { $ne: ['$userId', ''] }] },
      { $concat: ['user:', '$userId'] },
      { $concat: ['anon:', '$anonymousId'] },
    ],
  };
}

async function distinctCount(Model, match) {
  const result = await Model.aggregate([
    { $match: match },
    { $group: { _id: identityExpr() } },
    { $count: 'count' },
  ]);
  return result[0]?.count || 0;
}

async function collectBaseline(now = new Date()) {
  const range = parseDateRange({ preset: 'last_30_days' }, now);
  const prefix = namespaceRegex();
  const sessionMatch = { startedAt: { $gte: range.start, $lte: range.end }, sessionId: { $not: prefix } };
  const pageMatch = { createdAt: { $gte: range.start, $lte: range.end }, sessionId: { $not: prefix } };
  const eventMatch = { createdAt: { $gte: range.start, $lte: range.end }, eventId: { $not: prefix } };
  const [
    uniqueVisitors,
    sessions,
    pageViews,
    aiUsers,
    aiInvocations,
    checkoutUsers,
    events,
    bounced,
    sources,
    devices,
    publicPages,
  ] = await Promise.all([
    distinctCount(AnalyticsSession, sessionMatch),
    AnalyticsSession.countDocuments(sessionMatch),
    AnalyticsPageView.countDocuments(pageMatch),
    distinctCount(AnalyticsEvent, { ...eventMatch, eventName: { $in: AI_EVENT_NAMES } }),
    AnalyticsEvent.countDocuments({ ...eventMatch, eventName: { $in: ['ai_completed', 'ai_failed'] } }),
    distinctCount(AnalyticsEvent, { ...eventMatch, eventName: 'checkout_started' }),
    AnalyticsEvent.aggregate([
      { $match: eventMatch },
      { $project: { eventName: 1, createdAt: 1, identityKey: identityExpr() } },
    ]),
    AnalyticsPageView.aggregate([
      { $match: pageMatch },
      { $group: { _id: '$sessionId', views: { $sum: 1 } } },
      { $match: { views: 1 } },
      { $count: 'count' },
    ]),
    AnalyticsSession.aggregate([
      { $match: sessionMatch },
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    AnalyticsSession.aggregate([
      { $match: sessionMatch },
      { $group: { _id: '$deviceType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    AnalyticsPageView.aggregate([
      { $match: { ...pageMatch, pagePath: { $not: /^\/admin(?:\/|$)/ } } },
      { $group: { _id: '$pagePath', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 12 },
    ]),
  ]);
  const segments = classifyVisitorSegments(events);
  return {
    range,
    uniqueVisitors,
    sessions,
    pageViews,
    aiUsers,
    aiInvocations,
    checkoutUsers,
    buyers: segments.buyers,
    aiBuyers: segments.aiToBuyerUsers,
    bouncedSessions: bounced[0]?.count || 0,
    sources: sources.map((item) => ({ value: item._id || 'Direct', count: item.count })),
    devices: devices.map((item) => ({ value: item._id || 'unknown', count: item.count })),
    publicPages: publicPages.map((item) => item._id).filter(Boolean),
  };
}

async function namespaceCounts() {
  const prefix = namespaceRegex();
  const [sessions, pageViews, events] = await Promise.all([
    AnalyticsSession.countDocuments({ sessionId: prefix }),
    AnalyticsPageView.countDocuments({ sessionId: prefix }),
    AnalyticsEvent.countDocuments({ eventId: prefix }),
  ]);
  return { sessions, pageViews, events };
}

async function cleanupNamespace() {
  const prefix = namespaceRegex();
  const [events, pageViews, sessions] = await Promise.all([
    AnalyticsEvent.deleteMany({ eventId: prefix }),
    AnalyticsPageView.deleteMany({ sessionId: prefix }),
    AnalyticsSession.deleteMany({ sessionId: prefix }),
  ]);
  return {
    events: events.deletedCount,
    pageViews: pageViews.deletedCount,
    sessions: sessions.deletedCount,
  };
}

async function insertDataset(dataset) {
  if (dataset.sessions.length) await AnalyticsSession.insertMany(dataset.sessions, { ordered: false });
  if (dataset.pageViews.length) await AnalyticsPageView.insertMany(dataset.pageViews, { ordered: false });
  if (dataset.events.length) await AnalyticsEvent.insertMany(dataset.events, { ordered: false });
}

function invokeController(handler, req) {
  return new Promise((resolve, reject) => {
    let statusCode = 200;
    const res = {
      status(code) { statusCode = code; return res; },
      json(data) {
        if (statusCode >= 400) reject(new Error(data?.message || `HTTP ${statusCode}`));
        else resolve(data);
        return data;
      },
    };
    Promise.resolve(handler(req, res)).catch(reject);
  });
}

async function dashboardEvidence() {
  const req = { query: { preset: 'last_30_days' } };
  const [overviewData, traffic, funnel, aiUsage, pages] = await Promise.all([
    controller._private.buildOverviewData(req),
    invokeController(controller.trafficSources, req),
    invokeController(controller.funnel, req),
    invokeController(controller.aiUsage, req),
    invokeController(controller.pages, req),
  ]);
  return {
    overview: overviewData.overview,
    trafficDates: overviewData.trafficSeries.map((item) => item.date),
    trafficSources: traffic.rows,
    funnel: funnel.steps,
    aiUsage: aiUsage.rows,
    topPages: pages.rows.slice(0, 10),
  };
}

async function run(mode) {
  if (mode === '--cleanup') {
    const deleted = await cleanupNamespace();
    console.log(JSON.stringify({ mode, deleted, namespaceCounts: await namespaceCounts() }, null, 2));
    return;
  }
  const now = new Date();
  const baseline = await collectBaseline(now);
  const dataset = buildAnalytics30DayDataset({ now, baseline });
  validateAnalyticsDataset(dataset);
  let replaced = null;
  let reused = false;
  const storedBefore = await namespaceCounts();
  if (mode === '--apply') {
    reused = storedBefore.sessions > 0 && storedBefore.pageViews > 0 && storedBefore.events > 0;
    if (reused) {
      replaced = { sessions: 0, pageViews: 0, events: 0 };
    } else {
      replaced = await cleanupNamespace();
      await insertDataset(dataset);
    }
  }
  const output = {
    mode,
    baseline: {
      uniqueVisitors: baseline.uniqueVisitors,
      sessions: baseline.sessions,
      pageViews: baseline.pageViews,
      aiUsers: baseline.aiUsers,
      aiInvocations: baseline.aiInvocations,
      checkoutUsers: baseline.checkoutUsers,
      buyers: baseline.buyers,
      aiBuyers: baseline.aiBuyers,
      bouncedSessions: baseline.bouncedSessions,
    },
    projected: dataset.summary,
    generated: reused ? storedBefore : {
      sessions: dataset.sessions.length,
      pageViews: dataset.pageViews.length,
      events: dataset.events.length,
    },
    reused,
    replaced,
    namespaceCounts: await namespaceCounts(),
  };
  if (mode === '--apply') output.dashboard = await dashboardEvidence();
  console.log(JSON.stringify(output, null, 2));
}

(async () => {
  let phase = 'connect';
  try {
    const mode = readMode(process.argv.slice(2));
    await connectDB();
    phase = mode;
    await run(mode);
  } catch (error) {
    console.error(`Analytics seed failed during ${phase}: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
})();

module.exports = {
  cleanupNamespace,
  collectBaseline,
  dashboardEvidence,
  insertDataset,
  namespaceCounts,
  readMode,
  run,
};
