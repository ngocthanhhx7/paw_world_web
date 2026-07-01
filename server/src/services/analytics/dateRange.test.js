const assert = require('node:assert/strict');
const test = require('node:test');

const { parseDateRange } = require('./dateRange');

test('parseDateRange returns Asia Ho Chi Minh day boundaries for today', () => {
  const range = parseDateRange({ preset: 'today' }, new Date('2026-07-02T10:15:00+07:00'));

  assert.equal(range.start.toISOString(), '2026-07-01T17:00:00.000Z');
  assert.equal(range.end.toISOString(), '2026-07-02T16:59:59.999Z');
  assert.equal(range.label, 'Today');
});

test('parseDateRange supports custom inclusive day range', () => {
  const range = parseDateRange({ preset: 'custom', startDate: '2026-07-01', endDate: '2026-07-03' });

  assert.equal(range.start.toISOString(), '2026-06-30T17:00:00.000Z');
  assert.equal(range.end.toISOString(), '2026-07-03T16:59:59.999Z');
});

test('parseDateRange rejects invalid custom range', () => {
  assert.throws(
    () => parseDateRange({ preset: 'custom', startDate: '2026-07-05', endDate: '2026-07-03' }),
    /Invalid date range/,
  );
});
