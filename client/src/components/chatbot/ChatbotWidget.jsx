import { useRef, useState } from 'react';
import { Paperclip, Send, Trash2, X } from 'lucide-react';

const SAMPLE_QUESTIONS = [
  'Kế hoạch dinh dưỡng',
  'Số bữa ăn mỗi ngày',
  'Mèo bị thừa cân',
  'Tư vấn sản phẩm',
  'Cách chọn hạt',
  'Mèo bị biếng ăn',
];

const WELCOME_MESSAGES = [
  {
    id: 'welcome-1',
    role: 'assistant',
    content: 'Genius AI sử dụng trí tuệ nhân tạo hoặc các mô hình học máy để tạo ra câu trả lời cho câu hỏi của bạn. Luôn tham khảo ý kiến bác sĩ thú y trước.',
    isPrivacy: true,
  },
  {
    id: 'welcome-2',
    role: 'assistant',
    content: 'Chào! Tôi là PawWorld Genius AI, ở đây để giúp giải đáp thắc mắc về dinh dưỡng thú cưng, tư vấn sản phẩm và nhiều câu hỏi khác liên quan đến thú cưng. Tôi có thể hỗ trợ gì cho bạn hôm nay? 🐾',
  },
];

const MAX_IMAGE_SIZE = 4 * 1024 * 1024;

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function extractSseEvents(buffer) {
  const normalized = buffer.replace(/\r\n/g, '\n');
  const boundary = normalized.lastIndexOf('\n\n');
  if (boundary === -1) {
    return { blocks: [], rest: normalized };
  }

  return {
    blocks: normalized
      .slice(0, boundary)
      .split('\n\n')
      .filter((block) => block.trim().length > 0),
    rest: normalized.slice(boundary + 2),
  };
}

function parseSseBlock(block) {
  let event = 'message';
  const data = [];

  for (const rawLine of block.split('\n')) {
    const line = rawLine.trim();
    if (line.startsWith('event:')) event = line.slice(6).trim();
    if (line.startsWith('data:')) data.push(line.slice(5).trim());
  }

  if (data.length === 0) return null;

  try {
    return { event, data: JSON.parse(data.join('\n')) };
  } catch (error) {
    return { event: 'error', data: { message: 'Khong doc duoc phan hoi tu AI.' } };
  }
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="h-2.5 w-2.5 rounded-full bg-[#B79CE8]"
          style={{
            animation: 'pawChatDot 1.4s ease-in-out infinite',
            animationDelay: `${index * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

function renderMarkdown(text) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let currentList = null;

  const flushList = (key) => {
    if (currentList) {
      if (currentList.type === 'ul') {
        elements.push(
          <ul key={key} className="list-none pl-1 my-2 space-y-1.5">
            {currentList.items}
          </ul>
        );
      } else {
        elements.push(
          <ol key={key} className="list-none pl-1 my-2 space-y-1.5">
            {currentList.items}
          </ol>
        );
      }
      currentList = null;
    }
  };

  const parseInline = (str) => {
    const regex = /(\*\*.*?\*\*|\*.*?\*)/g;
    const tokens = str.split(regex);

    return tokens.map((token, i) => {
      if (token.startsWith('**') && token.endsWith('**')) {
        return (
          <strong key={i} className="font-extrabold text-[#3F2A6B]">
            {token.slice(2, -2)}
          </strong>
        );
      }
      if (token.startsWith('*') && token.endsWith('*')) {
        return (
          <em key={i} className="italic text-cocoa-500">
            {token.slice(1, -1)}
          </em>
        );
      }
      return token;
    });
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Check for bullet list item
    const ulMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
    if (ulMatch) {
      const content = ulMatch[2];

      if (!currentList || currentList.type !== 'ul') {
        flushList(`list-flush-${index}`);
        currentList = { type: 'ul', items: [] };
      }

      currentList.items.push(
        <li key={`li-${index}`} className="flex items-start gap-2 text-sm leading-relaxed text-cocoa-600">
          <span className="shrink-0 text-xs mt-1 text-[#9D7AD9]">🐾</span>
          <span className="flex-1">{parseInline(content)}</span>
        </li>
      );
      return;
    }

    // Check for numbered list item
    const olMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
    if (olMatch) {
      const num = olMatch[2];
      const content = olMatch[3];

      if (!currentList || currentList.type !== 'ol') {
        flushList(`list-flush-${index}`);
        currentList = { type: 'ol', items: [] };
      }

      currentList.items.push(
        <li key={`li-${index}`} className="flex items-start gap-2 text-sm leading-relaxed text-cocoa-600">
          <span className="shrink-0 font-bold text-[#9D7AD9]">{num}.</span>
          <span className="flex-1">{parseInline(content)}</span>
        </li>
      );
      return;
    }

    // Regular paragraph
    flushList(`list-flush-${index}`);

    if (trimmed.length > 0) {
      elements.push(
        <p key={`p-${index}`} className="text-sm leading-relaxed text-cocoa-600 mb-2">
          {parseInline(trimmed)}
        </p>
      );
    }
  });

  flushList('list-flush-final');
  return elements;
}

function MessageContent({ message }) {
  if (!message?.content) return null;
  const contentNode = renderMarkdown(message.content);

  if (message.isPrivacy) {
    return (
      <div className="space-y-1">
        {contentNode}
        <button
          type="button"
          onClick={() => window.open('/chinh-sach-bao-mat', '_blank')}
          className="mt-2.5 block text-sm font-bold text-[#FF9600] hover:text-[#E58500] hover:underline transition-colors"
        >
          Chính sách bảo mật của chúng tôi
        </button>
      </div>
    );
  }

  return <div className="space-y-1">{contentNode}</div>;
}

function MessageBubble({ message, isThinking }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-[20px] rounded-tr-[4px] bg-[#F2E2FF] px-5 py-3.5 text-sm leading-relaxed text-cocoa-500 shadow-sm">
          {message.imagePreview ? (
            <img
              src={message.imagePreview}
              alt=""
              className="mb-2 max-h-40 w-full rounded-2xl object-cover"
            />
          ) : null}
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  // Assistant / AI
  return (
    <div className="flex gap-3 items-start">
      {/* Avatar */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-lavender-100 bg-white mt-1 shadow-sm">
        <img src="/assets/logo/doc.svg" alt="AI Avatar" className="h-5 w-auto" />
      </div>

      {/* Content Stack */}
      <div className="flex-1 min-w-0 space-y-1">
        <span className="block text-[10px] font-extrabold uppercase tracking-widest text-[#FF9600]">
          PAWWORLD GENIUS AI
        </span>

        {/* Bubble */}
        <div
          className={`inline-block max-w-[90%] rounded-[20px] rounded-tl-[4px] px-5 py-3.5 text-sm leading-relaxed shadow-sm ${
            isThinking
              ? 'bg-[#F2E2FF]/60 border border-lavender-100/50'
              : 'bg-white text-cocoa-500 border border-lavender-100'
          }`}
        >
          {isThinking ? (
            <ThinkingDots />
          ) : (
            <>
              {message.imagePreview ? (
                <img
                  src={message.imagePreview}
                  alt=""
                  className="mb-2 max-h-40 w-full rounded-2xl object-cover"
                />
              ) : null}
              <MessageContent message={message} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(WELCOME_MESSAGES);
  const [draft, setDraft] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const [chatTime] = useState(() => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'AM' : 'PM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    const hoursStr = hours < 10 ? '0' + hours : hours;
    return `TODAY ${hoursStr}:${minutesStr} ${ampm}`;
  });

  const hasUserMessages = messages.some((msg) => msg.role === 'user');

  const updateMessage = (id, updater) => {
    setMessages((current) =>
      current.map((message) => (message.id === id ? { ...message, ...updater(message) } : message)),
    );
  };

  const sendMessage = async (presetText) => {
    const text = (presetText || draft).trim();
    if (!text || isSending) return;

    const imageForRequest = selectedImage;
    const userMessage = {
      id: createId(),
      role: 'user',
      content: text,
      imagePreview: imageForRequest?.preview,
    };
    const assistantMessage = {
      id: createId(),
      role: 'assistant',
      content: '',
      pending: true,
    };
    const nextMessages = [...messages, userMessage, assistantMessage];

    setMessages(nextMessages);
    setDraft('');
    setSelectedImage(null);
    setError('');
    setIsSending(true);

    try {
      const response = await fetch('/api/chatbot/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((message) => ({
            role: message.role,
            content: message.content,
          })),
          image: imageForRequest
            ? { mimeType: imageForRequest.mimeType, data: imageForRequest.data }
            : undefined,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('PAWWORLD GENIUS AI đang tạm thời bận.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let receivedToken = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const extracted = extractSseEvents(buffer);
        buffer = extracted.rest;

        for (const block of extracted.blocks) {
          const parsed = parseSseBlock(block);
          if (!parsed) continue;

          if (parsed.event === 'token') {
            receivedToken = true;
            updateMessage(assistantMessage.id, (message) => ({
              pending: false,
              content: `${message.content}${parsed.data.content || ''}`,
            }));
          }

          if (parsed.event === 'error') {
            throw new Error(parsed.data.message || 'PAWWORLD GENIUS AI đang tạm thời bận.');
          }

          if (parsed.event === 'done') {
            break;
          }
        }
      }

      if (!receivedToken) {
        updateMessage(assistantMessage.id, () => ({
          pending: false,
          content: 'Mình chưa nhận được nội dung trả lời. Bạn thử hỏi lại ngắn gọn hơn nhé.',
        }));
      }
    } catch (requestError) {
      const message =
        requestError?.message || 'PAWWORLD GENIUS AI đang tạm thời bận. Bạn thử lại sau nhé.';
      setError(message);
      updateMessage(assistantMessage.id, () => ({
        pending: false,
        content: message,
      }));
    } finally {
      setIsSending(false);
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) {
      setError('Chỉ nhận ảnh png, jpg, webp hoặc gif.');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError('Ảnh cần nhỏ hơn 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const [, data = ''] = result.split(',');
      setSelectedImage({
        name: file.name,
        mimeType: file.type,
        data,
        preview: result,
      });
      setError('');
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <style>
        {`
          @keyframes pawChatDot {
            0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
            40% { transform: translateY(-4px); opacity: 1; }
          }
        `}
      </style>

      {!isOpen ? (
        <button
          type="button"
          aria-label="Mở PAWWORLD GENIUS AI"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-sun-400 shadow-soft transition hover:-translate-y-0.5 hover:bg-sun-500"
        >
          <img src="/assets/icon/khac/iconChatbot.svg" alt="" className="h-12 w-12" />
        </button>
      ) : (
        <section className="fixed bottom-3 left-3 right-3 z-40 mx-auto flex h-[calc(100vh-24px)] max-h-[620px] w-[calc(100%-24px)] max-w-[375px] flex-col overflow-hidden rounded-[28px] border border-lavender-100 bg-[#FCFAFF] shadow-[0_24px_70px_-28px_rgba(63,42,107,0.55)] sm:bottom-5 sm:left-auto sm:right-5 sm:h-[calc(100vh-40px)] sm:max-h-[620px]">
          <header className="flex items-center justify-between bg-[#F2E2FF] px-5 py-4 border-b border-lavender-100/50">
            <div className="flex items-center gap-2">
              <img src="/assets/logo/doc.svg" alt="PawWorld Logo" className="h-7 w-auto" />
              <span className="font-sans text-2xl font-extrabold tracking-tight text-cocoa-500">
                PawWorld
              </span>
            </div>
            <button
              type="button"
              aria-label="Đóng chat"
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-cocoa-500 transition hover:bg-[#E2C0FF] hover:text-cocoa-700"
            >
              <X size={18} />
            </button>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5" aria-live="polite">
            <div className="text-center my-3">
              <span className="text-[10px] font-black tracking-[0.18em] text-[#B5A4C4] uppercase">
                {chatTime}
              </span>
            </div>

            <div className="space-y-4">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} isThinking={message.pending} />
              ))}
            </div>

            {!hasUserMessages && (
              <div className="pt-4">
                <div className="grid grid-cols-2 gap-2.5">
                  {SAMPLE_QUESTIONS.map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => sendMessage(question)}
                      className="w-full rounded-full border border-[#B79CE8] bg-white px-4 py-2.5 text-center text-xs font-bold tracking-wider text-cocoa-500 uppercase transition hover:border-[#9D7AD9] hover:bg-lavender-50/50"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <footer className="border-t border-lavender-100 bg-white p-4">
            {selectedImage ? (
              <div className="mb-3 flex items-center gap-3 rounded-2xl bg-lavender-50 p-2">
                <img
                  src={selectedImage.preview}
                  alt=""
                  className="h-12 w-12 rounded-xl object-cover"
                />
                <p className="min-w-0 flex-1 truncate text-xs font-semibold text-cocoa-500">
                  {selectedImage.name}
                </p>
                <button
                  type="button"
                  aria-label="Xóa ảnh"
                  onClick={() => setSelectedImage(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-cocoa-400 hover:bg-white hover:text-cocoa-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : null}

            {error ? <p className="mb-2 px-1 text-xs font-semibold text-coral-600">{error}</p> : null}

            <div className="flex items-center gap-2 rounded-full border border-lavender-200 bg-white px-4 py-2 shadow-sm focus-within:border-lavender-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleImageChange}
              />
              <button
                type="button"
                aria-label="Tải ảnh lên"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#B5A4C4] transition hover:bg-lavender-50 hover:text-cocoa-500"
              >
                <Paperclip size={18} />
              </button>
              <textarea
                value={draft}
                rows={1}
                placeholder="Nhập tin nhắn..."
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                className="max-h-24 min-h-9 flex-1 resize-none bg-transparent py-1.5 text-sm font-semibold text-cocoa-600 outline-none placeholder:text-[#B5A4C4] leading-normal"
              />
              {draft.trim() && (
                <button
                  type="button"
                  aria-label="Gửi tin nhắn"
                  disabled={isSending}
                  onClick={() => sendMessage()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-cocoa-500 hover:text-cocoa-700 transition"
                >
                  <Send size={18} />
                </button>
              )}
            </div>
          </footer>
        </section>
      )}
    </>
  );
}
