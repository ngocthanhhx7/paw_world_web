# PAWWORLD GENIUS AI Chatbot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a server-streamed PAWWORLD GENIUS AI chatbot for the public Paw World website.

**Architecture:** The browser renders a floating React chat widget and streams responses from Paw World's Express server. The server keeps ShineShop API keys in `.env`, constructs OpenAI-compatible chat completion requests, parses provider SSE chunks, and forwards normalized SSE events to the client.

**Tech Stack:** React 18, Vite, TailwindCSS, lucide-react, Express 4, Node 18 built-in `fetch`, Node built-in `node:test`.

---

## File Structure

- Create `server/src/services/chatbotPrompt.js`: system prompt, WSAVA summary, message normalization.
- Create `server/src/services/shineshopChat.service.js`: provider config, payload builder, SSE parser, stream bridge.
- Create `server/src/controllers/chatbot.controller.js`: request validation, SSE headers, error event writing.
- Create `server/src/routes/chatbot.routes.js`: Express route for `/api/chatbot/message`.
- Modify `server/src/app.js`: mount chatbot route.
- Modify `server/package.json`: add `test` script.
- Create `server/src/services/chatbotPrompt.test.js`: prompt and message tests.
- Create `server/src/services/shineshopChat.service.test.js`: provider payload and SSE parser tests.
- Create `client/src/components/chatbot/ChatbotWidget.jsx`: floating chat UI and streaming client.
- Modify `client/src/layouts/MainLayout.jsx`: render `ChatbotWidget` on public layout.
- Modify `client/src/components/layout/FloatingContact.jsx`: move existing floating contact stack left enough to avoid chat overlap.
- Modify `client/src/api/endpoints.js`: add chatbot stream helper if needed by UI.

---

### Task 1: Server Prompt And Provider Service

**Files:**
- Create: `server/src/services/chatbotPrompt.test.js`
- Create: `server/src/services/shineshopChat.service.test.js`
- Create: `server/src/services/chatbotPrompt.js`
- Create: `server/src/services/shineshopChat.service.js`
- Modify: `server/package.json`

- [ ] **Step 1: Add server test script**

Add this script to `server/package.json`:

```json
"test": "node --test \"src/**/*.test.js\""
```

- [ ] **Step 2: Write failing prompt tests**

Create `server/src/services/chatbotPrompt.test.js`:

```js
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
```

- [ ] **Step 3: Write failing provider service tests**

Create `server/src/services/shineshopChat.service.test.js`:

```js
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
```

- [ ] **Step 4: Run tests to verify RED**

Run:

```bash
npm run test -w server
```

Expected: fails because the new service modules do not exist yet.

- [ ] **Step 5: Implement prompt service**

Create `server/src/services/chatbotPrompt.js` with exported `CHATBOT_SYSTEM_PROMPT`, `normalizeChatMessages`, and `buildProviderMessages`.

- [ ] **Step 6: Implement provider service**

Create `server/src/services/shineshopChat.service.js` with exported `readChatbotConfig`, `buildChatCompletionPayload`, `parseOpenAIStreamChunk`, and `streamChatCompletion`.

- [ ] **Step 7: Run tests to verify GREEN**

Run:

```bash
npm run test -w server
```

Expected: all server unit tests pass.

---

### Task 2: Server Streaming Route

**Files:**
- Create: `server/src/controllers/chatbot.controller.js`
- Create: `server/src/routes/chatbot.routes.js`
- Modify: `server/src/app.js`

- [ ] **Step 1: Add controller**

Create an Express controller that validates `messages`, accepts optional `image`, writes SSE headers, calls `streamChatCompletion`, and emits `token`, `done`, or `error` events.

- [ ] **Step 2: Add route**

Create `server/src/routes/chatbot.routes.js` with `router.post('/message', streamChatbotMessage)`.

- [ ] **Step 3: Mount route**

In `server/src/app.js`, require the route and add `app.use('/api/chatbot', chatbotRoutes);` before the 404 handler.

- [ ] **Step 4: Verify server tests still pass**

Run:

```bash
npm run test -w server
```

Expected: all server unit tests pass.

---

### Task 3: Client Chat Widget

**Files:**
- Create: `client/src/components/chatbot/ChatbotWidget.jsx`
- Modify: `client/src/layouts/MainLayout.jsx`
- Modify: `client/src/components/layout/FloatingContact.jsx`

- [ ] **Step 1: Build the floating widget**

Implement closed and open states, greeting, `NUTRITIONAL PLAN` sample chips, user bubbles, assistant bubbles, image upload preview, send button, close button, and animated thinking dots.

- [ ] **Step 2: Implement streaming client**

Use `fetch('/api/chatbot/message', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' }, body })`, read `response.body.getReader()`, parse SSE blocks, append `token` content to the current assistant message, and stop on `done`.

- [ ] **Step 3: Render on public layout**

Import and render `ChatbotWidget` in `client/src/layouts/MainLayout.jsx`.

- [ ] **Step 4: Avoid floating contact overlap**

Adjust `FloatingContact` desktop placement from `right-5` to a responsive offset while keeping mobile readable.

- [ ] **Step 5: Verify client build**

Run:

```bash
npm run build -w client
```

Expected: Vite build exits 0.

---

### Task 4: Final Verification

**Files:**
- Review all changed files.

- [ ] **Step 1: Run server tests**

Run:

```bash
npm run test -w server
```

Expected: all tests pass.

- [ ] **Step 2: Run client build**

Run:

```bash
npm run build -w client
```

Expected: build exits 0.

- [ ] **Step 3: Check git status**

Run:

```bash
git status --short
```

Expected: only intended chatbot, docs, and `.gitignore` changes plus the pre-existing untracked chatbot icon if still untracked.

## Self-Review

- Spec coverage: placement, streaming, server-side credentials, image upload, prompt scope, WSAVA grounding, animated thinking state, and verification are each mapped to tasks.
- Placeholder scan: no task uses TBD or unspecified future work.
- Type consistency: service exports in tests match service implementation names.
