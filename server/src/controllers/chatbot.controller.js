const { streamChatCompletion } = require('../services/shineshopChat.service');

function writeSseEvent(res, event, data = {}) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function isValidImage(image) {
  if (image == null) return true;
  if (typeof image !== 'object') return false;

  const mimeType = typeof image.mimeType === 'string' ? image.mimeType.toLowerCase() : '';
  const data = typeof image.data === 'string' ? image.data.trim() : '';

  return /^image\/(png|jpe?g|webp|gif)$/.test(mimeType) && data.length > 0;
}

function validateChatbotRequest(body) {
  if (!body || !Array.isArray(body.messages)) {
    return 'Messages are required';
  }

  const hasUserMessage = body.messages.some(
    (message) =>
      message &&
      message.role === 'user' &&
      typeof message.content === 'string' &&
      message.content.trim().length > 0,
  );

  if (!hasUserMessage) {
    return 'At least one user message is required';
  }

  if (!isValidImage(body.image)) {
    return 'Image must be png, jpg, webp, or gif';
  }

  return null;
}

async function streamChatbotMessage(req, res) {
  const validationError = validateChatbotRequest(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const abortController = new AbortController();
  let completed = false;
  res.on('close', () => {
    if (!completed) abortController.abort();
  });

  try {
    await streamChatCompletion({
      messages: req.body.messages,
      image: req.body.image,
      signal: abortController.signal,
      onToken: (content) => writeSseEvent(res, 'token', { content }),
    });

    writeSseEvent(res, 'done');
  } catch (error) {
    if (!res.writableEnded) {
      writeSseEvent(res, 'error', {
        message: error.message || 'PAWWORLD GENIUS AI is temporarily unavailable',
      });
    }
  } finally {
    completed = true;
    res.end();
  }
}

module.exports = {
  streamChatbotMessage,
  validateChatbotRequest,
};
