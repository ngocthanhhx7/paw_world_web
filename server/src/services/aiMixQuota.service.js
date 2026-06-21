const crypto = require('crypto');
const AiMixUsage = require('../models/AiMixUsage');

const AI_MIX_DEVICE_COOKIE = 'paw_ai_device_id';
const AI_MIX_DAILY_LIMIT = 3;
const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';
const DEVICE_COOKIE_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;
const USAGE_TTL_DAYS = 14;

function generateDeviceId() {
  return crypto.randomBytes(16).toString('hex');
}

function hashDeviceId(deviceId) {
  return crypto.createHash('sha256').update(String(deviceId)).digest('hex');
}

function getVietnamDateParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: VIETNAM_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

function getVietnamDateKey(now = new Date()) {
  const { year, month, day } = getVietnamDateParts(now);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getVietnamResetAt(now = new Date()) {
  const { year, month, day } = getVietnamDateParts(now);
  return new Date(Date.UTC(year, month - 1, day + 1, 17, 0, 0));
}

function getUsageExpiresAt(now = new Date()) {
  return new Date(getVietnamResetAt(now).getTime() + USAGE_TTL_DAYS * 24 * 60 * 60 * 1000);
}

function ensureDeviceCookie(req, res, options = {}) {
  const cookieName = options.cookieName || AI_MIX_DEVICE_COOKIE;
  let deviceId = req.cookies?.[cookieName];
  if (!deviceId) {
    deviceId = (options.generateDeviceId || generateDeviceId)();
    req.cookies = req.cookies || {};
    req.cookies[cookieName] = deviceId;
  }

  res.cookie(cookieName, deviceId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: DEVICE_COOKIE_MAX_AGE_MS,
  });

  return deviceId;
}

async function consumeAiMixQuota(req, res, customerId, options = {}) {
  const UsageModel = options.UsageModel || AiMixUsage;
  const now = options.now || new Date();
  const limit = Number(options.limit || AI_MIX_DAILY_LIMIT);
  const deviceId = ensureDeviceCookie(req, res, options);
  const deviceIdHash = hashDeviceId(deviceId);
  const dateKey = getVietnamDateKey(now);
  const resetAt = getVietnamResetAt(now);

  let usage = null;
  try {
    usage = await UsageModel.findOneAndUpdate(
      { deviceIdHash, dateKey, count: { $lt: limit } },
      {
        $inc: { count: 1 },
        $set: { lastCustomer: customerId || null },
        $setOnInsert: { deviceIdHash, dateKey, expiresAt: getUsageExpiresAt(now) },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  } catch (err) {
    if (err?.code !== 11000) throw err;
  }

  const consumed = Boolean(usage);
  if (!usage) {
    usage = await UsageModel.findOne({ deviceIdHash, dateKey });
  }

  if (!consumed) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt,
    };
  }

  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - Number(usage.count || 0)),
    resetAt,
  };
}

module.exports = {
  AI_MIX_DAILY_LIMIT,
  AI_MIX_DEVICE_COOKIE,
  consumeAiMixQuota,
  ensureDeviceCookie,
  getVietnamDateKey,
  getVietnamResetAt,
  hashDeviceId,
};
