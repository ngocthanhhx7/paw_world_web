const { buildProviderMessages } = require('./chatbotPrompt');

const DEFAULT_BASE_URL = 'https://api.shineshop.dev/v1';
const DEFAULT_GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai';
const DEFAULT_GEMINI_MODEL = 'gemini-3.1-flash-lite';
const DEFAULT_MAX_TOKENS = 900;
const DEFAULT_TEMPERATURE = 0.35;
const DEFAULT_PROVIDER_TIMEOUT_MS = 30000;

function readPositiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readChatbotConfig(env = process.env) {
  const providers = [];
  const shineShopApiKey = (env.SHINESHOP_DEV_API_KEY || '').trim();
  const shineShopModel = (env.SHINESHOP_DEV_MODEL || '').trim();
  const geminiApiKey = (env.GEMINI_API_KEY || '').trim();
  const geminiModel = (env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL).trim();

  if (shineShopApiKey && shineShopModel) {
    providers.push({
      name: 'ShineShop',
      apiKey: shineShopApiKey,
      model: shineShopModel,
      baseUrl: (env.SHINESHOP_DEV_BASE_URL || DEFAULT_BASE_URL).trim().replace(/\/+$/, ''),
    });
  }

  if (geminiApiKey && geminiModel) {
    providers.push({
      name: 'Gemini',
      apiKey: geminiApiKey,
      model: geminiModel,
      baseUrl: (env.GEMINI_BASE_URL || DEFAULT_GEMINI_BASE_URL).trim().replace(/\/+$/, ''),
    });
  }

  if (providers.length === 0) {
    throw new Error(
      'PAWWORLD GENIUS AI requires SHINESHOP_DEV_API_KEY/SHINESHOP_DEV_MODEL or GEMINI_API_KEY/GEMINI_MODEL',
    );
  }

  const primaryProvider = providers[0];
  return {
    providers,
    apiKey: primaryProvider.apiKey,
    model: primaryProvider.model,
    baseUrl: primaryProvider.baseUrl,
    maxTokens: readPositiveNumber(env.CHATBOT_MAX_TOKENS, DEFAULT_MAX_TOKENS),
    temperature: readPositiveNumber(env.CHATBOT_TEMPERATURE, DEFAULT_TEMPERATURE),
    providerTimeoutMs: readPositiveNumber(env.CHATBOT_PROVIDER_TIMEOUT_MS, DEFAULT_PROVIDER_TIMEOUT_MS),
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

function createAbortError(message) {
  const error = new Error(message);
  error.name = 'AbortError';
  return error;
}

function createProviderAbortController(externalSignal, timeoutMs, providerName) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(createAbortError(`${providerName} request timed out after ${timeoutMs}ms`));
  }, timeoutMs);

  const onExternalAbort = () => {
    controller.abort(externalSignal.reason || createAbortError('AI provider request was aborted'));
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      onExternalAbort();
    } else {
      externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }
  }

  return {
    signal: controller.signal,
    cleanup() {
      clearTimeout(timeoutId);
      externalSignal?.removeEventListener?.('abort', onExternalAbort);
    },
  };
}

function abortable(promise, signal, providerName) {
  if (!signal) return promise;
  if (signal.aborted) {
    return Promise.reject(signal.reason || createAbortError(`${providerName} request was aborted`));
  }

  return new Promise((resolve, reject) => {
    const onAbort = () => {
      reject(signal.reason || createAbortError(`${providerName} request was aborted`));
    };

    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener('abort', onAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener('abort', onAbort);
        reject(error);
      },
    );
  });
}

async function streamProviderCompletion({ provider, payload, onToken, signal, fetchImpl, timeoutMs }) {
  const providerAbort = createProviderAbortController(signal, timeoutMs, provider.name);
  try {
    const response = await abortable(
      fetchImpl(`${provider.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(payload),
        signal: providerAbort.signal,
      }),
      providerAbort.signal,
      provider.name,
    );

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`${provider.name} request failed with ${response.status}${body ? `: ${body}` : ''}`);
    }

    if (!response.body || typeof response.body.getReader !== 'function') {
      throw new Error(`${provider.name} did not return a readable stream`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await abortable(reader.read(), providerAbort.signal, provider.name);
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const { complete, rest } = extractCompleteBlocks(buffer);
      buffer = rest;

      for (const event of parseOpenAIStreamChunk(complete)) {
        if (event.type === 'token') onToken?.(event.content);
        if (event.type === 'error') throw new Error(`${provider.name}: ${event.message}`);
        if (event.type === 'done') return;
      }
    }

    buffer += decoder.decode();
    for (const event of parseOpenAIStreamChunk(buffer)) {
      if (event.type === 'token') onToken?.(event.content);
      if (event.type === 'error') throw new Error(`${provider.name}: ${event.message}`);
    }
  } finally {
    providerAbort.cleanup();
  }
}

async function streamChatCompletion({ messages, image, onToken, signal, fetchImpl = fetch, env } = {}) {
  const config = readChatbotConfig(env);
  let lastError = null;

  for (let index = 0; index < config.providers.length; index += 1) {
    const provider = config.providers[index];
    const isLastProvider = index === config.providers.length - 1;
    const bufferedTokens = [];

    const payload = buildChatCompletionPayload({
      model: provider.model,
      maxTokens: config.maxTokens,
      temperature: config.temperature,
      messages,
      image,
    });

    try {
      await streamProviderCompletion({
        provider,
        payload,
        signal,
        fetchImpl,
        timeoutMs: config.providerTimeoutMs,
        onToken: isLastProvider ? onToken : (content) => bufferedTokens.push(content),
      });

      if (!isLastProvider) {
        bufferedTokens.forEach((content) => onToken?.(content));
      }
      return;
    } catch (error) {
      lastError = error;
      if (signal?.aborted) throw error;
    }
  }

  throw lastError || new Error('AI provider request failed');
}

module.exports = {
  readChatbotConfig,
  buildChatCompletionPayload,
  parseOpenAIStreamChunk,
  streamChatCompletion,
};
