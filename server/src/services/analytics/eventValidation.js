const ALLOWED_EVENT_NAMES = [
  'page_view',
  'cta_click',
  'ai_started',
  'ai_submitted',
  'ai_completed',
  'ai_failed',
  'product_viewed',
  'add_to_cart',
  'checkout_started',
  'purchase_success',
  'purchase_failed',
  'admin_report_generated',
];

const EVENT_TYPE_BY_NAME = {
  page_view: 'navigation',
  cta_click: 'engagement',
  ai_started: 'ai',
  ai_submitted: 'ai',
  ai_completed: 'ai',
  ai_failed: 'ai',
  product_viewed: 'commerce',
  add_to_cart: 'commerce',
  checkout_started: 'commerce',
  purchase_success: 'commerce',
  purchase_failed: 'commerce',
  admin_report_generated: 'admin',
};

function cleanString(value, max = 255) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function sanitizeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return {};
  return Object.entries(metadata)
    .slice(0, 60)
    .reduce((result, [key, value]) => {
      const cleanKey = cleanString(key, 80);
      if (!cleanKey) return result;
      if (typeof value === 'string') result[cleanKey] = value.slice(0, 1000);
      else if (typeof value === 'number' && Number.isFinite(value)) result[cleanKey] = value;
      else if (typeof value === 'boolean' || value == null) result[cleanKey] = value;
      else if (Array.isArray(value)) result[cleanKey] = value.slice(0, 20).map((item) => cleanString(String(item), 200));
      else if (typeof value === 'object') result[cleanKey] = JSON.parse(JSON.stringify(value)).toString?.() === '[object Object]' ? value : {};
      return result;
    }, {});
}

function parseCreatedAt(value) {
  if (!value) return new Date();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('timestamp is invalid');
  return date;
}

function sanitizeEventPayload(payload = {}) {
  const eventName = cleanString(payload.eventName, 80);
  if (!ALLOWED_EVENT_NAMES.includes(eventName)) throw new Error('Invalid eventName');

  const anonymousId = cleanString(payload.anonymousId, 120);
  const sessionId = cleanString(payload.sessionId, 120);
  if (!anonymousId) throw new Error('anonymousId is required');
  if (!sessionId) throw new Error('sessionId is required');

  const userId = cleanString(payload.userId, 80);
  if (userId && !/^[0-9a-fA-F]{24}$/.test(userId)) throw new Error('userId is invalid');

  return {
    eventId: cleanString(payload.eventId, 120) || `${eventName}_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    dedupeKey: cleanString(payload.dedupeKey, 160),
    eventName,
    eventType: cleanString(payload.eventType, 80) || EVENT_TYPE_BY_NAME[eventName],
    userId: userId || null,
    anonymousId,
    sessionId,
    pagePath: cleanString(payload.pagePath, 500),
    metadata: sanitizeMetadata(payload.metadata),
    createdAt: parseCreatedAt(payload.createdAt || payload.timestamp),
  };
}

module.exports = {
  ALLOWED_EVENT_NAMES,
  EVENT_TYPE_BY_NAME,
  sanitizeEventPayload,
  sanitizeMetadata,
};
