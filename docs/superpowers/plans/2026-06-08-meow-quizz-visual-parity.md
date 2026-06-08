# Meow Quizz Visual Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the Meow Quizz frontend screens so the quiz, pet profile, edit, delete modal, and recommendation pages match the 22 supplied screenshots.

**Architecture:** Keep the existing React route and API structure, but introduce a shared Meow Quizz visual shell for the screenshot header/background. Rebuild each screen's markup and Tailwind classes around the visual contract while preserving current state transitions and API payload normalization.

**Tech Stack:** React 18, Vite, TailwindCSS, React Router, Zustand, lucide-react, node:test source-contract tests.

---

### Task 1: Shared Visual Shell And Tests

- [ ] Write failing tests that require a shared three-step PawWorld header, no internal quiz progress bar, and a 10-step visual quiz contract.
- [ ] Implement the shared shell helpers/classes and update the tests to target stable contract strings.
- [ ] Run `npm run test -w client`.

### Task 2: Quiz Wizard Visual Rebuild

- [ ] Rewrite quiz steps to the 10 visual steps from the screenshots.
- [ ] Replace current quiz header/progress/tape design with the centered card design.
- [ ] Preserve draft restore, auth redirect, create-profile submit, and navigation behavior.

### Task 3: Profile And Recommendation Screens

- [ ] Rebuild profile list, delete modal, edit form, and recommendation page to match screenshots.
- [ ] Run `npm run build -w client` and browser-check `/meow-quizz`.
