const AI_EVENTS = new Set(['ai_started', 'ai_submitted', 'ai_completed', 'ai_failed']);

function percent(numerator, denominator) {
  if (!denominator) return 0;
  return Number(((numerator / denominator) * 100).toFixed(2));
}

function calculateRates({
  uniqueVisitors = 0,
  aiUsers = 0,
  buyers = 0,
  aiToBuyerUsers = 0,
  bouncedSessions = 0,
  totalSessions = 0,
}) {
  return {
    aiUsageRate: percent(aiUsers, uniqueVisitors),
    purchaseConversionRate: percent(buyers, uniqueVisitors),
    aiToPurchaseRate: percent(aiToBuyerUsers, aiUsers),
    bounceRate: percent(bouncedSessions, totalSessions),
  };
}

function classifyVisitorSegments(events = []) {
  const grouped = new Map();
  events.forEach((event) => {
    const key = event.identityKey;
    if (!key) return;
    const current = grouped.get(key) || { hasAi: false, hasPurchase: false, firstAiAt: null, firstPurchaseAt: null };
    if (AI_EVENTS.has(event.eventName)) {
      current.hasAi = true;
      if (!current.firstAiAt || event.createdAt < current.firstAiAt) current.firstAiAt = event.createdAt;
    }
    if (event.eventName === 'purchase_success') {
      current.hasPurchase = true;
      if (!current.firstPurchaseAt || event.createdAt < current.firstPurchaseAt) current.firstPurchaseAt = event.createdAt;
    }
    grouped.set(key, current);
  });

  let aiUsers = 0;
  let buyers = 0;
  let aiOnlyUsers = 0;
  let aiToBuyerUsers = 0;
  let buyerWithoutAIUsers = 0;
  let nonBuyers = 0;

  grouped.forEach((item) => {
    if (item.hasAi) aiUsers += 1;
    if (item.hasPurchase) buyers += 1;
    if (item.hasAi && !item.hasPurchase) aiOnlyUsers += 1;
    if (item.hasAi && item.hasPurchase && item.firstAiAt <= item.firstPurchaseAt) aiToBuyerUsers += 1;
    if (item.hasPurchase && (!item.hasAi || item.firstAiAt > item.firstPurchaseAt)) buyerWithoutAIUsers += 1;
    if (!item.hasPurchase) nonBuyers += 1;
  });

  return { aiUsers, buyers, aiOnlyUsers, aiToBuyerUsers, buyerWithoutAIUsers, nonBuyers };
}

module.exports = {
  AI_EVENTS,
  calculateRates,
  classifyVisitorSegments,
  percent,
};
