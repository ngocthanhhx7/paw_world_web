import api from '@/api/client';
import {
  classifyTrafficSource,
  createAnalyticsId,
  getDeviceInfo,
  shouldStartNewSession,
} from './analyticsUtils';

const ANON_KEY = 'paw_analytics_anonymous_id';
const SESSION_KEY = 'paw_analytics_session';

function safeStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function getCurrentUrl() {
  if (typeof window === 'undefined') return '';
  return window.location.href;
}

function readSession() {
  const storage = safeStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSession(session) {
  const storage = safeStorage();
  if (!storage) return;
  storage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getAnonymousId() {
  const storage = safeStorage();
  if (!storage) return createAnalyticsId('anon');
  let value = storage.getItem(ANON_KEY);
  if (!value) {
    value = createAnalyticsId('anon');
    storage.setItem(ANON_KEY, value);
  }
  return value;
}

export function getAnalyticsContext(userId) {
  const now = Date.now();
  const current = readSession();
  const session = !current || shouldStartNewSession(current.lastActivityAt, now)
    ? { sessionId: createAnalyticsId('sess'), startedAt: now, lastActivityAt: now }
    : { ...current, lastActivityAt: now };
  writeSession(session);
  return {
    anonymousId: getAnonymousId(),
    sessionId: session.sessionId,
    userId: userId || null,
  };
}

async function safePost(url, payload) {
  try {
    await api.post(url, payload);
  } catch {
    // Analytics is best-effort and must never break the main UX.
  }
}

export const analyticsService = {
  getAnonymousId,
  getAnalyticsContext,

  async startSession({ pagePath = '/', userId = null } = {}) {
    if (typeof window === 'undefined') return;
    const context = getAnalyticsContext(userId);
    const source = classifyTrafficSource(getCurrentUrl(), document.referrer);
    const device = getDeviceInfo(navigator.userAgent);
    await safePost('/analytics/session/start', {
      ...context,
      ...source,
      ...device,
      landingPage: pagePath,
      pagePath,
      fullUrl: getCurrentUrl(),
      referrer: document.referrer || '',
      startedAt: new Date().toISOString(),
    });
  },

  async trackPageView({ pagePath, pageTitle, userId = null, timeOnPage = 0 } = {}) {
    if (typeof window === 'undefined') return;
    const context = getAnalyticsContext(userId);
    const eventId = createAnalyticsId('evt');
    await safePost('/analytics/page-view', {
      ...context,
      eventId,
      dedupeKey: `page:${context.sessionId}:${pagePath}:${Date.now()}`,
      pagePath,
      pageTitle: pageTitle || document.title || '',
      fullUrl: getCurrentUrl(),
      referrer: document.referrer || '',
      timeOnPage,
      createdAt: new Date().toISOString(),
    });
  },

  async trackEvent(eventName, metadata = {}, options = {}) {
    if (typeof window === 'undefined') return;
    const context = getAnalyticsContext(options.userId);
    await safePost('/analytics/event', {
      ...context,
      eventId: createAnalyticsId('evt'),
      dedupeKey: options.dedupeKey || '',
      eventName,
      eventType: options.eventType || '',
      pagePath: options.pagePath || window.location.pathname,
      metadata,
      createdAt: new Date().toISOString(),
    });
  },

  async heartbeat({ pagePath } = {}) {
    if (typeof window === 'undefined') return;
    const context = getAnalyticsContext();
    await safePost('/analytics/session/heartbeat', {
      sessionId: context.sessionId,
      pagePath: pagePath || window.location.pathname,
      endedAt: new Date().toISOString(),
    });
  },
};
