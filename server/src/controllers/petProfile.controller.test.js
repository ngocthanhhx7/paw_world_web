const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildOwnedProfileQuery,
  normalizeArray,
  normalizeProfilePayload,
} = require('./petProfile.controller');

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
