const NUTRITION_REFERENCE_SOURCES = [
  {
    shortName: 'WSAVA',
    title: 'WSAVA Nutritional Guidelines Vietnamese',
    role: 'nutrition assessment, BCS monitoring, pet/diet/environment risk factors, escalation to veterinarian',
  },
  {
    shortName: 'AAFCO',
    title: 'AAFCO Dog and Cat Food Nutrient Profiles and adequacy methods',
    role: 'complete-and-balanced adequacy claims, life stage matching, label claim caution',
  },
  {
    shortName: 'FEDIAF',
    title: 'FEDIAF Nutritional Guidelines 2025',
    role: 'complete and complementary pet food guidance, energy and nutrient adequacy framing',
  },
  {
    shortName: 'NRC',
    title: 'Nutrient Requirements of Dogs and Cats, National Research Council',
    role: 'resting energy requirement basis and essential nutrient themes for cats',
  },
];

const CORE_GROUNDING_RULES = [
  'Use WSAVA-style nutrition assessment: consider the pet, current diet, feeding management, environment, BCS, weight trend, activity, life stage, and owner observations.',
  'Prefer foods that are complete-and-balanced for the cat life stage; use AAFCO/FEDIAF adequacy framing and avoid inventing adequacy claims for unknown products.',
  'Use NRC-style resting energy requirement as a starting point: RER = 70 x bodyWeightKg^0.75, then adjust cautiously for activity and weight goal.',
  'For cats, preserve essential nutrition themes: adequate animal protein, fat balance, taurine, water intake, minerals/vitamins, and gradual diet transition.',
  'Avoid allergens stated by the owner, raw food, bones, and disease treatment claims.',
  'Recommend veterinary consultation for severe, recurring, urgent, unexplained, or disease-like symptoms; do not diagnose or prescribe medication.',
];

function estimateDailyCalories(profile) {
  const weight = Math.max(Number(profile?.weightKg || 0), 1);
  const rer = 70 * Math.pow(weight, 0.75);
  const activityFactor = profile?.activityLevel === 'very_active' ? 1.3 : profile?.activityLevel === 'low' ? 0.95 : 1.1;
  const goalFactor = profile?.weightGoal === 'gain' ? 1.12 : profile?.weightGoal === 'lose' ? 0.88 : 1;
  const target = Math.max(120, Math.round(rer * activityFactor * goalFactor));
  return {
    min: Math.round(target * 0.9),
    max: Math.round(target * 1.1),
    basis: 'NRC RER 70 x kg^0.75 adjusted by activity and weight goal',
  };
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
}

function buildNutritionWarnings(profile) {
  const warnings = [];
  const allergies = profile?.noAllergies ? [] : normalizeList(profile?.allergies);
  for (const item of allergies) {
    warnings.push(`Tránh thành phần: ${item}.`);
  }

  const issues = normalizeList(profile?.healthIssues);
  if (issues.length) {
    warnings.push(
      'Nếu các dấu hiệu sức khỏe nghiêm trọng, tái diễn, kéo dài hoặc chưa rõ nguyên nhân, hãy trao đổi với bác sĩ thú y trước khi đổi khẩu phần.',
    );
  }

  warnings.push('Chuyển đổi thức ăn từ từ trong 5-7 ngày và luôn chuẩn bị nước sạch cho mèo.');
  return warnings;
}

function getNutritionGroundingForPrompt() {
  const sourceLine = NUTRITION_REFERENCE_SOURCES
    .map((source) => `${source.shortName}: ${source.role}`)
    .join('; ');
  return [
    'Nutrition grounding:',
    `Sources used as curated guidance, not verbatim text: ${sourceLine}.`,
    ...CORE_GROUNDING_RULES.map((rule) => `- ${rule}`),
    'Output must be practical Vietnamese advice, not a medical diagnosis.',
  ].join('\n');
}

module.exports = {
  NUTRITION_REFERENCE_SOURCES,
  CORE_GROUNDING_RULES,
  estimateDailyCalories,
  buildNutritionWarnings,
  getNutritionGroundingForPrompt,
};
