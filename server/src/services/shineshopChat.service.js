const { buildProviderMessages } = require('./chatbotPrompt');

const DEFAULT_BASE_URL = 'https://api.shineshop.dev/v1';
const DEFAULT_MAX_TOKENS = 900;
const DEFAULT_TEMPERATURE = 0.35;

function readPositiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readChatbotConfig(env = process.env) {
  const apiKey = (env.SHINESHOP_DEV_API_KEY || '').trim();
  const model = (env.SHINESHOP_DEV_MODEL || '').trim();

  if (!apiKey) {
    throw new Error('SHINESHOP_DEV_API_KEY is required for PAWWORLD GENIUS AI');
  }

  if (!model) {
    throw new Error('SHINESHOP_DEV_MODEL is required for PAWWORLD GENIUS AI');
  }

  return {
    apiKey,
    model,
    baseUrl: (env.SHINESHOP_DEV_BASE_URL || DEFAULT_BASE_URL).trim().replace(/\/+$/, ''),
    maxTokens: readPositiveNumber(env.CHATBOT_MAX_TOKENS, DEFAULT_MAX_TOKENS),
    temperature: readPositiveNumber(env.CHATBOT_TEMPERATURE, DEFAULT_TEMPERATURE),
  };
}

function buildChatCompletionPayload({ model, maxTokens, temperature, messages, image }) {
  return {
    model,
    stream: true,
    messages: buildProviderMessages({ messages, image }),
    max_tokens: maxTokens,
    temperature,
  };
}

function parseOpenAIStreamChunk(chunk) {
  const events = [];
  const blocks = String(chunk)
    .replace(/\r\n/g, '\n')
    .split('\n\n')
    .filter((block) => block.trim().length > 0);

  for (const block of blocks) {
    const dataLines = block
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trim());

    if (dataLines.length === 0) continue;

    const data = dataLines.join('\n');
    if (data === '[DONE]') {
      events.push({ type: 'done' });
      continue;
    }

    try {
      const parsed = JSON.parse(data);
      const content =
        parsed?.choices?.[0]?.delta?.content ||
        parsed?.choices?.[0]?.message?.content ||
        parsed?.delta?.content ||
        '';

      if (content) {
        events.push({ type: 'token', content });
      } else if (parsed?.error) {
        events.push({
          type: 'error',
          message: parsed.error.message || 'AI provider stream error',
        });
      }
    } catch (error) {
      events.push({ type: 'error', message: 'Could not parse AI provider stream event' });
    }
  }

  return events;
}

function extractCompleteBlocks(buffer) {
  const normalized = buffer.replace(/\r\n/g, '\n');
  const lastBoundary = normalized.lastIndexOf('\n\n');
  if (lastBoundary === -1) {
    return { complete: '', rest: normalized };
  }

  return {
    complete: normalized.slice(0, lastBoundary + 2),
    rest: normalized.slice(lastBoundary + 2),
  };
}

async function streamChatCompletion({ messages, image, onToken, signal, fetchImpl = fetch, env } = {}) {
  const config = readChatbotConfig(env);
  const payload = buildChatCompletionPayload({
    model: config.model,
    maxTokens: config.maxTokens,
    temperature: config.temperature,
    messages,
    image,
  });

  const response = await fetchImpl(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`AI provider request failed with ${response.status}${body ? `: ${body}` : ''}`);
  }

  if (!response.body || typeof response.body.getReader !== 'function') {
    throw new Error('AI provider did not return a readable stream');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const { complete, rest } = extractCompleteBlocks(buffer);
    buffer = rest;

    for (const event of parseOpenAIStreamChunk(complete)) {
      if (event.type === 'token') onToken?.(event.content);
      if (event.type === 'error') throw new Error(event.message);
      if (event.type === 'done') return;
    }
  }

  buffer += decoder.decode();
  for (const event of parseOpenAIStreamChunk(buffer)) {
    if (event.type === 'token') onToken?.(event.content);
    if (event.type === 'error') throw new Error(event.message);
  }
}

module.exports = {
  readChatbotConfig,
  buildChatCompletionPayload,
  parseOpenAIStreamChunk,
  streamChatCompletion,
};
