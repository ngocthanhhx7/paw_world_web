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
  const prompt = buildRecommendationPrompt(profile, FALLBACK_PRODUCTS, 7);

  assert.match(prompt, /Return only valid JSON/);
  assert.match(prompt, /durationDays/);
  assert.match(prompt, /7/);
  assert.match(prompt, /quantity/);
  assert.match(prompt, /daysCovered/);
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
    30,
  );

  assert.equal(recommendation.petName, 'Pun');
  assert.equal(recommendation.source, 'fallback');
  assert.equal(recommendation.durationDays, 30);
  assert.ok(recommendation.dailyCalories.min > 0);
  assert.ok(Array.isArray(recommendation.warnings));
  assert.match(recommendation.warnings.join(' '), /bác sĩ thú y/i);
  assert.ok(Array.isArray(recommendation.products));
  assert.equal(recommendation.products[0].quantity, 1);
  assert.equal(recommendation.products[0].daysCovered, 30);
});

test('normalizeProduct maps skin_coat db health need to recommendation skin scoring value', () => {
  const product = normalizeProduct({
    _id: 'product-id',
    name: 'Skin Coat Food',
    price: 100000,
    foodType: 'dry',
    healthNeeds: ['skin_coat'],
  });

  assert.deepEqual(product.healthNeeds, ['skin']);
});

test('mergeCatalogProducts excludes products matching profile allergens best effort', () => {
  const catalog = mergeCatalogProducts(
    [
      { _id: 'shrimp-food', name: 'Shrimp Food', price: 1, ingredients: 'shrimp meal' },
      { _id: 'salmon-food', name: 'Salmon Food', price: 1, ingredients: 'salmon meal' },
    ],
    1,
    { allergies: ['shrimp'] },
  );

  assert.equal(catalog[0].id, 'salmon-food');
});

test('buildRecommendationForProfile requests AI-only and public active food products', async () => {
  let query;
  const ProductModel = {
    find(input) {
      query = input;
      return {
        sort() {
          return {
            limit: async () => [{ _id: 'db-1', name: 'DB Food', price: 1, foodType: 'dry' }],
          };
        },
      };
    },
  };

  await buildRecommendationForProfile(profile, {
    ProductModel,
    streamChatCompletion: async () => {
      throw new Error('AI unavailable');
    },
  });

  assert.equal(query.isActive, true);
  assert.deepEqual(query.foodType, { $in: ['dry', 'wet', 'mixed'] });
  assert.deepEqual(query.$or, [{ isAiComboOnly: true }, { isAiComboOnly: { $ne: true } }]);
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

test('buildRecommendationForProfile passes durationDays through fallback output', async () => {
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
    durationDays: 7,
    ProductModel,
    streamChatCompletion: async () => {
      throw new Error('AI unavailable');
    },
  });

  assert.equal(recommendation.durationDays, 7);
  assert.equal(recommendation.products[0].daysCovered, 7);
});

test('buildRecommendationForProfile reconciles AI product display fields to catalog by productId', async () => {
  const productId = '507f1f77bcf86cd799439011';
  const ProductModel = {
    find() {
      return {
        sort() {
          return {
            limit: async () => [
              {
                _id: productId,
                name: 'Catalog Combo Food',
                price: 120000,
                salePrice: 99000,
                image: 'catalog.jpg',
                foodType: 'wet',
              },
            ],
          };
        },
      };
    },
  };

  const recommendation = await buildRecommendationForProfile(profile, {
    ProductModel,
    streamChatCompletion: async ({ onToken }) => {
      onToken(JSON.stringify({
        summary: 'AI summary',
        products: [
          {
            productId,
            name: 'Fake AI Food',
            price: 1,
            image: 'fake.jpg',
            foodType: 'dry',
            reason: 'AI selected this item.',
            quantity: 4,
            daysCovered: 30,
          },
        ],
      }));
    },
    durationDays: 30,
  });

  assert.equal(recommendation.source, 'ai');
  assert.equal(recommendation.products[0].productId, productId);
  assert.equal(recommendation.products[0].name, 'Catalog Combo Food');
  assert.equal(recommendation.products[0].price, 99000);
  assert.equal(recommendation.products[0].image, 'catalog.jpg');
  assert.equal(recommendation.products[0].foodType, 'wet');
  assert.equal(recommendation.products[0].reason, 'AI selected this item.');
  assert.equal(recommendation.products[0].quantity, 4);
  assert.equal(recommendation.products[0].daysCovered, 30);
});
