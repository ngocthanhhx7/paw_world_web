const AnalyticsEvent = require('../../models/AnalyticsEvent');
const AnalyticsPageView = require('../../models/AnalyticsPageView');
const AnalyticsSession = require('../../models/AnalyticsSession');
const { classifyTrafficSource } = require('./trafficSource');
const { sanitizeEventPayload } = require('./eventValidation');

function cleanString(value, max = 255) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function identityKeyOf(value) {
  if (!value) return '';
  const userId = cleanString(value.userId || value._id || '', 80);
  const anonymousId = cleanString(value.anonymousId || '', 120);
  return userId ? `user:${userId}` : anonymousId ? `anon:${anonymousId}` : '';
}

async function recordEvent(payload) {
  const sanitized = sanitizeEventPayload(payload);
  try {
    const event = await AnalyticsEvent.create(sanitized);
    return { event, duplicate: false };
  } catch (error) {
    if (error?.code === 11000) {
      return { event: null, duplicate: true };
    }
    throw error;
  }
}

function normalizeSessionPayload(body = {}) {
  const now = body.startedAt ? new Date(body.startedAt) : new Date();
  const fullUrl = cleanString(body.fullUrl, 1000);
  const classified = classifyTrafficSource({ fullUrl, referrer: body.referrer });
  return {
    sessionId: cleanString(body.sessionId, 120),
    anonymousId: cleanString(body.anonymousId, 120),
    userId: cleanString(body.userId, 80) || null,
    startedAt: Number.isNaN(now.getTime()) ? new Date() : now,
    lastActivityAt: Number.isNaN(now.getTime()) ? new Date() : now,
    landingPage: cleanString(body.landingPage || body.pagePath, 500),
    exitPage: cleanString(body.exitPage || body.pagePath, 500),
    source: cleanString(body.source, 120) || classified.source,
    medium: cleanString(body.medium, 120) || classified.medium,
    campaign: cleanString(body.campaign, 160) || classified.campaign,
    content: cleanString(body.content, 160) || classified.content,
    term: cleanString(body.term, 160) || classified.term,
    referrer: cleanString(body.referrer || classified.referrer, 1000),
    deviceType: cleanString(body.deviceType, 40) || 'unknown',
    browser: cleanString(body.browser, 80) || 'unknown',
    os: cleanString(body.os, 80) || 'unknown',
  };
}

async function upsertSession(body) {
  const payload = normalizeSessionPayload(body);
  if (!payload.sessionId) throw new Error('sessionId is required');
  if (!payload.anonymousId) throw new Error('anonymousId is required');

  const session = await AnalyticsSession.findOneAndUpdate(
    { sessionId: payload.sessionId },
    {
      $setOnInsert: {
        sessionId: payload.sessionId,
        anonymousId: payload.anonymousId,
        startedAt: payload.startedAt,
        landingPage: payload.landingPage,
        source: payload.source,
        medium: payload.medium,
        campaign: payload.campaign,
        content: payload.content,
        term: payload.term,
        referrer: payload.referrer,
        deviceType: payload.deviceType,
        browser: payload.browser,
        os: payload.os,
      },
      $set: {
        userId: payload.userId,
        lastActivityAt: payload.lastActivityAt,
        exitPage: payload.exitPage,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  return session;
}

async function recordPageView(body = {}) {
  const createdAt = body.createdAt ? new Date(body.createdAt) : new Date();
  if (Number.isNaN(createdAt.getTime())) throw new Error('timestamp is invalid');
  const pageView = await AnalyticsPageView.create({
    sessionId: cleanString(body.sessionId, 120),
    userId: cleanString(body.userId, 80) || null,
    anonymousId: cleanString(body.anonymousId, 120),
    pagePath: cleanString(body.pagePath, 500) || '/',
    pageTitle: cleanString(body.pageTitle, 300),
    fullUrl: cleanString(body.fullUrl, 1000),
    referrer: cleanString(body.referrer, 1000),
    timeOnPage: Math.max(0, Number(body.timeOnPage || 0)),
    createdAt,
  });

  await recordEvent({
    eventId: body.eventId,
    dedupeKey: body.dedupeKey,
    eventName: 'page_view',
    eventType: 'navigation',
    userId: body.userId,
    anonymousId: body.anonymousId,
    sessionId: body.sessionId,
    pagePath: body.pagePath,
    metadata: { pageTitle: body.pageTitle, fullUrl: body.fullUrl, timeOnPage: body.timeOnPage || 0 },
    createdAt,
  });

  await AnalyticsSession.updateOne(
    { sessionId: cleanString(body.sessionId, 120) },
    { $set: { lastActivityAt: createdAt, exitPage: cleanString(body.pagePath, 500) } },
  );

  return pageView;
}

module.exports = {
  identityKeyOf,
  recordEvent,
  recordPageView,
  upsertSession,
};
