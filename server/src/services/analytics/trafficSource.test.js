const assert = require('node:assert/strict');
const test = require('node:test');

const { classifyTrafficSource } = require('./trafficSource');

test('classifyTrafficSource prefers UTM values over referrer', () => {
  const result = classifyTrafficSource({
    fullUrl: 'https://pawworld.vn/?utm_source=newsletter&utm_medium=email&utm_campaign=july&utm_content=hero&utm_term=cat-food',
    referrer: 'https://facebook.com/some-page',
  });

  assert.deepEqual(result, {
    source: 'newsletter',
    medium: 'email',
    campaign: 'july',
    content: 'hero',
    term: 'cat-food',
    referrer: 'https://facebook.com/some-page',
  });
});

test('classifyTrafficSource maps social and search referrers', () => {
  assert.equal(classifyTrafficSource({ fullUrl: 'https://pawworld.vn/', referrer: 'https://l.facebook.com/' }).source, 'Facebook');
  assert.equal(classifyTrafficSource({ fullUrl: 'https://pawworld.vn/?fbclid=abc', referrer: '' }).source, 'Facebook');
  assert.equal(classifyTrafficSource({ fullUrl: 'https://pawworld.vn/', referrer: 'https://zalo.me/pawworld' }).source, 'Zalo');
  assert.equal(classifyTrafficSource({ fullUrl: 'https://pawworld.vn/', referrer: 'https://www.google.com/search?q=cat' }).source, 'Google');
});

test('classifyTrafficSource returns Direct without referrer and Other Referral for unknown domains', () => {
  assert.deepEqual(classifyTrafficSource({ fullUrl: 'https://pawworld.vn/', referrer: '' }), {
    source: 'Direct',
    medium: 'direct',
    campaign: '',
    content: '',
    term: '',
    referrer: '',
  });

  assert.equal(
    classifyTrafficSource({ fullUrl: 'https://pawworld.vn/', referrer: 'https://partner.example/blog' }).source,
    'Other Referral',
  );
});
