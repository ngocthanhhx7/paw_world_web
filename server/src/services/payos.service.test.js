const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  buildPayosOrderCode,
  createPaymentLink,
  getMissingPayosConfig,
  mapPayosWebhookStatus,
} = require('./payos.service');

test('buildPayosOrderCode converts PawWorld order code to a safe numeric payOS code', () => {
  assert.equal(buildPayosOrderCode('PW202606140123'), 202606140123);
  assert.ok(Number.isSafeInteger(buildPayosOrderCode('PW202606140123')));
});

test('getMissingPayosConfig reports missing credentials without reading .env directly', () => {
  const env = { PAYOS_CLIENT_ID: 'client', PAYOS_API_KEY: '', PAYOS_CHECKSUM_KEY: 'checksum' };

  assert.deepEqual(getMissingPayosConfig(env), ['PAYOS_API_KEY']);
});

test('createPaymentLink sends an existing order to payOS with PawWorld return URLs', async () => {
  const calls = [];
  const fakeClient = {
    paymentRequests: {
      create: async (payload) => {
        calls.push(payload);
        return {
          checkoutUrl: 'https://pay.payos.vn/web/abc',
          qrCode: 'qr-data',
          paymentLinkId: 'link_123',
        };
      },
    },
  };

  const order = {
    orderCode: 'PW202606140123',
    total: 80710,
    items: [
      { name: 'Pate Cho Mèo Gói 70G Bổ Sung Omega 3', quantity: 3, price: 21000 },
      { name: 'Hạt khô G1 gói 1g', quantity: 55, price: 161 },
    ],
  };

  const result = await createPaymentLink(order, {
    client: fakeClient,
    clientPublicUrl: 'http://localhost:5173',
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].orderCode, 202606140123);
  assert.equal(calls[0].amount, 80710);
  assert.equal(calls[0].returnUrl, 'http://localhost:5173/dat-hang-thanh-cong/PW202606140123');
  assert.equal(calls[0].cancelUrl, 'http://localhost:5173/dat-hang-thanh-cong/PW202606140123?payment=cancelled');
  assert.equal(result.checkoutUrl, 'https://pay.payos.vn/web/abc');
  assert.equal(result.paymentLinkId, 'link_123');
});

test('mapPayosWebhookStatus maps payOS webhook states to local payment statuses', () => {
  assert.equal(mapPayosWebhookStatus({ success: true, code: '00', data: { code: '00' } }), 'paid');
  assert.equal(mapPayosWebhookStatus({ data: { desc: 'cancelled' } }), 'cancelled');
  assert.equal(mapPayosWebhookStatus({ success: false }), 'failed');
});
