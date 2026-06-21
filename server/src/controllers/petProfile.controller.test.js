const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildOwnedProfileQuery,
  normalizeArray,
  normalizeProfilePayload,
  parseRecommendationDurationDays,
} = require('./petProfile.controller');
const petProfileController = require('./petProfile.controller');
const PetProfile = require('../models/PetProfile');

function createMockRes() {
  return {
    statusCode: 200,
    body: null,
    cookies: [],
    cookie(name, value, options) {
      this.cookies.push({ name, value, options });
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test('buildOwnedProfileQuery scopes profile id to customer id', () => {
  const query = buildOwnedProfileQuery('profile-id', 'customer-id');
  assert.deepEqual(query, { _id: 'profile-id', customer: 'customer-id' });
});

test('normalizeArray accepts arrays and comma separated strings', () => {
  assert.deepEqual(normalizeArray([' tuna ', '', 'chicken']), ['tuna', 'chicken']);
  assert.deepEqual(normalizeArray('fish, chicken,  '), ['fish', 'chicken']);
});

test('normalizeProfilePayload trims strings and applies defaults', () => {
  const payload = normalizeProfilePayload({
    name: ' Pun ',
    sex: 'female',
    allergies: 'fish, shrimp',
    healthGoals: ['digestion', ' teeth '],
  });

  assert.equal(payload.name, 'Pun');
  assert.equal(payload.activityLevel, 'active');
  assert.equal(payload.weightGoal, 'maintain');
  assert.equal(payload.currentFoodType, 'mixed');
  assert.deepEqual(payload.allergies, ['fish', 'shrimp']);
  assert.deepEqual(payload.healthGoals, ['digestion', 'teeth']);
});

test('parseRecommendationDurationDays accepts only supported combo durations', () => {
  assert.equal(parseRecommendationDurationDays({ durationDays: 1 }), 1);
  assert.equal(parseRecommendationDurationDays({ durationDays: '7' }), 7);
  assert.equal(parseRecommendationDurationDays({ durationDays: 30 }), 30);
  assert.throws(() => parseRecommendationDurationDays({ durationDays: 2 }), /durationDays/);
  assert.throws(() => parseRecommendationDurationDays({ durationDays: null }), /durationDays/);
});

test('recommendation returns 429 and skips AI when device quota is exhausted', async () => {
  assert.equal(typeof petProfileController.__setRecommendationDepsForTest, 'function');

  const originalFindOne = PetProfile.findOne;
  let aiCalls = 0;
  let quotaCalls = 0;

  PetProfile.findOne = async (query) => {
    assert.deepEqual(query, { _id: 'profile-id', customer: 'customer-id' });
    return { _id: 'profile-id', name: 'Pun', save: async () => undefined };
  };

  petProfileController.__setRecommendationDepsForTest({
    consumeAiMixQuota: async () => {
      quotaCalls += 1;
      return {
        allowed: false,
        limit: 3,
        remaining: 0,
        resetAt: new Date('2026-06-21T17:00:00.000Z'),
      };
    },
    buildRecommendationForProfile: async () => {
      aiCalls += 1;
      throw new Error('AI should not be called');
    },
  });

  try {
    const res = createMockRes();
    await petProfileController.recommendation(
      {
        params: { id: 'profile-id' },
        body: { durationDays: 7 },
        customer: { _id: 'customer-id' },
        cookies: { paw_ai_device_id: 'device-id' },
      },
      res,
    );

    assert.equal(res.statusCode, 429);
    assert.equal(res.body.limit, 3);
    assert.equal(res.body.remaining, 0);
    assert.match(res.body.message, /3 lượt AI mix hôm nay/);
    assert.equal(quotaCalls, 1);
    assert.equal(aiCalls, 0);
  } finally {
    PetProfile.findOne = originalFindOne;
    petProfileController.__setRecommendationDepsForTest(null);
  }
});
