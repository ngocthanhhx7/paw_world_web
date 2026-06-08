# Meow AI Nutrition Grounding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ground Meow recommendation AI and fallback output in the supplied WSAVA, AAFCO, FEDIAF, and NRC nutrition references.

**Architecture:** Add a small backend knowledge module with curated source summaries and helper functions. Inject its compact grounding text into the recommendation prompt and use its calorie/warning helpers in deterministic fallback.

**Tech Stack:** Node.js, node:test, existing Express service modules.

---

### Task 1: Tests First

- [ ] Extend `server/src/services/meowRecommendation.service.test.js` to assert a nutrition knowledge pack exists.
- [ ] Assert prompt includes WSAVA, AAFCO, FEDIAF, NRC, complete-and-balanced, BCS, taurine, water, and veterinary escalation guardrails.
- [ ] Assert fallback warnings include veterinary consultation when health issues are present.
- [ ] Run `npm run test -w server` and confirm the new tests fail.

### Task 2: Knowledge Pack

- [ ] Create `server/src/services/meowNutritionKnowledge.js`.
- [ ] Export source metadata, compact grounding text, calorie estimate helper, and warning helper.
- [ ] Keep content as curated summaries and rules, not copied PDF pages.

### Task 3: Recommendation Integration

- [ ] Import the knowledge helpers into `meowRecommendation.service.js`.
- [ ] Use `estimateDailyCalories()` in deterministic fallback.
- [ ] Add `getNutritionGroundingForPrompt()` to `buildRecommendationPrompt()`.
- [ ] Add `buildNutritionWarnings()` to fallback warnings.
- [ ] Run `npm run test -w server` and `npm run build -w client`.
