const assert = require('node:assert/strict');
const test = require('node:test');

const { sanitizeEventPayload, ALLOWED_EVENT_NAMES } = require('./eventValidation');

test('sanitizeEventPayload accepts a valid analytics event and strips oversized metadata', () => {
  const payload = sanitizeEventPayload({
    eventId: 'evt_123',
    eventName: 'ai_completed',
    eventType: 'ai',
    anonymousId: 'anon_123',
    sessionId: 'sess_123',
    userId: '507f1f77bcf86cd799439011',
    pagePath: '/meow-quizz/ket-qua/1',
    metadata: {
      inputLength: 320,
      rawPrompt: 'x'.repeat(3000),
    },
    createdAt: '2026-07-02T01:00:00.000Z',
  });

  assert.equal(payload.eventName, 'ai_completed');
  assert.equal(payload.metadata.inputLength, 320);
  assert.equal(payload.metadata.rawPrompt.length, 1000);
  assert.ok(payload.createdAt instanceof Date);
});

test('sanitizeEventPayload rejects unknown event names and missing visitor identity', () => {
  assert.ok(ALLOWED_EVENT_NAMES.includes('purchase_success'));
  assert.throws(() => sanitizeEventPayload({ eventName: 'unknown', anonymousId: 'anon_1', sessionId: 'sess_1' }), /Invalid eventName/);
  assert.throws(() => sanitizeEventPayload({ eventName: 'page_view', sessionId: 'sess_1' }), /anonymousId is required/);
});
