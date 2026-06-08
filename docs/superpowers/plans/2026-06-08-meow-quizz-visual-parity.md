# Meow Quizz Visual Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the Meow Quizz frontend screens so the quiz, pet profile, edit, delete modal, and recommendation pages match the 22 supplied screenshots.

**Architecture:** Keep the existing React route and API structure, but introduce a shared Meow Quizz visual shell for the screenshot header/background. Rebuild each screen's markup and Tailwind classes around the visual contract while preserving current state transitions and API payload normalization.

**Tech Stack:** React 18, Vite, TailwindCSS, React Router, Zustand, lucide-react, node:test source-contract tests.

---

### Task 1: Shared Visual Shell And Tests

**Files:**
- Modify: `client/src/layouts/MeowQuizzLayout.jsx`
- Modify: `client/src/layouts/MeowQuizzLayout.test.js`
- Modify: `client/src/pages/public/meowQuizz/MeowQuizPage.test.js`

- [ ] Write failing tests that require a shared three-step PawWorld header, no internal quiz progress bar, and a 10-step visual quiz contract.
- [ ] Run `npm run test -w client` and confirm the new assertions fail for the current UI.
- [ ] Implement the shared shell helpers/classes and update the tests to target stable contract strings.
- [ ] Run `npm run test -w client` and confirm the shell tests pass.

### Task 2: Quiz Wizard Visual Rebuild

**Files:**
- Modify: `client/src/pages/public/meowQuizz/meowQuizData.js`
- Modify: `client/src/pages/public/meowQuizz/MeowQuizPage.jsx`

- [ ] Rewrite quiz steps to the 10 visual steps from the screenshots.
- [ ] Replace current quiz header/progress/tape design with the centered card design.
- [ ] Implement screenshot states for text input, sex tabs, select dropdowns, weight stepper, toggle, option cards, and upload dropzone.
- [ ] Preserve draft restore, auth redirect, create-profile submit, and navigation behavior.
- [ ] Run `npm run test -w client`.

### Task 3: Profile List And Edit Screens

**Files:**
- Modify: `client/src/pages/public/meowQuizz/PetProfilesPage.jsx`
- Modify: `client/src/pages/public/meowQuizz/PetProfileEditPage.jsx`

- [ ] Rebuild profile list to match the pet card, add-card, bottom buttons, and delete modal screenshots.
- [ ] Rebuild edit form to match the centered cream page, avatar, field groups, checkbox grid, and fixed bottom action bar.
- [ ] Keep API list/get/update/remove behavior intact.
- [ ] Run `npm run test -w client`.

### Task 4: Recommendation Screen

**Files:**
- Modify: `client/src/pages/public/meowQuizz/RecommendationPage.jsx`

- [ ] Rebuild the recommendation page to match the long-form meal-plan screenshot.
- [ ] Keep recommendation fetch, DB product cart handoff, and fallback navigation behavior intact.
- [ ] Include the public-style footer area shown in the supplied design.
- [ ] Run `npm run test -w client`.

### Task 5: Browser Verification

**Files:**
- Modify only if screenshot review reveals defects.

- [ ] Run `npm run build -w client`.
- [ ] Open `http://localhost:5173/meow-quizz` and capture desktop screenshot.
- [ ] Step through the 10 quiz states and check against the supplied images.
- [ ] Check `/meow-quizz/ho-so`, delete modal, edit page, and recommendation page where data/auth allows.
- [ ] Fix visual/runtime defects and rerun `npm run build -w client`.
