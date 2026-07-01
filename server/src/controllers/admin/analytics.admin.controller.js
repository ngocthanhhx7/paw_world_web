const AnalyticsEvent = require('../../models/AnalyticsEvent');
const AnalyticsPageView = require('../../models/AnalyticsPageView');
const AnalyticsSession = require('../../models/AnalyticsSession');
const { upsertSession, recordEvent } = require('../../services/analytics/analytics.service');
const { generateAnalyticsReport } = require('../../services/analytics/aiReport.service');
const { parseDateRange } = require('../../services/analytics/dateRange');
const { calculateRates, classifyVisitorSegments, percent } = require('../../services/analytics/metrics');

const AI_EVENT_NAMES = ['ai_started', 'ai_submitted', 'ai_completed', 'ai_failed'];

function identityExpr() {
  return {
    $cond: [
      { $and: [{ $ne: ['$userId', null] }, { $ne: ['$userId', ''] }] },
      { $concat: ['user:', '$userId'] },
      { $concat: ['anon:', '$anonymousId'] },
    ],
  };
}

function dateMatch(field, range) {
  return { [field]: { $gte: range.start, $lte: range.end } };
}

function parseFilters(req) {
  const range = parseDateRange(req.query || {});
  const filters = {};
  ['source', 'campaign', 'device'].forEach((key) => {
    if (req.query?.[key]) filters[key] = String(req.query[key]).trim();
  });
  if (req.query?.eventType) filters.eventType = String(req.query.eventType).trim();
  if (req.query?.aiStatus) filters.aiStatus = String(req.query.aiStatus).trim();
  if (req.query?.buyerStatus) filters.buyerStatus = String(req.query.buyerStatus).trim();
  return { range, filters };
}

function sessionFilter(range, filters = {}) {
  const match = dateMatch('startedAt', range);
  if (filters.source) match.source = filters.source;
  if (filters.campaign) match.campaign = filters.campaign;
  if (filters.device) match.deviceType = filters.device;
  return match;
}

function eventFilter(range, filters = {}) {
  const match = dateMatch('createdAt', range);
  if (filters.eventType) match.eventType = filters.eventType;
  return match;
}

async function distinctIdentityCountFromSessions(match) {
  const result = await AnalyticsSession.aggregate([
    { $match: match },
    { $group: { _id: identityExpr() } },
    { $count: 'count' },
  ]);
  return result[0]?.count || 0;
}

async function getSegmentSummary(range, filters = {}) {
  const events = await AnalyticsEvent.aggregate([
    { $match: eventFilter(range, filters) },
    {
      $project: {
        eventName: 1,
        createdAt: 1,
        identityKey: identityExpr(),
      },
    },
  ]);
  return classifyVisitorSegments(events);
}

async function getBouncedSessions(range, filters = {}) {
  const result = await AnalyticsPageView.aggregate([
    { $match: dateMatch('createdAt', range) },
    { $group: { _id: '$sessionId', views: { $sum: 1 } } },
    { $match: { views: 1 } },
    { $count: 'count' },
  ]);
  return result[0]?.count || 0;
}

async function getTrafficSeries(range, filters = {}) {
  return AnalyticsSession.aggregate([
    { $match: sessionFilter(range, filters) },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$startedAt', timezone: 'Asia/Ho_Chi_Minh' } },
        sessions: { $sum: 1 },
        visitors: { $addToSet: identityExpr() },
      },
    },
    { $project: { date: '$_id', sessions: 1, visitors: { $size: '$visitors' }, _id: 0 } },
    { $sort: { date: 1 } },
  ]);
}

async function getDeviceSplit(range, filters = {}) {
  return AnalyticsSession.aggregate([
    { $match: sessionFilter(range, filters) },
    { $group: { _id: '$deviceType', sessions: { $sum: 1 } } },
    { $project: { deviceType: '$_id', sessions: 1, _id: 0 } },
    { $sort: { sessions: -1 } },
  ]);
}

async function buildOverviewData(req) {
  const { range, filters } = parseFilters(req);
  const sessionsMatch = sessionFilter(range, filters);
  const eventsMatch = eventFilter(range, filters);

  const [
    totalSessions,
    uniqueVisitors,
    totalPageViews,
    totalVisitors,
    aiActions,
    segments,
    bouncedSessions,
    trafficSeries,
    deviceSplit,
    topSourceAgg,
  ] = await Promise.all([
    AnalyticsSession.countDocuments(sessionsMatch),
    distinctIdentityCountFromSessions(sessionsMatch),
    AnalyticsPageView.countDocuments(dateMatch('createdAt', range)),
    AnalyticsSession.countDocuments(sessionsMatch),
    AnalyticsEvent.countDocuments({ ...eventsMatch, eventName: { $in: AI_EVENT_NAMES } }),
    getSegmentSummary(range, filters),
    getBouncedSessions(range, filters),
    getTrafficSeries(range, filters),
    getDeviceSplit(range, filters),
    AnalyticsSession.aggregate([
      { $match: sessionsMatch },
      { $group: { _id: '$source', sessions: { $sum: 1 }, visitors: { $addToSet: identityExpr() } } },
      { $project: { source: '$_id', sessions: 1, visitors: { $size: '$visitors' }, _id: 0 } },
      { $sort: { visitors: -1, sessions: -1 } },
      { $limit: 1 },
    ]),
  ]);

  const rates = calculateRates({
    uniqueVisitors,
    aiUsers: segments.aiUsers,
    buyers: segments.buyers,
    aiToBuyerUsers: segments.aiToBuyerUsers,
    bouncedSessions,
    totalSessions,
  });

  return {
    range,
    filters,
    overview: {
      totalVisitors,
      uniqueVisitors,
      totalSessions,
      totalPageViews,
      aiUsers: segments.aiUsers,
      aiActions,
      aiOnlyUsers: segments.aiOnlyUsers,
      buyers: segments.buyers,
      nonBuyers: Math.max(0, uniqueVisitors - segments.buyers),
      aiToBuyerUsers: segments.aiToBuyerUsers,
      buyerWithoutAIUsers: segments.buyerWithoutAIUsers,
      ...rates,
      topTrafficSource: topSourceAgg[0]?.source || 'Direct',
    },
    trafficSeries,
    deviceSplit,
  };
}

exports.overview = async (req, res) => {
  try {
    const data = await buildOverviewData(req);
    return res.json(data);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.trafficSources = async (req, res) => {
  try {
    const { range, filters } = parseFilters(req);
    const sessions = await AnalyticsSession.aggregate([
      { $match: sessionFilter(range, filters) },
      {
        $group: {
          _id: { source: '$source', medium: '$medium', campaign: '$campaign' },
          visitors: { $addToSet: identityExpr() },
          sessions: { $sum: 1 },
        },
      },
      {
        $project: {
          source: '$_id.source',
          medium: '$_id.medium',
          campaign: '$_id.campaign',
          visitorKeys: '$visitors',
          visitors: { $size: '$visitors' },
          sessions: 1,
          _id: 0,
        },
      },
      { $sort: { visitors: -1, sessions: -1 } },
    ]);

    const events = await AnalyticsEvent.aggregate([
      { $match: eventFilter(range, filters) },
      { $project: { eventName: 1, identityKey: identityExpr(), source: '$metadata.source' } },
    ]);
    const aiByIdentity = new Set(events.filter((e) => AI_EVENT_NAMES.includes(e.eventName)).map((e) => e.identityKey));
    const buyerByIdentity = new Set(events.filter((e) => e.eventName === 'purchase_success').map((e) => e.identityKey));

    const rows = sessions.map((row) => {
      const visitorKeys = row.visitorKeys || [];
      const aiUsers = visitorKeys.filter((key) => aiByIdentity.has(key)).length;
      const buyers = visitorKeys.filter((key) => buyerByIdentity.has(key)).length;
      return {
        source: row.source,
        medium: row.medium,
        campaign: row.campaign,
        visitors: row.visitors,
        sessions: row.sessions,
        aiUsers,
        buyers,
        conversionRate: percent(buyers, row.visitors),
        aiToPurchaseRate: percent(buyers, aiUsers),
      };
    });

    return res.json({ range, rows });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.funnel = async (req, res) => {
  try {
    const { range, filters } = parseFilters(req);
    const uniqueVisitors = await distinctIdentityCountFromSessions(sessionFilter(range, filters));
    const events = await AnalyticsEvent.aggregate([
      { $match: eventFilter(range, filters) },
      { $project: { eventName: 1, identityKey: identityExpr(), createdAt: 1 } },
    ]);
    const segments = classifyVisitorSegments(events);
    const checkoutUsers = new Set(events.filter((e) => e.eventName === 'checkout_started').map((e) => e.identityKey)).size;

    const rawSteps = [
      { step: 'Truy cập', users: uniqueVisitors },
      { step: 'Dùng AI', users: segments.aiUsers },
      { step: 'Bắt đầu thanh toán', users: checkoutUsers },
      { step: 'Mua thành công', users: segments.buyers },
    ];
    const steps = rawSteps.map((step, index) => {
      const previous = index === 0 ? step.users : rawSteps[index - 1].users;
      return {
        ...step,
        conversionFromPrevious: index === 0 ? 100 : percent(step.users, previous),
        dropOffRate: index === 0 ? 0 : Number((100 - percent(step.users, previous)).toFixed(2)),
      };
    });

    return res.json({ range, steps });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.aiUsage = async (req, res) => {
  try {
    const { range, filters } = parseFilters(req);
    const rows = await AnalyticsEvent.aggregate([
      { $match: { ...eventFilter(range, filters), eventName: { $in: AI_EVENT_NAMES } } },
      {
        $group: {
          _id: { $ifNull: ['$metadata.aiFeatureName', 'unknown_ai'] },
          users: { $addToSet: identityExpr() },
          totalUses: { $sum: 1 },
          successCount: { $sum: { $cond: [{ $eq: ['$eventName', 'ai_completed'] }, 1, 0] } },
          failedCount: { $sum: { $cond: [{ $eq: ['$eventName', 'ai_failed'] }, 1, 0] } },
          averageDuration: { $avg: '$metadata.durationMs' },
        },
      },
      {
        $project: {
          aiFeature: '$_id',
          users: { $size: '$users' },
          totalUses: 1,
          successCount: 1,
          failedCount: 1,
          successRate: { $cond: ['$totalUses', { $multiply: [{ $divide: ['$successCount', '$totalUses'] }, 100] }, 0] },
          averageDuration: { $ifNull: ['$averageDuration', 0] },
          purchaseAfterAI: { $literal: 0 },
          _id: 0,
        },
      },
      { $sort: { totalUses: -1 } },
    ]);
    return res.json({ range, rows });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.pages = async (req, res) => {
  try {
    const { range } = parseFilters(req);
    const [viewsByPage, exits] = await Promise.all([
      AnalyticsPageView.aggregate([
        { $match: dateMatch('createdAt', range) },
        {
          $group: {
            _id: '$pagePath',
            views: { $sum: 1 },
            uniqueVisitors: { $addToSet: identityExpr() },
            averageTimeOnPage: { $avg: '$timeOnPage' },
            sessions: { $addToSet: '$sessionId' },
          },
        },
        {
          $project: {
            pagePath: '$_id',
            views: 1,
            uniqueVisitors: { $size: '$uniqueVisitors' },
            averageTimeOnPage: { $ifNull: ['$averageTimeOnPage', 0] },
            sessions: { $size: '$sessions' },
            _id: 0,
          },
        },
        { $sort: { views: -1 } },
        { $limit: 20 },
      ]),
      AnalyticsSession.aggregate([
        { $match: dateMatch('startedAt', range) },
        { $group: { _id: '$exitPage', exits: { $sum: 1 } } },
      ]),
    ]);
    const exitsByPage = new Map(exits.map((item) => [item._id, item.exits]));
    const rows = viewsByPage.map((row) => ({
      ...row,
      bounceRate: 0,
      exitRate: percent(exitsByPage.get(row.pagePath) || 0, row.sessions),
    }));
    return res.json({ range, rows });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports.generateReport = async (req, res) => {
  try {
    const overviewData = await buildOverviewData(req);
    const [trafficSources, funnel, aiUsage, pages] = await Promise.all([
      new Promise((resolve) => {
        const fakeRes = { json: (data) => resolve(data), status: () => fakeRes };
        exports.trafficSources(req, fakeRes);
      }),
      new Promise((resolve) => {
        const fakeRes = { json: (data) => resolve(data), status: () => fakeRes };
        exports.funnel(req, fakeRes);
      }),
      new Promise((resolve) => {
        const fakeRes = { json: (data) => resolve(data), status: () => fakeRes };
        exports.aiUsage(req, fakeRes);
      }),
      new Promise((resolve) => {
        const fakeRes = { json: (data) => resolve(data), status: () => fakeRes };
        exports.pages(req, fakeRes);
      }),
    ]);

    const summary = {
      dateRangeLabel: overviewData.range.label,
      overview: overviewData.overview,
      trafficSources: trafficSources.rows || [],
      funnel,
      aiUsage: aiUsage.rows || [],
      topPages: pages.rows || [],
    };
    const report = await generateAnalyticsReport(summary);

    const adminSessionId = `admin_${req.admin._id}_${Date.now()}`;
    await upsertSession({
      sessionId: adminSessionId,
      anonymousId: `admin_${req.admin._id}`,
      userId: String(req.admin._id),
      pagePath: '/admin/analytics',
      source: 'Admin',
      medium: 'internal',
      deviceType: 'desktop',
      browser: 'admin',
      os: 'admin',
    });
    await recordEvent({
      eventName: 'admin_report_generated',
      eventType: 'admin',
      userId: String(req.admin._id),
      anonymousId: `admin_${req.admin._id}`,
      sessionId: adminSessionId,
      pagePath: '/admin/analytics',
      metadata: { provider: report.provider, dateRange: overviewData.range.label },
    });

    return res.json({ range: overviewData.range, report });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

exports._private = { buildOverviewData, parseFilters };
