# Admin Analytics 30-Day Backfill Design

## Goal

Preserve all existing analytics records while adding a deterministic, removable 30-day demo dataset that makes the admin dashboard representative of a small startup. The same persisted sessions, page views, and events must feed overview, traffic sources, funnel, AI usage, page analysis, and the generated AI report.

## Current State

The live Atlas baseline measured on 2026-07-14 contains 80 unique visitors, 108 sessions, 511 page views, and 67 events in the previous 30 days. The only event types present are `page_view` and `product_viewed`; AI, checkout, and successful-purchase counts are zero. Sessions exist on only 13 of the 30 days.

The dashboard reads directly from `AnalyticsSession`, `AnalyticsPageView`, and `AnalyticsEvent`. The client already supports `last_30_days`, but its initial and reset presets are `last_7_days`.

## Chosen Approach

Create an independent analytics backfill command that reads the current 30-day baseline, generates only namespaced demo records, and writes them to the existing analytics collections. This is preferred over API/UI overlays because every dashboard analysis and AI report will consume the same records. It is preferred over a separate demo collection because it requires no API-contract or aggregation-layer changes.

The script must not be added to the existing general database seed, because that seed deletes product, category, and cart data.

## Files and Responsibilities

- `server/src/seeds/analytics30DayDataset.js`: pure deterministic dataset generator and invariant checks.
- `server/src/seeds/analytics30DayDataset.test.js`: generator, chronology, identity, namespace, coverage, and determinism tests.
- `server/src/seeds/seedAnalytics30Days.js`: Atlas connection, baseline query, dry-run/apply/cleanup orchestration, and post-write summary.
- `server/package.json`: expose the analytics seed command.
- `package.json`: expose the workspace-level analytics seed command.
- `client/src/pages/admin/AdminAnalyticsPage.jsx`: change only initial and reset presets to `last_30_days`.
- `client/src/pages/admin/AdminAnalyticsPage.test.js`: protect both 30-day preset locations without changing presentation.

## CLI Contract

The command is dry-run by default and accepts exactly one mutation flag:

- No flag or `--dry-run`: connect read-only, report the baseline and proposed additions, then exit.
- `--apply`: replace only records in the `demo30_v1_` namespace, insert the deterministic dataset, and print the resulting 30-day summary.
- `--cleanup`: delete only records in the `demo30_v1_` namespace and print deletion counts.

The namespace is encoded in `sessionId`, `anonymousId`, `eventId`, and event `dedupeKey`. Cleanup discovers page views through their namespaced `sessionId`. Re-running `--apply` produces the same records and totals rather than multiplying data.

## Target Dataset

The final 30-day window should be in these startup-scale ranges, including the real baseline:

- 300-340 unique visitors.
- 440-480 sessions.
- 1,500-1,700 page views.
- 75-90 AI users and 150-190 AI invocations.
- 30-36 checkout users.
- 14-18 successful buyers.
- 9-12 buyers who used AI before purchase.
- Overall purchase conversion between 4% and 5.5%.
- Bounce rate between 40% and 48%.

Targets are lower bounds for top-up, not caps on real traffic. If real data already exceeds a target, the generator must never delete or reduce it.

## Distribution Rules

- Include sessions on all 30 Vietnam-calendar days, with deterministic weekday/weekend variation and a modest upward trend toward the present.
- Reuse public page paths observed in real data and known application routes. Do not generate traffic for `/admin/*` routes.
- Keep source and device distributions anchored to the real baseline, with small smoothing so Google, Facebook, Zalo, and mobile traffic remain visible.
- Use only existing event names and types from `eventValidation.js`.
- Use only the real AI feature names `pawworld_genius_chatbot` and `meow_quizz_recommendation`.
- Represent engaged visitors with plausible sequences such as page view, product view, CTA, add to cart, AI interaction, checkout, and purchase. Not every visitor reaches every step.
- Every page view and event references an existing generated session and repeats the same identity fields.
- All timestamps satisfy `startedAt <= event/pageView createdAt <= lastActivityAt <= endedAt` when `endedAt` is present.
- For AI-assisted buyers, the first AI event occurs before `purchase_success`.
- Successful buyers are a subset of checkout users; checkout users and AI users are subsets of unique visitors.

## Data Safety and Error Handling

- Existing non-namespaced records are never updated or deleted.
- `--apply` builds and validates the full dataset before deleting the previous namespace.
- Writes use deterministic identifiers and unordered bulk operations.
- Any validation or MongoDB write failure returns a non-zero exit code and prints the failed phase.
- The script disconnects from MongoDB in `finally`.
- No URI, credentials, user metadata, or raw real-event payloads are logged.

## UI Scope

Only the initial preset and reset preset change from `last_7_days` to `last_30_days`. Existing filters, endpoint calls, layouts, cards, charts, tables, typography, spacing, responsive behavior, and error/loading states remain untouched.

## Verification

Development follows red-green-refactor:

1. Add failing generator tests for 30-day coverage, deterministic IDs, namespace isolation, referential integrity, chronological ordering, target ranges, and repeatability.
2. Implement the smallest pure generator that passes.
3. Add failing client assertions for initial/reset 30-day presets, then make the two-line preset change.
4. Run the server tests and client tests.
5. Run the client production build.
6. Run the seed command in dry-run mode and inspect proposed totals.
7. Run `--apply` against the configured Atlas database.
8. Query the same 30-day aggregations used by overview, traffic sources, funnel, AI usage, and pages. Confirm target ranges, all 30 dates, monotonic funnel counts, AI-before-purchase chronology, and no duplicate namespace IDs.
9. Re-run `--apply` and prove all namespace counts and final metrics remain unchanged.

## Deployment and Rollback

No application deployment is required for the Atlas dataset itself. The UI preset change ships through the normal client deployment. Rollback of demo data is `--cleanup`; rollback of the UI change is reverting the two preset values.

## Implementation Prompt

```text
In paw_world_web, implement a deterministic 30-day analytics backfill at the persisted data layer. Do not fake values in React or API responses. Preserve every existing analytics record; create only namespaced demo30_v1_ sessions, page views, and events. Base distribution and scale on the current 30-day baseline, populate every Vietnam-calendar day, and maintain identity, session, timestamp, funnel, AI-before-purchase, and referential-integrity invariants. Support dry-run by default plus --apply and --cleanup. Re-running --apply must not change counts. Use only existing event names and the AI features pawworld_genius_chatbot and meow_quizz_recommendation. Change only the AdminAnalyticsPage initial/reset preset to last_30_days; do not alter layout, CSS, endpoint contracts, or unrelated behavior. Use TDD, then run all server tests, all client tests, the client production build, a dry-run, Atlas apply, post-write aggregation checks, and a second apply proving idempotency.
```
