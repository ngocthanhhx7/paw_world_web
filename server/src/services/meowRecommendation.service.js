const Product = require('../models/Product');
const { streamChatCompletion } = require('./shineshopChat.service');
const {
  buildNutritionWarnings,
  estimateDailyCalories,
  getNutritionGroundingForPrompt,
} = require('./meowNutritionKnowledge');

const DEFAULT_KCAL_PER_GRAM_BY_FOOD_TYPE = {
  dry: 3.6,
  wet: 1,
  mixed: 2.4,
  supplement: 1,
};

const PRODUCT_ROLE_PRIORITY = {
  base: 0,
  wet: 1,
  support: 2,
  treat: 3,
};

const PORTION_BY_PRODUCT_ROLE = {
  base: { percent: 75, label: 'Hạt khô', roleLabel: 'Thức ăn khô (hạt)' },
  wet: { percent: 20, label: 'Pate dinh dưỡng', roleLabel: 'Pate dinh dưỡng' },
  support: { percent: 5, label: 'Sản phẩm bổ trợ', roleLabel: 'Sản phẩm bổ trợ' },
  treat: { percent: 5, label: 'Thanh súp thưởng', roleLabel: 'Thanh súp thưởng' },
};

const TREAT_ROLE_TERMS = [
  'snack',
  'treat',
  'thuong',
  'banh thuong',
  'sup thuong',
  'soup thuong',
  'tuyp',
  'tube',
  'thanh sup',
  'churu',
];

const WET_ROLE_TERMS = ['pate', 'sot', 'gravy', 'mousse', 'sup', 'soup', 'lon', 'wet'];
const SOUP_TREAT_TERMS = ['sup thuong', 'soup thuong', 'thanh sup', 'tuyp', 'tube', 'churu'];

const HEALTH_TERM_MAP = {
  digestion: ['digestion', 'tieu hoa', 'duong ruot', 'tieu chay', 'bao ve tieu hoa'],
  skin: ['skin', 'da long', 'long muot', 'cham soc da', 'nam da', 'rung long'],
  hairball: ['hairball', 'bui long', 'long', 'catnip'],
  mother: ['mother', 'meo me', 'mang thai', 'cho con bu', 'kitten'],
  bone: ['bone', 'xuong', 'khop', 'calcium', 'canxi'],
  teeth: ['teeth', 'rang', 'nha khoa', 'dental'],
};

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
  const tags = Array.isArray(object.tags) ? object.tags.map((tag) => String(tag).trim()).filter(Boolean) : [];
  return {
    id: String(object._id || object.id),
    name: object.name,
    price: object.salePrice && object.salePrice > 0 ? object.salePrice : object.price,
    image: object.image || object.images?.[0] || '',
    foodType: object.foodType || 'dry',
    weight: object.weight || '',
    flavor: object.flavor || '',
    ageRange: object.ageRange || 'all',
    healthNeeds,
    ingredients: object.ingredients || '',
    tags,
    isAiComboOnly: object.isAiComboOnly === true,
    source: 'db',
  };
}

function normalizeHealthNeed(value) {
  return value === 'skin_coat' ? 'skin' : value;
}

function normalizeQuantityText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/,/g, '.')
    .replace(/\s+/g, ' ')
    .trim();
}

function productSearchText(product = {}) {
  return normalizeQuantityText([
    product.name,
    product.foodType,
    product.flavor,
    product.ingredients,
    ...(Array.isArray(product.tags) ? product.tags : []),
    ...(Array.isArray(product.healthNeeds) ? product.healthNeeds : []),
  ].filter(Boolean).join(' '));
}

function classifyProductRole(product = {}) {
  const text = productSearchText(product);
  if (TREAT_ROLE_TERMS.some((term) => text.includes(term))) return 'treat';
  if (product.foodType === 'dry') return 'base';
  if (product.foodType === 'wet' || product.foodType === 'mixed') return 'wet';
  if (WET_ROLE_TERMS.some((term) => text.includes(term))) return 'wet';
  return 'support';
}

function getProfileLifeStage(profile = {}) {
  const totalMonths = (Number(profile.ageYears || 0) * 12) + Number(profile.ageMonths || 0);
  if (totalMonths && totalMonths < 12) return 'kitten';
  if (Number(profile.ageYears || 0) >= 7) return 'senior';
  return 'adult';
}

function scoreAgeRange(product = {}, profile = {}) {
  const stage = getProfileLifeStage(profile);
  const ageRange = product.ageRange || 'all';
  if (ageRange === stage) return 6;
  if (ageRange === 'all') return 3;
  return -8;
}

function profileHealthTerms(profile = {}) {
  const goals = [...(profile.healthGoals || []), ...(profile.healthIssues || [])].map(normalizeHealthNeed);
  const terms = [];
  for (const goal of goals) {
    const normalizedGoal = normalizeQuantityText(goal);
    terms.push(normalizedGoal);
    if (HEALTH_TERM_MAP[normalizedGoal]) terms.push(...HEALTH_TERM_MAP[normalizedGoal]);
  }
  return terms.filter(Boolean);
}

function parseNumber(value) {
  const number = Number(String(value || '').replace(',', '.'));
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function trimNumber(value) {
  return Number(value).toLocaleString('en-US', {
    maximumFractionDigits: 2,
    useGrouping: false,
  });
}

function gramsFromUnit(amount, unit) {
  if (['kg', 'l'].includes(unit)) return amount * 1000;
  return amount;
}

function buildPackageLabel(count, amount, unit) {
  if (count) return `${trimNumber(count)} x ${trimNumber(amount)}${unit}`;
  return `${trimNumber(amount)}${unit}`;
}

function inferProductEnergy(product = {}, productRole = classifyProductRole(product), packageInfo = null) {
  const text = productSearchText(product);
  const isSoupTreat = productRole === 'treat' && SOUP_TREAT_TERMS.some((term) => text.includes(term));
  if (isSoupTreat) {
    const unitCount = Math.max(1, Number(packageInfo?.unitCount) || 1);
    return {
      kind: 'unit',
      caloriesPerPackage: unitCount * 10,
      energyBasis: '10 kcal/thanh',
    };
  }

  if (productRole === 'base' || product.foodType === 'dry') {
    return { kind: 'gram', kcalPerGram: 3.6, energyBasis: '3.6 kcal/g' };
  }

  if (text.includes('mousse')) {
    return { kind: 'gram', kcalPerGram: 0.65, energyBasis: '0.65 kcal/g' };
  }

  if (text.includes('gravy')) {
    return { kind: 'gram', kcalPerGram: 0.5, energyBasis: '0.5 kcal/g' };
  }

  if ((text.includes('mr vet') || text.includes('mr. vet')) && (text.includes('pate') || productRole === 'wet')) {
    return { kind: 'gram', kcalPerGram: 1.1, energyBasis: '1.1 kcal/g' };
  }

  const fallbackKcalPerGram = DEFAULT_KCAL_PER_GRAM_BY_FOOD_TYPE[product.foodType] || DEFAULT_KCAL_PER_GRAM_BY_FOOD_TYPE.mixed;
  return { kind: 'gram', kcalPerGram: fallbackKcalPerGram, energyBasis: `${trimNumber(fallbackKcalPerGram)} kcal/g` };
}

function parsePackageQuantity(product = {}) {
  const sourceText = String(product.weight || product.name || '').trim();
  if (!sourceText) return null;

  const text = normalizeQuantityText(sourceText);
  const dayMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:ngay|day|days)\b/);
  if (dayMatch) {
    const daysPerUnit = parseNumber(dayMatch[1]);
    if (daysPerUnit) {
      return {
        sourceText,
        packageLabel: `${trimNumber(daysPerUnit)} ngày`,
        basis: 'duration_days',
        amountGrams: null,
        daysPerUnit,
      };
    }
  }

  const multiPackMatch = text.match(
    /(\d+(?:\.\d+)?)\s*(?:goi|tui|tuyp|typ|tube|lon|hop|pack|packs|pcs|mieng)?\s*(?:x|\*)\s*(\d+(?:\.\d+)?)\s*(kg|g|gram|grams|ml|l)\b/,
  );
  if (multiPackMatch) {
    const count = parseNumber(multiPackMatch[1]);
    const amount = parseNumber(multiPackMatch[2]);
    const unit = multiPackMatch[3].startsWith('gram') ? 'g' : multiPackMatch[3];
    if (count && amount) {
      return {
        sourceText,
        packageLabel: buildPackageLabel(count, amount, unit),
        basis: 'weight_grams',
        amountGrams: Math.round(count * gramsFromUnit(amount, unit)),
        unitCount: count,
        unitGrams: Math.round(gramsFromUnit(amount, unit)),
        daysPerUnit: null,
      };
    }
  }

  const singlePackMatch = text.match(/(\d+(?:\.\d+)?)\s*(kg|g|gram|grams|ml|l)\b/);
  if (singlePackMatch) {
    const amount = parseNumber(singlePackMatch[1]);
    const unit = singlePackMatch[2].startsWith('gram') ? 'g' : singlePackMatch[2];
    if (amount) {
      return {
        sourceText,
        packageLabel: buildPackageLabel(null, amount, unit),
        basis: 'weight_grams',
        amountGrams: Math.round(gramsFromUnit(amount, unit)),
        daysPerUnit: null,
      };
    }
  }

  return null;
}

function averageDailyCalories(profile) {
  const dailyCalories = estimateDailyCalories(profile);
  if (typeof dailyCalories === 'number') return dailyCalories;
  if (dailyCalories?.min && dailyCalories?.max) {
    return Math.round((Number(dailyCalories.min) + Number(dailyCalories.max)) / 2);
  }
  return 200;
}

function resolveRecommendationQuantity(product = {}, profile = {}, durationDays = 7, portionPercentOverride = null) {
  const requestedDays = Math.max(1, Number(durationDays) || 7);
  const packageInfo = parsePackageQuantity(product);
  const productRole = product.productRole || classifyProductRole(product);
  const portion = PORTION_BY_PRODUCT_ROLE[productRole] || PORTION_BY_PRODUCT_ROLE.support;
  const portionPercent = Math.max(1, Number(portionPercentOverride) || portion.percent);
  const portionKcalPerDay = Math.round((averageDailyCalories(profile) * portionPercent) / 100);

  if (packageInfo?.basis === 'duration_days') {
    const quantity = Math.max(1, Math.ceil(requestedDays / packageInfo.daysPerUnit));
    return {
      quantity,
      packageLabel: packageInfo.packageLabel,
      quantityBasis: packageInfo.basis,
      estimatedDaysCovered: Math.round(quantity * packageInfo.daysPerUnit),
      portionPercent,
      portionLabel: portion.label,
      roleLabel: portion.roleLabel,
      portionKcalPerDay,
      energyBasis: '',
      servingNote: `Tính theo gói ${packageInfo.packageLabel} cho combo ${requestedDays} ngày.`,
    };
  }

  if (packageInfo?.basis === 'weight_grams') {
    const effectivePortionKcalPerDay = Math.max(1, portionKcalPerDay);
    const energy = inferProductEnergy(product, productRole, packageInfo);
    const caloriesPerPackage = Math.max(
      1,
      energy.kind === 'unit' ? energy.caloriesPerPackage : packageInfo.amountGrams * energy.kcalPerGram,
    );
    const quantity = Math.max(1, Math.ceil((effectivePortionKcalPerDay * requestedDays) / caloriesPerPackage));
    return {
      quantity,
      packageLabel: packageInfo.packageLabel,
      quantityBasis: packageInfo.basis,
      estimatedDaysCovered: Math.max(1, Math.round((quantity * caloriesPerPackage) / effectivePortionKcalPerDay)),
      portionPercent,
      portionLabel: portion.label,
      roleLabel: portion.roleLabel,
      portionKcalPerDay,
      energyBasis: energy.energyBasis,
      servingNote: `Tính theo ${packageInfo.packageLabel}, ${portion.label} chiếm ${trimNumber(portionPercent)}% khẩu phần, ước tính ${energy.energyBasis} cho ${requestedDays} ngày.`,
    };
  }

  return {
    quantity: 1,
    packageLabel: '',
    quantityBasis: 'manual_review',
    estimatedDaysCovered: null,
    portionPercent,
    portionLabel: portion.label,
    roleLabel: portion.roleLabel,
    portionKcalPerDay,
    energyBasis: '',
    servingNote: 'Cần kiểm tra thủ công vì sản phẩm chưa có định lượng rõ ràng.',
  };
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
  const text = productSearchText(product);
  const healthTerms = profileHealthTerms(profile);
  let score = product.isAiComboOnly ? 4 : 0;
  score += scoreAgeRange(product, profile);
  if (profile.currentFoodType && ['mixed', product.foodType].includes(profile.currentFoodType)) score += 2;
  if (product.healthNeeds.some((need) => goals.includes(need))) score += 3;
  if (healthTerms.some((term) => term && text.includes(term))) score += 3;
  if (flavors.some((flavor) => String(product.flavor).toLowerCase().includes(String(flavor).toLowerCase()))) score += 1;
  if (profile.weightGoal === 'lose' && classifyProductRole(product) === 'wet') score += 2;
  if (profile.weightGoal === 'gain' && classifyProductRole(product) === 'base') score += 1;
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

function sortProductsForProfile(products, profile = {}) {
  return [...products].sort((a, b) => {
    const scoreDelta = scoreProduct(b, profile) - scoreProduct(a, profile);
    if (scoreDelta) return scoreDelta;
    const roleDelta = PRODUCT_ROLE_PRIORITY[a.productRole] - PRODUCT_ROLE_PRIORITY[b.productRole];
    if (roleDelta) return roleDelta;
    return Number(a.price || 0) - Number(b.price || 0);
  });
}

function selectBalancedCatalogProducts(products = [], desiredCount = 3, profile = {}) {
  const count = Math.max(1, Number(desiredCount) || 3);
  const enriched = products
    .filter((product) => product?.name)
    .map((product) => ({
      ...product,
      productRole: product.productRole || classifyProductRole(product),
    }));
  const selected = [];
  const seen = new Set();

  function addProduct(product) {
    if (!product || selected.length >= count) return;
    const key = `${product.source || 'db'}:${product.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    selected.push(product);
  }

  function bestByRole(role) {
    return sortProductsForProfile(enriched.filter((product) => product.productRole === role), profile)[0];
  }

  addProduct(bestByRole('base'));
  addProduct(bestByRole('wet'));

  const remaining = sortProductsForProfile(
    enriched.filter((product) => !seen.has(`${product.source || 'db'}:${product.id}`)),
    profile,
  );
  remaining.forEach(addProduct);

  return selected;
}

function mergeCatalogProducts(dbProducts, minimum = 3, profile = {}) {
  const normalized = dbProducts
    .map(normalizeProduct)
    .filter((item) => item.name)
    .filter((item) => !productMatchesAllergy(item, profile.allergies))
    .sort((a, b) => scoreProduct(b, profile) - scoreProduct(a, profile));
  const mixed = mixAiOnlyAndPublicProducts(normalized);
  const desiredCount = mixed.length >= minimum ? Math.min(Math.max(minimum, 8), mixed.length) : minimum;
  const catalog = mixed.length >= minimum ? mixed : [...mixed, ...FALLBACK_PRODUCTS];
  return selectBalancedCatalogProducts(catalog, desiredCount, profile);
}

function buildDeterministicRecommendation(profile, products = FALLBACK_PRODUCTS, source = 'fallback', durationDays = 7) {
  const dailyCalories = estimateDailyCalories(profile);

  return {
    source,
    petName: profile.name,
    durationDays,
    dailyCalories,
    summary: `${profile.name || 'Bé mèo'} nên bắt đầu với combo dinh dưỡng cân bằng gồm hạt khô, pate và phần thưởng nhỏ phù hợp giai đoạn sống, theo dõi BCS và chuyển đổi thức ăn từ từ để hạn chế rối loạn tiêu hóa.`,
    feedingPlan: [
      'Chia khẩu phần thành 2-3 bữa mỗi ngày và đo bằng cốc tiêu chuẩn.',
      'Trộn thức ăn mới tăng dần trong 5-7 ngày, không đổi khẩu phần quá đột ngột.',
      'Luôn chuẩn bị nước sạch, theo dõi điểm thể trạng BCS quanh mức 4-5/9 và điều chỉnh sau 2-4 tuần.',
      'Ưu tiên khẩu phần có protein động vật phù hợp, taurine, chất béo cân bằng và không chứa dị nguyên đã khai báo.',
    ],
    warnings: buildNutritionWarnings(profile),
    products: applySharedPortionQuantities(
      products.slice(0, 3).map((product, index) => toRecommendationProduct(product, {}, durationDays, index, profile)),
      profile,
      durationDays,
    ),
  };
}

function buildRecommendationPrompt(profile, products, durationDays = 7) {
  return `Return only valid JSON for PawWorld Meow Quizz recommendation. Do not include markdown. Write all user-facing values in Vietnamese. Create a personalized meal kit combo from the provided catalog only for durationDays=${durationDays}. Mix AI-only combo products with normal catalog products when both are relevant. Prefer the PawWorld mix matrix when catalog allows it: base dry/kibble food first for 75% kcal/day, pate or wet hydration food second for 20% kcal/day, and Neeka-style soup treat/topping only as a 5% kcal/day add-on. Avoid allergens, do not claim to treat disease, and do not recommend raw food or bones.\n${getNutritionGroundingForPrompt()}\nJSON fields required: summary, durationDays, dailyCalories {min,max,basis}, feedingPlan array, warnings array, products array with productId/fallbackId/name/reason/price/image/foodType/productRole/quantity/daysCovered/packageLabel/quantityBasis/estimatedDaysCovered/servingNote. Quantity and productRole are validated by the server from catalog data, so select products from catalog and explain reasons only.\nProfile: ${JSON.stringify(profile)}\nCatalog: ${JSON.stringify(products)}`;
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
        .limit(24),
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
    productRole: product.productRole || classifyProductRole(product),
    quantity: Math.max(1, Number(product.quantity) || Math.ceil(durationDays / 30)),
    daysCovered: Math.max(1, Number(product.daysCovered) || durationDays),
    packageLabel: product.packageLabel || '',
    quantityBasis: product.quantityBasis || 'manual_review',
    estimatedDaysCovered: product.estimatedDaysCovered || null,
    portionPercent: product.portionPercent || PORTION_BY_PRODUCT_ROLE[product.productRole || classifyProductRole(product)]?.percent || 5,
    portionLabel: product.portionLabel || PORTION_BY_PRODUCT_ROLE[product.productRole || classifyProductRole(product)]?.label || 'Sản phẩm bổ trợ',
    roleLabel: product.roleLabel || PORTION_BY_PRODUCT_ROLE[product.productRole || classifyProductRole(product)]?.roleLabel || 'Sản phẩm bổ trợ',
    portionKcalPerDay: product.portionKcalPerDay || null,
    energyBasis: product.energyBasis || '',
    servingNote: product.servingNote || 'Cần kiểm tra thủ công vì sản phẩm chưa có định lượng rõ ràng.',
  }));
}

function applySharedPortionQuantities(products = [], profile = {}, durationDays = 7) {
  const roleCounts = products.reduce((counts, product) => {
    const role = product.productRole || classifyProductRole(product);
    counts.set(role, (counts.get(role) || 0) + 1);
    return counts;
  }, new Map());

  return products.map((product) => {
    const role = product.productRole || classifyProductRole(product);
    const basePortion = PORTION_BY_PRODUCT_ROLE[role] || PORTION_BY_PRODUCT_ROLE.support;
    const roleCount = Math.max(1, roleCounts.get(role) || 1);
    const sharedPercent = basePortion.percent / roleCount;
    const quantityMeta = resolveRecommendationQuantity(
      { ...product, weight: product.weight || product.packageLabel, productRole: role },
      profile,
      durationDays,
      sharedPercent,
    );

    return {
      ...product,
      productRole: role,
      quantity: quantityMeta.quantity,
      daysCovered: Math.max(1, Number(durationDays) || 7),
      packageLabel: quantityMeta.packageLabel,
      quantityBasis: quantityMeta.quantityBasis,
      estimatedDaysCovered: quantityMeta.estimatedDaysCovered,
      portionPercent: quantityMeta.portionPercent,
      portionLabel: quantityMeta.portionLabel,
      roleLabel: quantityMeta.roleLabel,
      portionKcalPerDay: quantityMeta.portionKcalPerDay,
      energyBasis: quantityMeta.energyBasis || product.energyBasis || '',
      servingNote: quantityMeta.servingNote,
    };
  });
}

function toRecommendationProduct(catalogProduct, selectedProduct = {}, durationDays = 7, index = 0, profile = {}) {
  const quantityMeta = resolveRecommendationQuantity(catalogProduct, profile, durationDays);
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
    productRole: catalogProduct.productRole || classifyProductRole(catalogProduct),
    quantity: quantityMeta.quantity,
    daysCovered: Math.max(1, Number(durationDays) || 7),
    packageLabel: quantityMeta.packageLabel,
    quantityBasis: quantityMeta.quantityBasis,
    estimatedDaysCovered: quantityMeta.estimatedDaysCovered,
    portionPercent: quantityMeta.portionPercent,
    portionLabel: quantityMeta.portionLabel,
    roleLabel: quantityMeta.roleLabel,
    portionKcalPerDay: quantityMeta.portionKcalPerDay,
    energyBasis: quantityMeta.energyBasis || '',
    servingNote: quantityMeta.servingNote,
  };
}

function reconcileRecommendationProducts(selectedProducts = [], catalog = [], durationDays = 7, profile = {}) {
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
      return toRecommendationProduct(catalogProduct, selectedProduct, durationDays, index, profile);
    })
    .filter(Boolean);
}

function ensureBalancedRecommendationProducts(reconciledProducts = [], catalog = [], durationDays = 7, profile = {}) {
  const balancedCatalog = selectBalancedCatalogProducts(catalog, 3, profile);
  const selected = [];
  const seen = new Set();

  function keyFor(product) {
    return `${product.fallbackId ? 'fallback' : 'db'}:${product.productId || product.fallbackId}`;
  }

  function addRecommendationProduct(product) {
    if (!product || selected.length >= 3) return;
    const key = keyFor(product);
    if (seen.has(key)) return;
    seen.add(key);
    selected.push(product);
  }

  function addRole(role) {
    const existing = reconciledProducts.find((product) => product.productRole === role);
    if (existing) {
      addRecommendationProduct(existing);
      return;
    }
    const catalogProduct = balancedCatalog.find((product) => product.productRole === role);
    if (catalogProduct) {
      addRecommendationProduct(toRecommendationProduct(catalogProduct, {}, durationDays, selected.length, profile));
    }
  }

  addRole('base');
  addRole('wet');
  reconciledProducts.forEach(addRecommendationProduct);
  balancedCatalog.forEach((product) => {
    addRecommendationProduct(toRecommendationProduct(product, {}, durationDays, selected.length, profile));
  });

  const recommendationProducts = selected.length ? selected : reconciledProducts;
  return applySharedPortionQuantities(recommendationProducts, profile, durationDays);
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
    const reconciledProducts = reconcileRecommendationProducts(parsed.products, catalog, durationDays, plainProfile);
    const balancedProducts = ensureBalancedRecommendationProducts(reconciledProducts, catalog, durationDays, plainProfile);
    recommendation.products = balancedProducts.length
      ? balancedProducts
      : enrichRecommendationProducts(deterministicRecommendation.products, durationDays);
    return recommendation;
  } catch (err) {
    return buildDeterministicRecommendation(plainProfile, catalog, 'fallback', durationDays);
  }
}

module.exports = {
  FALLBACK_PRODUCTS,
  normalizeProduct,
  classifyProductRole,
  selectBalancedCatalogProducts,
  parsePackageQuantity,
  resolveRecommendationQuantity,
  mergeCatalogProducts,
  buildRecommendationPrompt,
  buildDeterministicRecommendation,
  buildRecommendationForProfile,
  reconcileRecommendationProducts,
};
