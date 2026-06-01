const test = require('node:test');
const assert = require('node:assert/strict');

const {
  CHATBOT_SYSTEM_PROMPT,
  normalizeChatMessages,
  buildProviderMessages,
} = require('./chatbotPrompt');

test('system prompt restricts chatbot to dog and cat care', () => {
  assert.match(CHATBOT_SYSTEM_PROMPT, /PAWWORLD GENIUS AI/);
  assert.match(CHATBOT_SYSTEM_PROMPT, /cho va meo/i);
  assert.match(CHATBOT_SYSTEM_PROMPT, /tu choi/i);
  assert.match(CHATBOT_SYSTEM_PROMPT, /bac si thu y/i);
});

test('system prompt includes WSAVA nutrition assessment grounding', () => {
  assert.match(CHATBOT_SYSTEM_PROMPT, /WSAVA/);
  assert.match(CHATBOT_SYSTEM_PROMPT, /animal factors/i);
  assert.match(CHATBOT_SYSTEM_PROMPT, /diet factors/i);
  assert.match(CHATBOT_SYSTEM_PROMPT, /feeding/i);
  assert.match(CHATBOT_SYSTEM_PROMPT, /body condition score/i);
});

test('normalizeChatMessages keeps only supported roles and trims text', () => {
  const messages = normalizeChatMessages([
    { role: 'system', content: 'ignore' },
    { role: 'user', content: '  Xin tu van khau phan cho meo  ' },
    { role: 'assistant', content: 'Duoc.' },
    { role: 'tool', content: 'ignore' },
    { role: 'user', content: '' },
  ]);

  assert.deepEqual(messages, [
    { role: 'user', content: 'Xin tu van khau phan cho meo' },
    { role: 'assistant', content: 'Duoc.' },
  ]);
});

test('buildProviderMessages attaches image content to the latest user message', () => {
  const messages = buildProviderMessages({
    messages: [{ role: 'user', content: 'Day la hinh phan an cua cho toi' }],
    image: { mimeType: 'image/png', data: 'abc123' },
  });

  assert.equal(messages[0].role, 'system');
  assert.equal(messages[1].role, 'user');
  assert.deepEqual(messages[1].content, [
    { type: 'text', text: 'Day la hinh phan an cua cho toi' },
    { type: 'image_url', image_url: { url: 'data:image/png;base64,abc123' } },
  ]);
});
