const { streamChatCompletion } = require('../shineshopChat.service');

function line(label, value) {
  return `- ${label}: ${value ?? 0}`;
}

function buildFallbackAnalyticsReport({
  dateRangeLabel = 'khoảng thời gian đã chọn',
  overview = {},
  funnel = {},
  topPages = [],
  trafficSources = [],
  aiUsage = [],
} = {}) {
  const topSource = trafficSources[0] || {};
  const topPage = topPages[0] || {};
  const topAi = aiUsage[0] || {};
  const worstFunnel = (funnel.steps || []).reduce(
    (current, step) => (Number(step.dropOffRate || 0) > Number(current.dropOffRate || 0) ? step : current),
    { step: 'Chưa có dữ liệu phễu', dropOffRate: 0 },
  );

  const markdown = [
    '## Tóm tắt điều hành',
    `Báo cáo cho ${dateRangeLabel}. Nguồn truy cập nổi bật là ${overview.topTrafficSource || topSource.source || 'chưa xác định'}, với ${overview.uniqueVisitors || 0} khách duy nhất và ${overview.buyers || 0} khách mua hàng.`,
    '',
    '## Chỉ số chính',
    line('Lượt truy cập', overview.totalVisitors),
    line('Khách duy nhất', overview.uniqueVisitors),
    line('Người dùng AI', overview.aiUsers),
    line('Chỉ dùng AI nhưng chưa mua', overview.aiOnlyUsers),
    line('Khách mua hàng', overview.buyers),
    line('Tỷ lệ mua hàng', `${overview.purchaseConversionRate || 0}%`),
    line('Tỷ lệ AI ra đơn', `${overview.aiToPurchaseRate || 0}%`),
    line('Tỷ lệ rời trang', `${overview.bounceRate || 0}%`),
    '',
    '## Phân tích nguồn truy cập',
    `Nguồn tốt nhất hiện tại: ${topSource.source || overview.topTrafficSource || 'chưa có nguồn'} với ${topSource.visitors || 0} khách và ${topSource.buyers || 0} người mua.`,
    '',
    '## Phân tích sử dụng AI',
    `Tính năng AI được dùng nhiều nhất: ${topAi.aiFeature || 'chưa có dữ liệu AI'} với ${topAi.totalUses || 0} lượt dùng và tỷ lệ thành công ${topAi.successRate || 0}%.`,
    '',
    '## Chuyển đổi mua hàng',
    `${overview.aiToBuyerUsers || 0} khách dùng AI trước khi mua. ${overview.buyerWithoutAIUsers || 0} khách mua hàng mà chưa dùng AI trước đó.`,
    '',
    '## Rơi rớt trong phễu',
    `Bước rơi rớt mạnh nhất: ${worstFunnel.step} ở mức ${worstFunnel.dropOffRate || 0}%.`,
    '',
    '## Hành vi người dùng',
    `Trang đáng chú ý: ${topPage.pagePath || 'chưa có dữ liệu trang'} với ${topPage.views || 0} lượt xem và tỷ lệ rời trang ${topPage.bounceRate || 0}%.`,
    '',
    '## Vấn đề phát hiện',
    overview.uniqueVisitors ? '- Ưu tiên theo dõi các trang có tỷ lệ rời cao và nguồn có nhiều khách nhưng ít mua.' : '- Dữ liệu analytics còn ít; nên thu thập thêm phiên thật trước khi ra quyết định lớn.',
    '',
    '## Khuyến nghị',
    '- Cải thiện trang có tỷ lệ rời cao nhất trước.',
    '- So sánh nhóm dùng AI và không dùng AI theo tuần để đo tác động chuyển đổi.',
    '- Gắn UTM đầy đủ cho quảng cáo, social và email để đọc nguồn chính xác hơn.',
    '',
    '## Hành động tiếp theo',
    '- Kiểm tra bảng nguồn truy cập để tìm nguồn nhiều khách nhưng ít mua.',
    '- Thử nghiệm CTA thanh toán trên trang gợi ý AI.',
    '- Tạo lại báo cáo sau ít nhất 7 ngày dữ liệu mới.',
  ].join('\n');

  return { provider: 'fallback', markdown };
}

async function generateAnalyticsReport(summary) {
  const prompt = [
    'Hãy tạo báo cáo phân tích analytics ngắn gọn bằng tiếng Việt cho admin PawWorld.',
    'Chỉ dùng JSON tổng hợp bên dưới. Không suy đoán dữ liệu cá nhân, không nhắc password, token hoặc dữ liệu thô của người dùng.',
    'Trả về Markdown với đúng các mục: Tóm tắt điều hành, Chỉ số chính, Phân tích nguồn truy cập, Phân tích sử dụng AI, Chuyển đổi mua hàng, Rơi rớt trong phễu, Hành vi người dùng, Vấn đề phát hiện, Khuyến nghị, Hành động tiếp theo.',
    JSON.stringify(summary),
  ].join('\n\n');

  try {
    let markdown = '';
    await streamChatCompletion({
      messages: [{ role: 'user', content: prompt }],
      onToken: (token) => {
        markdown += token;
      },
    });
    const normalized = markdown.trim();
    if (normalized && /Tóm tắt điều hành/i.test(normalized) && /Khuyến nghị/i.test(normalized)) {
      return { provider: 'ai', markdown: normalized };
    }
  } catch {
    // Fall through to deterministic fallback when providers are not configured or unavailable.
  }
  return buildFallbackAnalyticsReport(summary);
}

module.exports = {
  buildFallbackAnalyticsReport,
  generateAnalyticsReport,
};
