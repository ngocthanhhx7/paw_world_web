const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildChatCompletionPayload,
  parseOpenAIStreamChunk,
  readChatbotConfig,
  streamChatCompletion,
} = require('./shineshopChat.service');

const encoder = new TextEncoder();

function createSseStream(content = 'Xin chao') {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: {"choices":[{"delta":{"content":"${content}"}}]}\n\n`));
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
}

function createBrokenStream() {
  return {
    getReader() {
      return {
        read: async () => {
          throw new Error('stream broke');
        },
      };
    },
  };
}

test('readChatbotConfig requires at least one configured provider', () => {
  assert.throws(
    () =>
      readChatbotConfig({
        SHINESHOP_DEV_API_KEY: '',
        SHINESHOP_DEV_MODEL: '',
        GEMINI_API_KEY: '',
        GEMINI_MODEL: '',
      }),
    /SHINESHOP_DEV_API_KEY.*GEMINI_API_KEY/,
  );
});

test('readChatbotConfig reads ShineShop first and Gemini second when both are configured', () => {
  const config = readChatbotConfig({
    SHINESHOP_DEV_API_KEY: 'shine-key',
    SHINESHOP_DEV_BASE_URL: 'https://shine.example/v1/',
    SHINESHOP_DEV_MODEL: 'shine-model',
    GEMINI_API_KEY: 'gemini-key',
    GEMINI_BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    GEMINI_MODEL: 'gemini-3.1-flash-lite',
    CHATBOT_PROVIDER_TIMEOUT_MS: '15000',
  });

  assert.deepEqual(
    config.providers.map((provider) => ({
      name: provider.name,
      apiKey: provider.apiKey,
      baseUrl: provider.baseUrl,
      model: provider.model,
    })),
    [
      {
        name: 'ShineShop',
        apiKey: 'shine-key',
        baseUrl: 'https://shine.example/v1',
        model: 'shine-model',
      },
      {
        name: 'Gemini',
        apiKey: 'gemini-key',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
        model: 'gemini-3.1-flash-lite',
      },
    ],
  );
  assert.equal(config.providerTimeoutMs, 15000);
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

test('streamChatCompletion falls back to Gemini after ShineShop HTTP failure', async () => {
  const calls = [];
  const tokens = [];

  await streamChatCompletion({
    messages: [{ role: 'user', content: 'Tu van thuc an cho meo' }],
    onToken: (token) => tokens.push(token),
    env: {
      SHINESHOP_DEV_API_KEY: 'shine-key',
      SHINESHOP_DEV_BASE_URL: 'https://api.shineshop.dev/v1',
      SHINESHOP_DEV_MODEL: 'shine-model',
      GEMINI_API_KEY: 'gemini-key',
      GEMINI_BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/openai',
      GEMINI_MODEL: 'gemini-3.1-flash-lite',
    },
    fetchImpl: async (url, options) => {
      calls.push({ url, body: JSON.parse(options.body) });
      if (calls.length === 1) {
        return { ok: false, status: 503, text: async () => 'temporary outage' };
      }
      return { ok: true, body: createSseStream('Gemini token') };
    },
  });

  assert.deepEqual(calls.map((call) => call.url), [
    'https://api.shineshop.dev/v1/chat/completions',
    'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
  ]);
  assert.equal(calls[1].body.model, 'gemini-3.1-flash-lite');
  assert.deepEqual(tokens, ['Gemini token']);
});

test('streamChatCompletion falls back to Gemini after ShineShop stream read failure', async () => {
  const calls = [];
  const tokens = [];

  await streamChatCompletion({
    messages: [{ role: 'user', content: 'Tu van thuc an cho meo' }],
    onToken: (token) => tokens.push(token),
    env: {
      SHINESHOP_DEV_API_KEY: 'shine-key',
      SHINESHOP_DEV_MODEL: 'shine-model',
      GEMINI_API_KEY: 'gemini-key',
      GEMINI_MODEL: 'gemini-3.1-flash-lite',
    },
    fetchImpl: async (url) => {
      calls.push(url);
      if (calls.length === 1) {
        return { ok: true, body: createBrokenStream() };
      }
      return { ok: true, body: createSseStream('Recovered') };
    },
  });

  assert.deepEqual(calls, [
    'https://api.shineshop.dev/v1/chat/completions',
    'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
  ]);
  assert.deepEqual(tokens, ['Recovered']);
});

test('streamChatCompletion does not call Gemini when ShineShop succeeds', async () => {
  const calls = [];
  const tokens = [];

  await streamChatCompletion({
    messages: [{ role: 'user', content: 'Tu van thuc an cho meo' }],
    onToken: (token) => tokens.push(token),
    env: {
      SHINESHOP_DEV_API_KEY: 'shine-key',
      SHINESHOP_DEV_MODEL: 'shine-model',
      GEMINI_API_KEY: 'gemini-key',
      GEMINI_MODEL: 'gemini-3.1-flash-lite',
    },
    fetchImpl: async (url) => {
      calls.push(url);
      return { ok: true, body: createSseStream('Shine token') };
    },
  });

  assert.deepEqual(calls, ['https://api.shineshop.dev/v1/chat/completions']);
  assert.deepEqual(tokens, ['Shine token']);
});
