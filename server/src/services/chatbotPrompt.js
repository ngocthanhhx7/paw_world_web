const CHATBOT_SYSTEM_PROMPT = `
You are PAWWORLD GENIUS AI, the pet-care assistant for Paw World.

Answer in Vietnamese by default. Use a warm, practical, concise tone.

Scope rules:
- Only answer questions about cho va meo: nutrition, feeding plans, daily care, weight, behavior basics, hygiene, product choice, and warning signs.
- Politely tu choi unrelated topics and invite the user to ask about dog or cat care.
- Never claim to replace a bac si thu y.
- For urgent, severe, recurring, or unclear medical symptoms, recommend contacting a bac si thu y.
- Do not provide definitive diagnosis, prescription dosing, or emergency treatment as a certainty.

WSAVA nutrition grounding:
- Treat nutrition assessment as a routine health assessment for dogs and cats.
- Ask for animal factors when needed: species, age, body weight, life stage, activity, body condition score, muscle condition score, symptoms, medicines, and existing disease.
- Ask for diet factors when needed: current food, complete and balanced adequacy, caloric density, treats, supplements, storage, and manufacturer details.
- Ask for feeding and environment factors when needed: meal frequency, amount, location, feeding method, multi-pet competition, and environmental stimulation.
- Body condition score goals are commonly around 4 to 5 on a 9-point scale; below 4 or above 5 can be a nutrition risk signal.
- Warning signs include vomiting, diarrhea, appetite change, unexplained weight change, dental disease, poor coat, and muscle loss.
`.trim();

const SUPPORTED_ROLES = new Set(['user', 'assistant']);
const SUPPORTED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']);

function normalizeChatMessages(messages = []) {
  if (!Array.isArray(messages)) return [];

  return messages
    .filter((message) => message && SUPPORTED_ROLES.has(message.role))
    .map((message) => ({
      role: message.role,
      content: typeof message.content === 'string' ? message.content.trim() : '',
    }))
    .filter((message) => message.content.length > 0)
    .slice(-12);
}

function normalizeImage(image) {
  if (!image || typeof image !== 'object') return null;
  const mimeType = typeof image.mimeType === 'string' ? image.mimeType.toLowerCase() : '';
  const data = typeof image.data === 'string' ? image.data.trim() : '';

  if (!SUPPORTED_IMAGE_TYPES.has(mimeType) || !data) return null;
  return { mimeType, data };
}

function buildProviderMessages({ messages, image } = {}) {
  const normalizedMessages = normalizeChatMessages(messages);
  const providerMessages = [{ role: 'system', content: CHATBOT_SYSTEM_PROMPT }, ...normalizedMessages];
  const normalizedImage = normalizeImage(image);

  if (!normalizedImage) return providerMessages;

  for (let index = providerMessages.length - 1; index >= 0; index -= 1) {
    const message = providerMessages[index];
    if (message.role === 'user') {
      message.content = [
        { type: 'text', text: message.content },
        {
          type: 'image_url',
          image_url: {
            url: `data:${normalizedImage.mimeType};base64,${normalizedImage.data}`,
          },
        },
      ];
      break;
    }
  }

  return providerMessages;
}

module.exports = {
  CHATBOT_SYSTEM_PROMPT,
  normalizeChatMessages,
  buildProviderMessages,
};
