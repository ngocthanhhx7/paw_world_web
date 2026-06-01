const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildChatCompletionPayload,
  parseOpenAIStreamChunk,
  readChatbotConfig,
} = require('./shineshopChat.service');

test('readChatbotConfig requires API key and model', () => {
  assert.throws(
    () => readChatbotConfig({ SHINESHOP_DEV_API_KEY: '', SHINESHOP_DEV_MODEL: '' }),
    /SHINESHOP_DEV_API_KEY/,
  );
});

test('buildChatCompletionPayload creates streaming OpenAI-compatible payload', () => {
  const payload = buildChatCompletionPayload({
    model: 'codex/gpt5.5',
    maxTokens: 500,
    temperature: 0.2,
    messages: [{ role: 'user', content: 'Cho con nen an gi?' }],
  });

  assert.equal(payload.model, 'codex/gpt5.5');
  assert.equal(payload.stream, true);
  assert.equal(payload.max_tokens, 500);
  assert.equal(payload.temperature, 0.2);
  assert.equal(payload.messages[0].role, 'system');
  assert.equal(payload.messages[1].role, 'user');
});

test('parseOpenAIStreamChunk ignores comments and extracts content tokens', () => {
  const events = parseOpenAIStreamChunk(
    ': keep-alive\n\n' +
      'data: {"choices":[{"delta":{"content":"Xin "}}]}\n\n' +
      'data: {"choices":[{"delta":{"content":"chao"}}]}\n\n' +
      'data: [DONE]\n\n',
  );

  assert.deepEqual(events, [
    { type: 'token', content: 'Xin ' },
    { type: 'token', content: 'chao' },
    { type: 'done' },
  ]);
});
