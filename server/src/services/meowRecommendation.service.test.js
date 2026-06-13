const assert = require('node:assert/strict');
const test = require('node:test');

const {
  FALLBACK_PRODUCTS,
  buildDeterministicRecommendation,
  buildRecommendationForProfile,
  buildRecommendationPrompt,
  classifyProductRole,
  mergeCatalogProducts,
  normalizeProduct,
  parsePackageQuantity,
  resolveRecommendationQuantity,
  selectBalancedCatalogProducts,
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
    weight: '1.5kg',
    healthNeeds: ['digestion'],
    tags: ['hat kho', 'long muot'],
  });

  assert.equal(product.id, 'product-id');
  assert.equal(product.price, 90000);
  assert.equal(product.image, 'image.jpg');
  assert.equal(product.weight, '1.5kg');
  assert.deepEqual(product.tags, ['hat kho', 'long muot']);
  assert.equal(product.source, 'db');
});

test('classifyProductRole separates base food, wet hydration, and treat toppings', () => {
  assert.equal(classifyProductRole({ name: 'Hat kho cho meo 1kg', foodType: 'dry', tags: ['hat kho'] }), 'base');
  assert.equal(classifyProductRole({ name: 'Pate dinh duong lon 85g', foodType: 'wet', tags: ['pate'] }), 'wet');
  assert.equal(classifyProductRole({ name: 'Sup thuong ca ngu 12g', foodType: 'wet', tags: ['snack'] }), 'treat');
});

test('selectBalancedCatalogProducts prioritizes age-compatible base and wet foods before treats', () => {
  const catalog = [
    normalizeProduct({ _id: 'treat-1', name: 'Sup thuong ca ngu 12g', price: 1, foodType: 'wet', ageRange: 'all', tags: ['snack'] }),
    normalizeProduct({ _id: 'adult-dry', name: 'Hat kho adult 1kg', price: 1, foodType: 'dry', ageRange: 'adult', tags: ['hat kho'] }),
    normalizeProduct({ _id: 'kitten-dry', name: 'Hat kho kitten 1kg', price: 1, foodType: 'dry', ageRange: 'kitten', tags: ['hat kho'] }),
    normalizeProduct({ _id: 'kitten-wet', name: 'Pate kitten lon 85g', price: 1, foodType: 'wet', ageRange: 'kitten', tags: ['pate'] }),
  ];

  const selected = selectBalancedCatalogProducts(catalog, 3, {
    ageYears: 0,
    ageMonths: 4,
    currentFoodType: 'mixed',
    healthGoals: ['digestion'],
  });

  assert.deepEqual(selected.map((product) => product.id), ['kitten-dry', 'kitten-wet', 'treat-1']);
  assert.deepEqual(selected.map((product) => product.productRole), ['base', 'wet', 'treat']);
});

test('parsePackageQuantity reads package size from weight before product name', () => {
  assert.deepEqual(parsePackageQuantity({ name: 'Hat kho goi 1kg', weight: '1.5kg' }), {
    sourceText: '1.5kg',
    packageLabel: '1.5kg',
    basis: 'weight_grams',
    amountGrams: 1500,
    daysPerUnit: null,
  });

  assert.deepEqual(parsePackageQuantity({ name: 'Pate 6x85g', weight: '' }), {
    sourceText: 'Pate 6x85g',
    packageLabel: '6 x 85g',
    basis: 'weight_grams',
    amountGrams: 510,
    daysPerUnit: null,
  });
});

test('parsePackageQuantity handles multi-pack, ml, and day packages', () => {
  assert.equal(parsePackageQuantity({ weight: '12 goi x 80g' }).amountGrams, 960);
  assert.equal(parsePackageQuantity({ weight: '4 tuyp x 15g' }).amountGrams, 60);
  assert.equal(parsePackageQuantity({ weight: '200ml' }).amountGrams, 200);
  assert.deepEqual(parsePackageQuantity({ weight: '7 ngay' }), {
    sourceText: '7 ngay',
    packageLabel: '7 ngày',
    basis: 'duration_days',
    amountGrams: null,
    daysPerUnit: 7,
  });
});

test('resolveRecommendationQuantity scales packages by selected duration', () => {
  const dryProduct = { name: 'Hat kho 1kg', weight: '1kg', foodType: 'dry' };
  const wetProduct = { name: 'Pate 12 goi x 80g', weight: '12 goi x 80g', foodType: 'wet' };
  const dayProduct = { name: 'Kit 7 ngay', weight: '7 ngay', foodType: 'mixed' };

  assert.equal(resolveRecommendationQuantity(dryProduct, profile, 1).quantity, 1);
  assert.equal(resolveRecommendationQuantity(dryProduct, profile, 30).quantity, 2);
  assert.equal(resolveRecommendationQuantity(wetProduct, profile, 7).quantity, 2);
  assert.equal(resolveRecommendationQuantity(dayProduct, profile, 30).quantity, 5);
});

test('resolveRecommendationQuantity marks unknown packages for manual review', () => {
  const result = resolveRecommendationQuantity({ name: 'Mystery Food', foodType: 'dry' }, profile, 30);

  assert.equal(result.quantity, 1);
  assert.equal(result.quantityBasis, 'manual_review');
  assert.equal(result.packageLabel, '');
  assert.match(result.servingNote, /kiểm tra/i);
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
  assert.equal(recommendation.products[0].quantityBasis, 'manual_review');
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
            weight: '80g',
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
  const reconciledProduct = recommendation.products.find((product) => product.productId === productId);
  assert.ok(reconciledProduct);
  assert.equal(reconciledProduct.name, 'Catalog Combo Food');
  assert.equal(reconciledProduct.price, 99000);
  assert.equal(reconciledProduct.image, 'catalog.jpg');
  assert.equal(reconciledProduct.foodType, 'wet');
  assert.equal(reconciledProduct.reason, 'AI selected this item.');
  assert.equal(reconciledProduct.quantity, 82);
  assert.equal(reconciledProduct.daysCovered, 30);
  assert.equal(reconciledProduct.packageLabel, '80g');
  assert.equal(reconciledProduct.quantityBasis, 'weight_grams');
});

test('buildRecommendationForProfile repairs unbalanced AI selections with base and wet foods', async () => {
  const dryId = '507f1f77bcf86cd799439021';
  const wetId = '507f1f77bcf86cd799439022';
  const treatId = '507f1f77bcf86cd799439023';
  const ProductModel = {
    find() {
      return {
        sort() {
          return {
            limit: async () => [
              {
                _id: treatId,
                name: 'Sup thuong ca ngu 12g',
                price: 2100,
                foodType: 'wet',
                weight: '12g',
                tags: ['snack'],
              },
              {
                _id: wetId,
                name: 'Pate dinh duong lon 85g',
                price: 11200,
                foodType: 'wet',
                weight: '85g',
                tags: ['pate'],
              },
              {
                _id: dryId,
                name: 'Hat kho protein cao goi 1kg',
                price: 161000,
                foodType: 'dry',
                weight: '1kg',
                tags: ['hat kho'],
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
            productId: treatId,
            name: 'Sup thuong ca ngu 12g',
            reason: 'AI selected a treat only.',
            quantity: 30,
          },
        ],
      }));
    },
    durationDays: 7,
  });

  assert.deepEqual(recommendation.products.map((product) => product.productId), [dryId, wetId, treatId]);
  assert.deepEqual(recommendation.products.map((product) => product.productRole), ['base', 'wet', 'treat']);
  assert.equal(recommendation.products[2].reason, 'AI selected a treat only.');
});
