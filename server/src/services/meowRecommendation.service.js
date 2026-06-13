const Product = require('../models/Product');
const { streamChatCompletion } = require('./shineshopChat.service');
const {
  buildNutritionWarnings,
  estimateDailyCalories,
  getNutritionGroundingForPrompt,
} = require('./meowNutritionKnowledge');

const FALLBACK_PRODUCTS = [
  {
    id: 'fallback-dry-digestion',
    name: 'PawWorld Hạt khô hỗ trợ tiêu hóa nhạy cảm',
    price: 189000,
    foodType: 'dry',
    flavor: 'salmon',
    healthNeeds: ['digestion'],
    source: 'fallback',
  },
  {
    id: 'fallback-wet-skin-coat',
    name: 'PawWorld Pate ướt chăm da và lông',
    price: 39000,
    foodType: 'wet',
    flavor: 'tuna',
    healthNeeds: ['skin_coat'],
    source: 'fallback',
  },
  {
    id: 'fallback-mixed-bone',
    name: 'PawWorld Meal Kit kết hợp cân bằng',
    price: 249000,
    foodType: 'mixed',
    flavor: 'chicken',
    healthNeeds: ['digestion'],
    source: 'fallback',
  },
];

function normalizeProduct(product) {
  const object = typeof product.toObject === 'function' ? product.toObject({ virtuals: true }) : product;
  const healthNeeds = Array.isArray(object.healthNeeds) ? object.healthNeeds.map(normalizeHealthNeed) : [];
  return {
    id: String(object._id || object.id),
    name: object.name,
    price: object.salePrice && object.salePrice > 0 ? object.salePrice : object.price,
    image: object.image || object.images?.[0] || '',
    foodType: object.foodType || 'dry',
    flavor: object.flavor || '',
    ageRange: object.ageRange || 'all',
    healthNeeds,
    ingredients: object.ingredients || '',
    isAiComboOnly: object.isAiComboOnly === true,
    source: 'db',
  };
}

function normalizeHealthNeed(value) {
  return value === 'skin_coat' ? 'skin' : value;
}

function textMatchesAllergy(text, allergies) {
  const normalizedText = String(text || '').toLowerCase();
  return allergies.some((allergy) => normalizedText.includes(String(allergy).toLowerCase()));
}

function productMatchesAllergy(product, allergies = []) {
  const normalizedAllergies = allergies.map((item) => String(item).trim()).filter(Boolean);
  if (!normalizedAllergies.length) return false;
  return [product.name, product.flavor, product.ingredients].some((value) => textMatchesAllergy(value, normalizedAllergies));
}

function scoreProduct(product, profile = {}) {
  const goals = [...(profile.healthGoals || []), ...(profile.healthIssues || [])].map(normalizeHealthNeed);
  const flavors = profile.favoriteFlavors || [];
  let score = product.isAiComboOnly ? 4 : 0;
  if (profile.currentFoodType && ['mixed', product.foodType].includes(profile.currentFoodType)) score += 2;
  if (product.healthNeeds.some((need) => goals.includes(need))) score += 3;
  if (flavors.some((flavor) => String(product.flavor).toLowerCase().includes(String(flavor).toLowerCase()))) score += 1;
  return score;
}

function mixAiOnlyAndPublicProducts(products) {
  const aiOnly = products.filter((product) => product.isAiComboOnly);
  const publicProducts = products.filter((product) => !product.isAiComboOnly);
  const mixed = [];
  while (aiOnly.length || publicProducts.length) {
    if (aiOnly.length) mixed.push(aiOnly.shift());
    if (publicProducts.length) mixed.push(publicProducts.shift());
  }
  return mixed;
}

function mergeCatalogProducts(dbProducts, minimum = 3, profile = {}) {
  const normalized = dbProducts
    .map(normalizeProduct)
    .filter((item) => item.name)
    .filter((item) => !productMatchesAllergy(item, profile.allergies))
    .sort((a, b) => scoreProduct(b, profile) - scoreProduct(a, profile));
  const mixed = mixAiOnlyAndPublicProducts(normalized);
  if (mixed.length >= minimum) return mixed;
  return [...mixed, ...FALLBACK_PRODUCTS].slice(0, minimum);
}

function buildDeterministicRecommendation(profile, products = FALLBACK_PRODUCTS, source = 'fallback', durationDays = 7) {
  const dailyCalories = estimateDailyCalories(profile);

  return {
    source,
    petName: profile.name,
    durationDays,
    dailyCalories,
    summary: `${profile.name || 'Bé mèo'} nên bắt đầu với combo ${profile.currentFoodType || 'kết hợp'} complete-and-balanced phù hợp giai đoạn sống, theo dõi BCS và chuyển đổi thức ăn từ từ để hạn chế rối loạn tiêu hóa.`,
    feedingPlan: [
      'Chia khẩu phần thành 2-3 bữa mỗi ngày và đo bằng cốc tiêu chuẩn.',
      'Trộn thức ăn mới tăng dần trong 5-7 ngày, không đổi khẩu phần quá đột ngột.',
      'Luôn chuẩn bị nước sạch, theo dõi điểm thể trạng BCS quanh mức 4-5/9 và điều chỉnh sau 2-4 tuần.',
      'Ưu tiên khẩu phần có protein động vật phù hợp, taurine, chất béo cân bằng và không chứa dị nguyên đã khai báo.',
    ],
    warnings: buildNutritionWarnings(profile),
    products: products.slice(0, 3).map((product, index) => ({
      productId: product.source === 'db' ? product.id : null,
      fallbackId: product.source === 'fallback' ? product.id : null,
      name: product.name,
      reason: index === 0 ? 'Sản phẩm chính phù hợp nhất với hồ sơ hiện tại.' : 'Sản phẩm bổ trợ giúp khẩu phần đa dạng và dễ duy trì.',
      price: product.price,
      image: product.image || '',
      foodType: product.foodType,
      quantity: Math.max(1, Math.ceil(durationDays / 30)),
      daysCovered: durationDays,
    })),
  };
}

function buildRecommendationPrompt(profile, products, durationDays = 7) {
  return `Return only valid JSON for PawWorld Meow Quizz recommendation. Do not include markdown. Write all user-facing values in Vietnamese. Create a personalized meal kit combo from the provided catalog only for durationDays=${durationDays}. Mix AI-only combo products with normal catalog products when both are relevant. Avoid allergens, do not claim to treat disease, and do not recommend raw food or bones.\n${getNutritionGroundingForPrompt()}\nJSON fields required: summary, durationDays, dailyCalories {min,max,basis}, feedingPlan array, warnings array, products array with productId/fallbackId/name/reason/price/image/foodType/quantity/daysCovered. Every product must include quantity and daysCovered for the requested durationDays.\nProfile: ${JSON.stringify(profile)}\nCatalog: ${JSON.stringify(products)}`;
}

function extractJson(text) {
  const trimmed = String(text || '').trim();
  const match = trimmed.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : trimmed);
}

async function fetchCatalogProducts(ProductModel = Product, profile = {}) {
  try {
    const products = await Promise.race([
      ProductModel.find({
        isActive: true,
        foodType: { $in: ['dry', 'wet', 'mixed'] },
        $or: [{ isAiComboOnly: true }, { isAiComboOnly: { $ne: true } }],
      })
        .sort({ isBestSeller: -1, soldCount: -1, createdAt: -1 })
        .limit(8),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Product catalog timeout')), 3000)),
    ]);
    return mergeCatalogProducts(products, 3, profile);
  } catch {
    return FALLBACK_PRODUCTS;
  }
}

function enrichRecommendationProducts(products = [], durationDays = 7) {
  return products.map((product) => ({
    ...product,
    quantity: Math.max(1, Number(product.quantity) || Math.ceil(durationDays / 30)),
    daysCovered: Math.max(1, Number(product.daysCovered) || durationDays),
  }));
}

function toRecommendationProduct(catalogProduct, selectedProduct = {}, durationDays = 7, index = 0) {
  return {
    productId: catalogProduct.source === 'db' ? catalogProduct.id : null,
    fallbackId: catalogProduct.source === 'fallback' ? catalogProduct.id : null,
    name: catalogProduct.name,
    reason:
      selectedProduct.reason ||
      (index === 0
        ? 'Sản phẩm chính phù hợp nhất với hồ sơ hiện tại.'
        : 'Sản phẩm bổ trợ giúp khẩu phần đa dạng và dễ duy trì.'),
    price: catalogProduct.price,
    image: catalogProduct.image || '',
    foodType: catalogProduct.foodType,
    quantity: Math.max(1, Number(selectedProduct.quantity) || Math.ceil(durationDays / 30)),
    daysCovered: Math.max(1, Number(selectedProduct.daysCovered) || durationDays),
  };
}

function reconcileRecommendationProducts(selectedProducts = [], catalog = [], durationDays = 7) {
  const catalogByProductId = new Map(
    catalog.filter((product) => product.source === 'db').map((product) => [String(product.id), product]),
  );
  const catalogByFallbackId = new Map(
    catalog.filter((product) => product.source === 'fallback').map((product) => [String(product.id), product]),
  );
  const seen = new Set();

  return selectedProducts
    .map((selectedProduct, index) => {
      const productId = selectedProduct?.productId ? String(selectedProduct.productId) : '';
      const fallbackId = selectedProduct?.fallbackId ? String(selectedProduct.fallbackId) : '';
      const catalogProduct = productId
        ? catalogByProductId.get(productId)
        : catalogByFallbackId.get(fallbackId);
      if (!catalogProduct) return null;

      const key = `${catalogProduct.source}:${catalogProduct.id}`;
      if (seen.has(key)) return null;
      seen.add(key);
      return toRecommendationProduct(catalogProduct, selectedProduct, durationDays, index);
    })
    .filter(Boolean);
}

async function buildRecommendationForProfile(profile, options = {}) {
  const ProductModel = options.ProductModel || Product;
  const stream = options.streamChatCompletion || streamChatCompletion;
  const plainProfile = typeof profile.toObject === 'function' ? profile.toObject() : profile;
  const durationDays = Number(options.durationDays) || 7;
  const catalog = await fetchCatalogProducts(ProductModel, plainProfile);
  const deterministicRecommendation = buildDeterministicRecommendation(plainProfile, catalog, 'ai', durationDays);

  try {
    let content = '';
    await Promise.race([
      stream({
        messages: [{ role: 'user', content: buildRecommendationPrompt(plainProfile, catalog, durationDays) }],
        onToken: (token) => {
          content += token;
        },
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('AI recommendation timeout')), 12000)),
    ]);
    const parsed = extractJson(content);
    const recommendation = { ...deterministicRecommendation, ...parsed, source: 'ai', durationDays };
    const reconciledProducts = reconcileRecommendationProducts(parsed.products, catalog, durationDays);
    recommendation.products = reconciledProducts.length
      ? reconciledProducts
      : enrichRecommendationProducts(deterministicRecommendation.products, durationDays);
    return recommendation;
  } catch (err) {
    return buildDeterministicRecommendation(plainProfile, catalog, 'fallback', durationDays);
  }
}

module.exports = {
  FALLBACK_PRODUCTS,
  normalizeProduct,
  mergeCatalogProducts,
  buildRecommendationPrompt,
  buildDeterministicRecommendation,
  buildRecommendationForProfile,
  reconcileRecommendationProducts,
};
