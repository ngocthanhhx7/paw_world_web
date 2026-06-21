const assert = require('node:assert/strict');
const test = require('node:test');

const {
  AI_MIX_DEVICE_COOKIE,
  AI_MIX_DAILY_LIMIT,
  consumeAiMixQuota,
  getVietnamDateKey,
} = require('./aiMixQuota.service');

function createRes() {
  return {
    cookies: [],
    cookie(name, value, options) {
      this.cookies.push({ name, value, options });
      return this;
    },
  };
}

function createUsageModel() {
  const records = new Map();
  const keyFor = (query) => `${query.deviceIdHash}:${query.dateKey}`;

  return {
    records,
    async findOneAndUpdate(query, update) {
      const key = keyFor(query);
      const existing = records.get(key);
      if (existing && existing.count >= query.count.$lt) return null;
      const next = existing || {
        deviceIdHash: query.deviceIdHash,
        dateKey: query.dateKey,
        count: 0,
      };
      next.count += update.$inc.count;
      if (update.$set) Object.assign(next, update.$set);
      if (update.$setOnInsert) {
        for (const [field, value] of Object.entries(update.$setOnInsert)) {
          if (next[field] === undefined) next[field] = value;
        }
      }
      records.set(key, next);
      return next;
    },
    async findOne(query) {
      return records.get(keyFor(query)) || null;
    },
  };
}

test('getVietnamDateKey uses the Asia/Ho_Chi_Minh calendar day', () => {
  assert.equal(getVietnamDateKey(new Date('2026-06-20T18:00:00.000Z')), '2026-06-21');
});

test('consumeAiMixQuota allows three uses per device per Vietnam day then blocks the fourth', async () => {
  const UsageModel = createUsageModel();
  const now = new Date('2026-06-21T03:00:00.000Z');
  const req = { cookies: { [AI_MIX_DEVICE_COOKIE]: 'device-a' } };

  const first = await consumeAiMixQuota(req, createRes(), 'customer-1', { UsageModel, now });
  const second = await consumeAiMixQuota(req, createRes(), 'customer-1', { UsageModel, now });
  const third = await consumeAiMixQuota(req, createRes(), 'customer-1', { UsageModel, now });
  const fourth = await consumeAiMixQuota(req, createRes(), 'customer-1', { UsageModel, now });

  assert.equal(first.allowed, true);
  assert.equal(first.remaining, 2);
  assert.equal(second.remaining, 1);
  assert.equal(third.remaining, 0);
  assert.equal(fourth.allowed, false);
  assert.equal(fourth.limit, AI_MIX_DAILY_LIMIT);
  assert.equal(fourth.remaining, 0);
  assert.equal(UsageModel.records.size, 1);
  assert.equal([...UsageModel.records.values()][0].count, 3);
});

test('consumeAiMixQuota creates a device cookie when the request has none', async () => {
  const UsageModel = createUsageModel();
  const req = { cookies: {} };
  const res = createRes();

  const result = await consumeAiMixQuota(req, res, 'customer-1', {
    UsageModel,
    now: new Date('2026-06-21T03:00:00.000Z'),
    generateDeviceId: () => 'new-device-id',
  });

  assert.equal(result.allowed, true);
  assert.equal(req.cookies[AI_MIX_DEVICE_COOKIE], 'new-device-id');
  assert.equal(res.cookies[0].name, AI_MIX_DEVICE_COOKIE);
  assert.equal(res.cookies[0].value, 'new-device-id');
  assert.equal(res.cookies[0].options.httpOnly, true);
  assert.equal(res.cookies[0].options.sameSite, 'lax');
});

test('consumeAiMixQuota resets counts across devices and Vietnam days', async () => {
  const UsageModel = createUsageModel();
  const dayOne = new Date('2026-06-21T03:00:00.000Z');
  const dayTwo = new Date('2026-06-22T03:00:00.000Z');

  for (let index = 0; index < AI_MIX_DAILY_LIMIT; index += 1) {
    await consumeAiMixQuota({ cookies: { [AI_MIX_DEVICE_COOKIE]: 'device-a' } }, createRes(), 'customer-1', { UsageModel, now: dayOne });
  }

  const otherDevice = await consumeAiMixQuota({ cookies: { [AI_MIX_DEVICE_COOKIE]: 'device-b' } }, createRes(), 'customer-1', { UsageModel, now: dayOne });
  const nextDay = await consumeAiMixQuota({ cookies: { [AI_MIX_DEVICE_COOKIE]: 'device-a' } }, createRes(), 'customer-1', { UsageModel, now: dayTwo });

  assert.equal(otherDevice.allowed, true);
  assert.equal(otherDevice.remaining, 2);
  assert.equal(nextDay.allowed, true);
  assert.equal(nextDay.remaining, 2);
  assert.equal(UsageModel.records.size, 3);
});
