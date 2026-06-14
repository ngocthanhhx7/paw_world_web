const { PayOS } = require('@payos/node');

const REQUIRED_PAYOS_ENV = ['PAYOS_CLIENT_ID', 'PAYOS_API_KEY', 'PAYOS_CHECKSUM_KEY'];

function getMissingPayosConfig(env = process.env) {
  return REQUIRED_PAYOS_ENV.filter((key) => !String(env[key] || '').trim());
}

function getClientPublicUrl(clientPublicUrl = process.env.CLIENT_PUBLIC_URL || process.env.CLIENT_ORIGIN) {
  const firstOrigin = String(clientPublicUrl || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .find(Boolean);
  return (firstOrigin || 'http://localhost:5173').replace(/\/+$/, '');
}

function buildPayosOrderCode(orderCode) {
  const digits = String(orderCode || '').replace(/\D/g, '');
  const code = Number(digits);
  if (!digits || !Number.isSafeInteger(code)) {
    throw new Error('Cannot build payOS order code from PawWorld order code');
  }
  return code;
}

function truncateText(value, maxLength) {
  const text = String(value || '').trim();
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1).trimEnd();
}

function buildPayosItems(items = []) {
  return items.map((item) => ({
    name: truncateText(item.name, 50) || 'San pham PawWorld',
    quantity: Math.max(1, Number(item.quantity || 1)),
    price: Math.max(0, Math.round(Number(item.price || 0))),
  }));
}

function createPayosClient() {
  const missing = getMissingPayosConfig();
  if (missing.length) {
    const err = new Error(`Missing payOS configuration: ${missing.join(', ')}`);
    err.statusCode = 503;
    throw err;
  }
  return new PayOS({
    clientId: process.env.PAYOS_CLIENT_ID,
    apiKey: process.env.PAYOS_API_KEY,
    checksumKey: process.env.PAYOS_CHECKSUM_KEY,
  });
}

async function createPaymentLink(order, options = {}) {
  const client = options.client || createPayosClient();
  const clientPublicUrl = getClientPublicUrl(options.clientPublicUrl);
  const payosOrderCode = order.payosOrderCode || buildPayosOrderCode(order.orderCode);
  const orderPath = `/dat-hang-thanh-cong/${order.orderCode}`;

  const paymentData = {
    orderCode: payosOrderCode,
    amount: Math.max(0, Math.round(Number(order.total || 0))),
    description: `PW${String(payosOrderCode).slice(-10)}`,
    items: buildPayosItems(order.items),
    returnUrl: `${clientPublicUrl}${orderPath}`,
    cancelUrl: `${clientPublicUrl}${orderPath}?payment=cancelled`,
  };

  return client.paymentRequests.create(paymentData);
}

function verifyWebhook(body, options = {}) {
  const client = options.client || createPayosClient();
  return client.webhooks.verify(body);
}

function mapPayosWebhookStatus(payload = {}) {
  const data = payload.data || payload;
  const rootCode = String(payload.code || '').toUpperCase();
  const dataCode = String(data.code || '').toUpperCase();
  const desc = `${payload.desc || ''} ${data.desc || ''}`.toLowerCase();
  const status = String(data.status || payload.status || '').toUpperCase();

  if (payload.success === true && rootCode === '00' && (!dataCode || dataCode === '00')) {
    return 'paid';
  }
  if (status === 'PAID') return 'paid';
  if (status === 'CANCELLED' || desc.includes('cancel')) return 'cancelled';
  if (payload.success === false || (dataCode !== '' && dataCode !== '00')) return 'failed';
  return 'pending';
}

module.exports = {
  buildPayosOrderCode,
  createPaymentLink,
  getClientPublicUrl,
  getMissingPayosConfig,
  mapPayosWebhookStatus,
  verifyWebhook,
};
