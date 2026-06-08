const assert = require('node:assert/strict');
const test = require('node:test');

const {
  FALLBACK_PRODUCTS,
  buildDeterministicRecommendation,
  buildRecommendationForProfile,
  buildRecommendationPrompt,
  mergeCatalogProducts,
  normalizeProduct,
} = require('./meowRecommendation.service');
const {
  NUTRITION_REFERENCE_SOURCES,
  getNutritionGroundingForPrompt,
} = require('./meowNutritionKnowledge');

const profile = {
  name: 'Pun',
  weightKg: 4,
  activityLevel: 'active',
  weightGoal: 'maintain',
  currentFoodType: 'mixed',
  allergies: ['shrimp'],
};

test('normalizeProduct maps db product fields to recommendation catalog', () => {
  const product = normalizeProduct({
    _id: 'product-id',
    name: 'Salmon Food',
    price: 100000,
    salePrice: 90000,
    images: ['image.jpg'],
    foodType: 'dry',
    healthNeeds: ['digestion'],
  });

  assert.equal(product.id, 'product-id');
  assert.equal(product.price, 90000);
  assert.equal(product.image, 'image.jpg');
  assert.equal(product.source, 'db');
});

test('mergeCatalogProducts uses db products first then fallback catalog', () => {
  const catalog = mergeCatalogProducts([{ _id: 'db-1', name: 'DB Food', price: 1 }], 3);

  assert.equal(catalog[0].id, 'db-1');
  assert.equal(catalog[0].source, 'db');
  assert.equal(catalog.length, 3);
  assert.equal(catalog[1].source, 'fallback');
});

test('buildRecommendationPrompt includes JSON-only and safety guardrails', () => {
  const prompt = buildRecommendationPrompt(profile, FALLBACK_PRODUCTS);

  assert.match(prompt, /Return only valid JSON/);
  assert.match(prompt, /Avoid allergens/);
  assert.match(prompt, /provided catalog/);
  assert.match(prompt, /Nutrition grounding/);
  assert.match(prompt, /WSAVA/);
  assert.match(prompt, /AAFCO/);
  assert.match(prompt, /FEDIAF/);
  assert.match(prompt, /NRC/);
  assert.match(prompt, /complete-and-balanced/i);
  assert.match(prompt, /BCS/);
  assert.match(prompt, /taurine/i);
  assert.match(prompt, /water/i);
  assert.match(prompt, /veterinary/i);
});

test('nutrition knowledge pack references the supplied source set', () => {
  const names = NUTRITION_REFERENCE_SOURCES.map((source) => source.shortName).sort();
  assert.deepEqual(names, ['AAFCO', 'FEDIAF', 'NRC', 'WSAVA']);
  const grounding = getNutritionGroundingForPrompt();
  assert.match(grounding, /WSAVA/);
  assert.match(grounding, /AAFCO/);
  assert.match(grounding, /FEDIAF/);
  assert.match(grounding, /NRC/);
});

test('buildDeterministicRecommendation returns stable fallback shape', () => {
  const recommendation = buildDeterministicRecommendation(
    { ...profile, healthIssues: ['nôn kéo dài'] },
    FALLBACK_PRODUCTS,
    'fallback',
  );

  assert.equal(recommendation.petName, 'Pun');
  assert.equal(recommendation.source, 'fallback');
  assert.ok(recommendation.dailyCalories.min > 0);
  assert.ok(Array.isArray(recommendation.warnings));
  assert.match(recommendation.warnings.join(' '), /bác sĩ thú y/i);
  assert.ok(Array.isArray(recommendation.products));
});

test('buildRecommendationForProfile falls back when AI fails', async () => {
  const ProductModel = {
    find() {
      return {
        sort() {
          return {
            limit: async () => [{ _id: 'db-1', name: 'DB Food', price: 1, foodType: 'dry' }],
          };
        },
      };
    },
  };

  const recommendation = await buildRecommendationForProfile(profile, {
    ProductModel,
    streamChatCompletion: async () => {
      throw new Error('AI unavailable');
    },
  });

  assert.equal(recommendation.source, 'fallback');
  assert.equal(recommendation.products[0].productId, 'db-1');
});
