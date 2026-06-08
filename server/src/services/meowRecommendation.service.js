const Product = require('../models/Product');
const { streamChatCompletion } = require('./shineshopChat.service');

const FALLBACK_PRODUCTS = [
  {
    id: 'fallback-dry-digestion',
    name: 'PawWorld H?t kh? h? tr? ti?u ho? nh?y c?m',
    price: 189000,
    foodType: 'dry',
    flavor: 'salmon',
    healthNeeds: ['digestion'],
    source: 'fallback',
  },
  {
    id: 'fallback-wet-skin-coat',
    name: 'PawWorld Pate ??t ch?m da v? l?ng',
    price: 39000,
    foodType: 'wet',
    flavor: 'tuna',
    healthNeeds: ['skin'],
    source: 'fallback',
  },
  {
    id: 'fallback-mixed-bone',
    name: 'PawWorld Meal Kit k?t h?p c?n b?ng',
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
  const weight = Number(profile.weightKg || 4);
  const activityFactor = profile.activityLevel === 'very_active' ? 1.25 : profile.activityLevel === 'low' ? 0.9 : 1;
  const goalFactor = profile.weightGoal === 'gain' ? 1.12 : profile.weightGoal === 'lose' ? 0.88 : 1;
  const calories = Math.max(120, Math.round(70 * Math.pow(weight, 0.75) * activityFactor * goalFactor));

  return {
    source,
    petName: profile.name,
    dailyCalories: { min: Math.round(calories * 0.9), max: Math.round(calories * 1.1) },
    summary: `${profile.name || 'B? m?o'} n?n b?t ??u v?i combo ${profile.currentFoodType || 'k?t h?p'} c?n b?ng, t?ng chuy?n ??i th?c ?n t? t? trong 7 ng?y ?? h?n ch? r?i lo?n ti?u ho?.`,
    feedingPlan: [
      'Chia kh?u ph?n th?nh 2-3 b?a m?i ng?y v? ?o b?ng c?c ti?u chu?n.',
      'Tr?n th?c ?n m?i t?ng d?n trong 7 ng?y, kh?ng ??i kh?u ph?n qu? ??t ng?t.',
      'Lu?n chu?n b? n??c s?ch v? theo d?i ?i?m th? tr?ng BCS quanh m?c 5/9.',
    ],
    warnings: profile.noAllergies ? [] : (profile.allergies || []).map((item) => `Tr?nh th?nh ph?n: ${item}.`),
    products: products.slice(0, 3).map((product, index) => ({
      productId: product.source === 'db' ? product.id : null,
      fallbackId: product.source === 'fallback' ? product.id : null,
      name: product.name,
      reason: index === 0 ? 'S?n ph?m ch?nh ph? h?p nh?t v?i h? s? hi?n t?i.' : 'S?n ph?m b? tr? gi?p kh?u ph?n ?a d?ng v? d? duy tr?.',
      price: product.price,
      image: product.image || '',
      foodType: product.foodType,
    })),
  };
}

function buildRecommendationPrompt(profile, products) {
  return `B?n l? chuy?n gia dinh d??ng m?o cho PawWorld. Tr? v? duy nh?t JSON h?p l?, kh?ng markdown. H?y t?o combo meal kit c? nh?n ho? b?ng ti?ng Vi?t d?a tr?n h? s? m?o v? ch? ch?n s?n ph?m trong catalog. Kh?ng kh?ng ??nh ?i?u tr? b?nh, kh?ng khuy?n ?? s?ng/x??ng, tr?nh d? ?ng. JSON c?n c?: summary, dailyCalories {min,max}, feedingPlan array, warnings array, products array v?i productId/fallbackId/name/reason/price/image/foodType.\nProfile: ${JSON.stringify(profile)}\nCatalog: ${JSON.stringify(products)}`;
}

function extractJson(text) {
  const trimmed = String(text || '').trim();
  const match = trimmed.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : trimmed);
}

async function fetchCatalogProducts(ProductModel = Product) {
  const products = await ProductModel.find({ isActive: true, foodType: { $in: ['dry', 'wet', 'mixed'] } })
    .sort({ isBestSeller: -1, soldCount: -1, createdAt: -1 })
    .limit(8);
  return mergeCatalogProducts(products);
}

async function buildRecommendationForProfile(profile, options = {}) {
  const ProductModel = options.ProductModel || Product;
  const stream = options.streamChatCompletion || streamChatCompletion;
  const catalog = await fetchCatalogProducts(ProductModel);
  const plainProfile = typeof profile.toObject === 'function' ? profile.toObject() : profile;

  try {
    let content = '';
    await stream({
      messages: [{ role: 'user', content: buildRecommendationPrompt(plainProfile, catalog) }],
      onToken: (token) => {
        content += token;
      },
    });
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

