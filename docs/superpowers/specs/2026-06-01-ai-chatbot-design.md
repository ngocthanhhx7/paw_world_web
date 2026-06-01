# PAWWORLD GENIUS AI Chatbot Design

## Goal

Add a floating AI chatbot to the Paw World public website. The chatbot is named **PAWWORLD GENIUS AI**, matches the four Figma chatbox states supplied by the user, supports image upload, streams answers through the server, and keeps all ShineShop API credentials in `server/.env`.

## Approved Decisions

- Placement: floating chat button on every public page through `MainLayout`.
- Admin panel: excluded.
- Provider integration: server-side streaming through ShineShop's OpenAI-compatible Chat Completions API.
- API credentials and model: stored only in `server/.env`.
- Scope guard: answer only dog and cat care questions. Politely refuse unrelated topics.
- Medical safety: do not diagnose; recommend a veterinarian for urgent, severe, or persistent symptoms.
- Visual behavior: show the animated three-dot thinking state before streamed text starts, then append streamed text progressively.

## External Contracts

ShineShop docs state the public OpenAI-compatible base URL is `https://api.shineshop.dev/v1`, API keys use `Authorization: Bearer sk-...`, available model IDs should be read from `/v1/models` or `/v1/model/info`, and chat completions use `POST /v1/chat/completions`. Streaming is enabled by setting `stream: true`, returns server-sent events, and may include comment lines starting with `:`, which clients should ignore.

The server will expose Paw World's own endpoint:

```http
POST /api/chatbot/message
Content-Type: application/json
Accept: text/event-stream
```

Request body:

```json
{
  "messages": [
    { "role": "user", "content": "Meo nha toi nen an bao nhieu?" }
  ],
  "image": {
    "mimeType": "image/png",
    "data": "base64-without-data-url-prefix"
  }
}
```

Response stream:

```text
event: token
data: {"content":"..."}

event: done
data: {}
```

Errors:

```text
event: error
data: {"message":"..."}
```

## Environment Variables

Add these to `server/.env` manually:

```env
SHINESHOP_DEV_API_KEY=sk-your-key
SHINESHOP_DEV_BASE_URL=https://api.shineshop.dev/v1
SHINESHOP_DEV_MODEL=codex/gpt5.5
CHATBOT_MAX_TOKENS=900
CHATBOT_TEMPERATURE=0.35
```

The implementation must fail gracefully when `SHINESHOP_DEV_API_KEY` or `SHINESHOP_DEV_MODEL` is missing.

## Knowledge And Prompting

The system prompt will use Vietnamese by default and ground responses in dog and cat care. It will include a concise WSAVA nutrition guideline summary:

- Nutrition assessment is treated as a routine health assessment for dogs and cats.
- Useful screening context includes animal factors, diet factors, and feeding or environmental factors.
- Animal factors include age, physiological status, activity, body condition, muscle condition, symptoms, medications, and existing disease.
- Diet factors include food type, complete and balanced adequacy, caloric density, treats, supplements, storage, and manufacturer information.
- Feeding and environment factors include feeding frequency, amount, location, method, household competition, and environmental stimulation.
- Body condition score targets are commonly around 4 to 5 on a 9-point scale; scores below 4 or above 5 are risk signals.
- Red flags such as vomiting, diarrhea, appetite change, unexplained weight change, dental disease, poor coat, or muscle loss should lead to vet guidance.

The bot must not claim it can replace a veterinarian.

## UI Design

Create a `ChatbotWidget` under `client/src/components/chatbot/`.

States:

1. Closed: floating button using `client/public/assets/icon/khac/iconChatbot.svg`.
2. Open fresh state: header with PAWWORLD GENIUS AI, greeting, and sample question chips under the `NUTRITIONAL PLAN` label.
3. Active conversation: user bubbles in purple; assistant bubbles in light neutral styling.
4. Thinking: grey rounded bubble with three lavender dots animating sequentially in a loop.

Controls:

- Text input.
- Send icon button.
- Image upload icon button with preview and remove action.
- Close button.
- Sample question chips that populate and send a question.

Accessibility:

- Buttons have `aria-label`.
- Chat transcript uses `aria-live="polite"`.
- Input supports Enter to send and Shift+Enter for a newline.

Responsive behavior:

- Desktop: fixed bottom-right chat panel, constrained width.
- Mobile: fixed panel with safe margins and viewport-height cap.
- The existing floating contact buttons should shift left or remain visually behind the chatbot without overlapping the open chat panel.

## Server Design

Create focused server units:

- `server/src/services/chatbotPrompt.js`: owns system prompt and message normalization.
- `server/src/services/shineshopChat.service.js`: owns provider request construction and SSE parsing.
- `server/src/controllers/chatbot.controller.js`: validates request, sets SSE headers, delegates streaming, maps errors.
- `server/src/routes/chatbot.routes.js`: registers `POST /message`.

Use global `express.json({ limit: '5mb' })`, so images must stay below that body size.

## Testing

Use Node's built-in test runner for server units. Add tests for:

- Prompt scope and WSAVA grounding.
- OpenAI-compatible text and image message payload construction.
- SSE parsing, including comment lines and `[DONE]`.
- Missing provider configuration errors.

Run:

```bash
npm run test -w server
npm run build -w client
```

## Sources

- ShineShop docs: `https://shineshop.dev/docs/`
- ShineShop chat completions: `https://shineshop.dev/docs/chat-completions/`
- ShineShop streaming: `https://shineshop.dev/docs/streaming/`
- ShineShop models: `https://shineshop.dev/docs/models/`
- WSAVA Nutritional Assessment Guidelines PDF: `https://wsava.org/wp-content/uploads/2020/01/WSAVA-Nutrition-Assessment-Guidelines-2011-JSAP.pdf`
