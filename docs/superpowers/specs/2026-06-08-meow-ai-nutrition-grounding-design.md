# Meow AI Nutrition Grounding Design

## Context

The Meow recommendation service currently uses a compact AI prompt and deterministic fallback. The user supplied four nutrition references: WSAVA Nutritional Guidelines Vietnamese, AAFCO proposed cat/dog nutrient profiles, FEDIAF Nutritional Guidelines 2025, and NRC Nutrient Requirements of Dogs and Cats. The goal is to make AI recommendations more reasonable and more evidence-grounded without sending full PDFs to the model.

## Goal

Add a curated nutrition knowledge pack that grounds the Meow recommendation prompt and fallback behavior in the supplied references.

## Design

- Create `server/src/services/meowNutritionKnowledge.js`.
- Store concise source metadata and practical guidance, not full PDF text.
- Include grounding from:
  - WSAVA: nutrition assessment as part of routine care, BCS monitoring, pet/diet/environment factors, veterinary referral warnings.
  - AAFCO and FEDIAF: complete-and-balanced adequacy, life stage, product label/claim caution.
  - NRC: resting energy requirement basis and essential cat nutrition themes such as water, protein, fat, taurine, and gradual diet transition.
- Update `buildRecommendationPrompt()` to include a compact `Nutrition grounding` block.
- Update deterministic fallback to use the same calorie basis and warnings.

## Safety Rules

- Do not diagnose disease.
- Do not prescribe treatment diets or medication.
- Do not recommend raw food, bones, or allergen ingredients.
- Suggest veterinary consultation for severe, recurring, urgent, unexplained, or disease-like symptoms.
- Avoid claiming a product treats or cures disease.

## Testing

- Unit tests check the knowledge pack references WSAVA, AAFCO, FEDIAF, and NRC.
- Unit tests check prompt includes the grounding block and safety rules.
- Unit tests check fallback calorie estimates remain positive and warnings include veterinary escalation when profile health issues are present.
