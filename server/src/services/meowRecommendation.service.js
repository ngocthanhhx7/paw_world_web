const Product = require('../models/Product');
const { streamChatCompletion } = require('./shineshopChat.service');

const FALLBACK_PRODUCTS = [
  {
    id: 'fallback-dry-digestion',
    name: 'PawWorld Sensitive Digestion Dry Cat Food',
    price: 189000,
    foodType: 'dry',
    flavor: 'salmon',
    healthNeeds: ['digestion'],
    source: 'fallback',
  },
  {
    id: 'fallback-wet-skin-coat',
    name: 'PawWorld Skin & Coat Wet Pate',
    price: 39000,
    foodType: 'wet',
    flavor: 'tuna',
    healthNeeds: ['skin'],
    source: 'fallback',
  },
  {
    id: 'fallback-mixed-bone',
    name: 'PawWorld Complete Mixed Meal Kit',
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
    summary: `${profile.name || 'Your cat'} should start with a balanced ${profile.currentFoodType || 'mixed'} plan adjusted gradually over 7 days.`,
    feedingPlan: [
      'Split meals into 2 to 3 portions per day.',
      'Introduce new food slowly over one week.',
      'Keep fresh water available at all times.',
    ],
    warnings: profile.noAllergies ? [] : (profile.allergies || []).map((item) => `Avoid ${item}.`),
    products: products.slice(0, 3).map((product, index) => ({
      productId: product.source === 'db' ? product.id : null,
      fallbackId: product.source === 'fallback' ? product.id : null,
      name: product.name,
      reason: index === 0 ? 'Best fit for the current profile.' : 'Useful supporting option for variety.',
      price: product.price,
      image: product.image || '',
      foodType: product.foodType,
    })),
  };
}

function buildRecommendationPrompt(profile, products) {
  return `Return only valid JSON for PawWorld Meow Quizz recommendation. Do not include markdown. Recommend only products from the provided catalog. Avoid allergens and do not claim to treat disease.\nProfile: ${JSON.stringify(profile)}\nCatalog: ${JSON.stringify(products)}`;
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

