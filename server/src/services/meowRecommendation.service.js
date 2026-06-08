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
  return {
    id: String(object._id || object.id),
    name: object.name,
    price: object.salePrice && object.salePrice > 0 ? object.salePrice : object.price,
    image: object.image || object.images?.[0] || '',
    foodType: object.foodType || 'dry',
    flavor: object.flavor || '',
    ageRange: object.ageRange || 'all',
    healthNeeds: Array.isArray(object.healthNeeds) ? object.healthNeeds : [],
    ingredients: object.ingredients || '',
    source: 'db',
  };
}

function mergeCatalogProducts(dbProducts, minimum = 3) {
  const normalized = dbProducts.map(normalizeProduct).filter((item) => item.name);
  if (normalized.length >= minimum) return normalized;
  return [...normalized, ...FALLBACK_PRODUCTS].slice(0, minimum);
}

function buildDeterministicRecommendation(profile, products = FALLBACK_PRODUCTS, source = 'fallback') {
  const dailyCalories = estimateDailyCalories(profile);

  return {
    source,
    petName: profile.name,
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
    })),
  };
}

function buildRecommendationPrompt(profile, products) {
  return `Return only valid JSON for PawWorld Meow Quizz recommendation. Do not include markdown. Write all user-facing values in Vietnamese. Create a personalized meal kit combo from the provided catalog only. Avoid allergens, do not claim to treat disease, and do not recommend raw food or bones.\n${getNutritionGroundingForPrompt()}\nJSON fields required: summary, dailyCalories {min,max,basis}, feedingPlan array, warnings array, products array with productId/fallbackId/name/reason/price/image/foodType.\nProfile: ${JSON.stringify(profile)}\nCatalog: ${JSON.stringify(products)}`;
}

function extractJson(text) {
  const trimmed = String(text || '').trim();
  const match = trimmed.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : trimmed);
}

async function fetchCatalogProducts(ProductModel = Product) {
  try {
    const products = await Promise.race([
      ProductModel.find({ isActive: true, foodType: { $in: ['dry', 'wet', 'mixed'] } })
        .sort({ isBestSeller: -1, soldCount: -1, createdAt: -1 })
        .limit(8),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Product catalog timeout')), 3000)),
    ]);
    return mergeCatalogProducts(products);
  } catch {
    return FALLBACK_PRODUCTS;
  }
}

async function buildRecommendationForProfile(profile, options = {}) {
  const ProductModel = options.ProductModel || Product;
  const stream = options.streamChatCompletion || streamChatCompletion;
  const catalog = await fetchCatalogProducts(ProductModel);
  const plainProfile = typeof profile.toObject === 'function' ? profile.toObject() : profile;

  try {
    let content = '';
    await Promise.race([
      stream({
        messages: [{ role: 'user', content: buildRecommendationPrompt(plainProfile, catalog) }],
        onToken: (token) => {
          content += token;
        },
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('AI recommendation timeout')), 12000)),
    ]);
    return { ...buildDeterministicRecommendation(plainProfile, catalog, 'ai'), ...extractJson(content), source: 'ai' };
  } catch (err) {
    return buildDeterministicRecommendation(plainProfile, catalog, 'fallback');
  }
}

module.exports = {
  FALLBACK_PRODUCTS,
  normalizeProduct,
  mergeCatalogProducts,
  buildRecommendationPrompt,
  buildDeterministicRecommendation,
  buildRecommendationForProfile,
};
