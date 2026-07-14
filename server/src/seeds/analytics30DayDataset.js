const { ALLOWED_EVENT_NAMES, EVENT_TYPE_BY_NAME } = require('../services/analytics/eventValidation');
const { getVietnamParts, startOfVietnamDay } = require('../services/analytics/dateRange');

const NAMESPACE = 'demo30_v1_';
const AI_FEATURES = ['pawworld_genius_chatbot', 'meow_quizz_recommendation'];
const TARGETS = Object.freeze({
  uniqueVisitors: { min: 300, max: 340, value: 320 },
  sessions: { min: 440, max: 480, value: 460 },
  pageViews: { min: 1500, max: 1700, value: 1600 },
  aiUsers: { min: 75, max: 90, value: 84 },
  aiInvocations: { min: 150, max: 190, value: 170 },
  checkoutUsers: { min: 30, max: 36, value: 34 },
  buyers: { min: 14, max: 18, value: 16 },
  aiBuyers: { min: 9, max: 12, value: 11 },
  bounceRate: { min: 40, max: 48, value: 44 },
});

const FALLBACK_PAGES = ['/', '/meow-quizz', '/meow-quizz/ho-so', '/danh-muc', '/gio-hang', '/thanh-toan'];

function needed(target, current) {
  return Math.max(0, target - Number(current || 0));
}

function percent(numerator, denominator) {
  return denominator ? Number(((numerator / denominator) * 100).toFixed(2)) : 0;
}

function createRandom(seed = 20260714) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function addDays(parts, delta) {
  const date = new Date(Date.UTC(parts.year, parts.month, parts.day + delta));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth(), day: date.getUTCDate() };
}

function weightedValues(rows, fallbacks, smoothing = []) {
  const weights = new Map();
  for (const row of rows || []) {
    const value = String(row.value || '').trim();
    if (value) weights.set(value, Math.max(1, Math.round(Number(row.count || 1))));
  }
  for (const value of fallbacks) if (!weights.has(value)) weights.set(value, 1);
  for (const value of smoothing) weights.set(value, (weights.get(value) || 0) + 4);
  return [...weights.entries()].flatMap(([value, count]) => Array.from({ length: count }, () => value));
}

function eventMetadata(eventName, extra = {}) {
  if (eventName === 'product_viewed') return { productId: 'demo_startup_product', ...extra };
  if (eventName === 'cta_click') return { cta: 'demo_product_discovery', ...extra };
  return extra;
}

function buildAnalytics30DayDataset({ now = new Date(), baseline = {} } = {}) {
  const random = createRandom();
  const aiUsersToAdd = needed(TARGETS.aiUsers.value, baseline.aiUsers);
  const checkoutUsersToAdd = needed(TARGETS.checkoutUsers.value, baseline.checkoutUsers);
  const buyersToAdd = needed(TARGETS.buyers.value, baseline.buyers);
  const aiBuyersToAdd = Math.min(buyersToAdd, aiUsersToAdd, needed(TARGETS.aiBuyers.value, baseline.aiBuyers));
  const visitorsToAdd = Math.max(
    needed(TARGETS.uniqueVisitors.value, baseline.uniqueVisitors),
    aiUsersToAdd,
    checkoutUsersToAdd,
    buyersToAdd,
    30,
  );
  const sessionsToAdd = Math.max(30, visitorsToAdd, needed(TARGETS.sessions.value, baseline.sessions));
  const pageViewsToAdd = Math.max(sessionsToAdd, needed(TARGETS.pageViews.value, baseline.pageViews));
  const aiInvocationsToAdd = Math.max(aiUsersToAdd, needed(TARGETS.aiInvocations.value, baseline.aiInvocations));

  const finalSessions = Number(baseline.sessions || 0) + sessionsToAdd;
  const targetBounces = Math.round((finalSessions * TARGETS.bounceRate.value) / 100);
  const bouncedToAdd = Math.max(0, Math.min(sessionsToAdd, targetBounces - Number(baseline.bouncedSessions || 0)));
  const pages = [...new Set((baseline.publicPages || []).filter((path) => path && !/^\/admin(?:\/|$)/.test(path)))];
  if (!pages.length) pages.push(...FALLBACK_PAGES);
  const sources = weightedValues(baseline.sources, ['Direct', 'Google', 'Facebook', 'Zalo'], ['Google', 'Facebook', 'Zalo']);
  const devices = weightedValues(baseline.devices, ['desktop', 'mobile', 'tablet'], ['mobile']);
  const visitors = Array.from({ length: visitorsToAdd }, (_, index) => `${NAMESPACE}anon_${String(index + 1).padStart(4, '0')}`);
  const today = getVietnamParts(now);
  const dayCounts = Array.from({ length: 30 }, () => 1);
  for (let index = 30; index < sessionsToAdd; index += 1) dayCounts[(index * 7 + 11) % 30] += 1;

  const sessions = [];
  const sessionByVisitor = new Map();
  let sessionIndex = 0;
  for (let dayIndex = 0; dayIndex < 30; dayIndex += 1) {
    const parts = addDays(today, dayIndex - 29);
    const dayStart = startOfVietnamDay(parts.year, parts.month, parts.day);
    for (let daySession = 0; daySession < dayCounts[dayIndex]; daySession += 1) {
      const anonymousId = visitors[sessionIndex % visitors.length];
      const startedAt = new Date(dayStart.getTime() + (8 * 60 + Math.floor(random() * 840)) * 60 * 1000);
      const sessionId = `${NAMESPACE}session_${String(sessionIndex + 1).padStart(4, '0')}`;
      const source = sources[Math.floor(random() * sources.length)];
      const landingPage = pages[Math.floor(random() * pages.length)];
      const session = {
        sessionId,
        anonymousId,
        userId: null,
        startedAt,
        lastActivityAt: new Date(startedAt.getTime() + 60 * 60 * 1000),
        endedAt: new Date(startedAt.getTime() + 60 * 60 * 1000),
        landingPage,
        exitPage: landingPage,
        source,
        medium: source === 'Direct' ? 'direct' : ['Facebook', 'Zalo'].includes(source) ? 'social' : 'organic',
        campaign: source === 'Direct' ? '' : 'startup_growth_30d',
        content: '',
        term: '',
        referrer: source === 'Direct' ? '' : `https://${source.toLowerCase()}.example/`,
        deviceType: devices[Math.floor(random() * devices.length)],
        browser: 'Chrome',
        os: 'Windows',
      };
      sessions.push(session);
      sessionByVisitor.set(anonymousId, session);
      sessionIndex += 1;
    }
  }

  const viewCounts = Array.from({ length: sessions.length }, (_, index) => (index < bouncedToAdd ? 1 : 2));
  let allocatedViews = viewCounts.reduce((sum, count) => sum + count, 0);
  const deepSessionIndexes = Array.from(
    { length: sessions.length - bouncedToAdd },
    (_, index) => index + bouncedToAdd,
  );
  for (let index = 0; allocatedViews < pageViewsToAdd; index = (index + 1) % deepSessionIndexes.length) {
    viewCounts[deepSessionIndexes[index]] += 1;
    allocatedViews += 1;
  }

  const pageViews = [];
  const events = [];
  let eventIndex = 0;
  function addEvent(session, eventName, minute, metadata = {}) {
    eventIndex += 1;
    events.push({
      eventId: `${NAMESPACE}event_${String(eventIndex).padStart(6, '0')}`,
      dedupeKey: `${NAMESPACE}dedupe_${String(eventIndex).padStart(6, '0')}`,
      eventName,
      eventType: EVENT_TYPE_BY_NAME[eventName],
      userId: null,
      anonymousId: session.anonymousId,
      sessionId: session.sessionId,
      pagePath: session.exitPage || session.landingPage,
      metadata: eventMetadata(eventName, metadata),
      createdAt: new Date(session.startedAt.getTime() + minute * 60 * 1000),
    });
  }

  sessions.forEach((session, index) => {
    for (let viewIndex = 0; viewIndex < viewCounts[index]; viewIndex += 1) {
      const pagePath = pages[(index + viewIndex) % pages.length];
      const createdAt = new Date(session.startedAt.getTime() + (2 + viewIndex * 5) * 60 * 1000);
      pageViews.push({
        sessionId: session.sessionId,
        userId: null,
        anonymousId: session.anonymousId,
        pagePath,
        pageTitle: `PawWorld ${pagePath}`,
        fullUrl: `https://pawworld.vn${pagePath}`,
        referrer: session.referrer,
        timeOnPage: 25 + ((index + viewIndex) % 145),
        createdAt,
      });
      session.exitPage = pagePath;
      addEvent(session, 'page_view', 2 + viewIndex * 5, { timeOnPage: 25 + ((index + viewIndex) % 145) });
    }
  });

  visitors.slice(0, Math.min(220, visitors.length)).forEach((visitor, index) => {
    const session = sessionByVisitor.get(visitor);
    addEvent(session, 'product_viewed', 12 + (index % 2));
  });
  visitors.slice(0, Math.min(140, visitors.length)).forEach((visitor, index) => {
    addEvent(sessionByVisitor.get(visitor), 'cta_click', 15 + (index % 2));
  });
  visitors.slice(0, Math.min(65, visitors.length)).forEach((visitor, index) => {
    addEvent(sessionByVisitor.get(visitor), 'add_to_cart', 18 + (index % 2), { productId: 'demo_startup_product' });
  });

  const aiVisitors = visitors.slice(0, aiUsersToAdd);
  const invocationByVisitor = new Map();
  for (let index = 0; index < aiInvocationsToAdd; index += 1) {
    const visitor = aiVisitors[index % aiVisitors.length];
    const session = sessionByVisitor.get(visitor);
    const invocation = invocationByVisitor.get(visitor) || 0;
    invocationByVisitor.set(visitor, invocation + 1);
    const minute = 22 + invocation * 6;
    const aiFeatureName = AI_FEATURES[index % AI_FEATURES.length];
    const metadata = { aiFeatureName, durationMs: 900 + ((index * 137) % 4301) };
    addEvent(session, 'ai_started', minute, { aiFeatureName });
    addEvent(session, 'ai_submitted', minute + 1, { aiFeatureName, inputLength: 40 + (index % 260) });
    addEvent(session, index % 13 === 0 ? 'ai_failed' : 'ai_completed', minute + 2, metadata);
  }

  const buyerVisitors = [
    ...aiVisitors.slice(0, aiBuyersToAdd),
    ...visitors.slice(aiUsersToAdd, aiUsersToAdd + Math.max(0, buyersToAdd - aiBuyersToAdd)),
  ];
  const checkoutSet = new Set(buyerVisitors);
  for (const visitor of visitors) {
    if (checkoutSet.size >= checkoutUsersToAdd) break;
    checkoutSet.add(visitor);
  }
  [...checkoutSet].forEach((visitor, index) => {
    addEvent(sessionByVisitor.get(visitor), 'checkout_started', 46, { cartValue: 320000 + (index % 8) * 45000 });
  });
  buyerVisitors.forEach((visitor, index) => {
    addEvent(sessionByVisitor.get(visitor), 'purchase_success', 52, { orderValue: 350000 + (index % 7) * 50000 });
  });

  const summary = {
    uniqueVisitors: Number(baseline.uniqueVisitors || 0) + visitors.length,
    sessions: Number(baseline.sessions || 0) + sessions.length,
    pageViews: Number(baseline.pageViews || 0) + pageViews.length,
    aiUsers: Number(baseline.aiUsers || 0) + aiVisitors.length,
    aiInvocations: Number(baseline.aiInvocations || 0) + aiInvocationsToAdd,
    checkoutUsers: Number(baseline.checkoutUsers || 0) + checkoutSet.size,
    buyers: Number(baseline.buyers || 0) + buyerVisitors.length,
    aiBuyers: Number(baseline.aiBuyers || 0) + aiBuyersToAdd,
    bouncedSessions: Number(baseline.bouncedSessions || 0) + bouncedToAdd,
  };
  summary.purchaseConversionRate = percent(summary.buyers, summary.uniqueVisitors);
  summary.bounceRate = percent(summary.bouncedSessions, summary.sessions);
  const dataset = { sessions, pageViews, events, summary };
  validateAnalyticsDataset(dataset);
  return dataset;
}

function validateAnalyticsDataset(dataset) {
  const sessionById = new Map();
  for (const session of dataset.sessions) {
    if (sessionById.has(session.sessionId)) throw new Error(`duplicate sessionId ${session.sessionId}`);
    if (!session.sessionId.startsWith(NAMESPACE) || !session.anonymousId.startsWith(NAMESPACE)) throw new Error('invalid namespace');
    sessionById.set(session.sessionId, session);
  }
  const eventIds = new Set();
  const dedupeKeys = new Set();
  const checkChild = (item) => {
    const session = sessionById.get(item.sessionId);
    if (!session) throw new Error(`missing session ${item.sessionId}`);
    if (item.anonymousId !== session.anonymousId || item.userId !== session.userId) throw new Error('identity mismatch');
    if (item.createdAt < session.startedAt || item.createdAt > session.lastActivityAt) throw new Error('timestamp outside session');
    if (/^\/admin(?:\/|$)/.test(item.pagePath)) throw new Error('admin path is not allowed');
  };
  dataset.pageViews.forEach(checkChild);
  for (const event of dataset.events) {
    checkChild(event);
    if (!ALLOWED_EVENT_NAMES.includes(event.eventName)) throw new Error(`invalid event ${event.eventName}`);
    if (eventIds.has(event.eventId) || dedupeKeys.has(event.dedupeKey)) throw new Error('duplicate event identifier');
    eventIds.add(event.eventId);
    dedupeKeys.add(event.dedupeKey);
  }
  const dayFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
  });
  if (new Set(dataset.sessions.map((item) => dayFormatter.format(item.startedAt))).size !== 30) throw new Error('dataset must cover 30 days');
  const eventsByIdentity = new Map();
  for (const event of dataset.events) {
    const values = eventsByIdentity.get(event.anonymousId) || [];
    values.push(event);
    eventsByIdentity.set(event.anonymousId, values);
  }
  for (const values of eventsByIdentity.values()) {
    const checkout = values.find((item) => item.eventName === 'checkout_started');
    const purchase = values.find((item) => item.eventName === 'purchase_success');
    if (purchase && !checkout) throw new Error('buyer must checkout');
    const firstAi = values.filter((item) => item.eventType === 'ai').sort((a, b) => a.createdAt - b.createdAt)[0];
    if (firstAi && purchase && firstAi.createdAt >= purchase.createdAt) throw new Error('AI must precede purchase');
  }
  return true;
}

module.exports = {
  AI_FEATURES,
  NAMESPACE,
  TARGETS,
  buildAnalytics30DayDataset,
  validateAnalyticsDataset,
};
