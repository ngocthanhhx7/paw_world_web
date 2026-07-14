# Admin Analytics 30-Day Backfill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a deterministic, removable Atlas backfill that preserves real analytics and makes the admin dashboard's default 30-day view show coherent startup-scale traffic, engagement, AI, and purchase activity.

**Architecture:** A pure CommonJS generator builds namespaced `AnalyticsSession`, `AnalyticsPageView`, and `AnalyticsEvent` documents from a live baseline without touching MongoDB. A separate CLI validates first, then performs dry-run, namespaced apply, or namespaced cleanup; the React page changes only its initial/reset preset.

**Tech Stack:** Node.js 20 test runner, CommonJS, Mongoose 8, MongoDB Atlas, React 18, Vite 5.

---

### Task 1: Deterministic 30-Day Dataset Generator

**Files:**
- Create: `server/src/seeds/analytics30DayDataset.test.js`
- Create: `server/src/seeds/analytics30DayDataset.js`

- [ ] **Step 1: Write the failing generator contract tests**

Create `server/src/seeds/analytics30DayDataset.test.js`:

```js
const assert = require('node:assert/strict');
const test = require('node:test');

const {
  NAMESPACE,
  TARGETS,
  buildAnalytics30DayDataset,
  validateAnalyticsDataset,
} = require('./analytics30DayDataset');

const NOW = new Date('2026-07-14T06:00:00.000Z');
const BASELINE = {
  uniqueVisitors: 80,
  sessions: 108,
  pageViews: 511,
  aiUsers: 0,
  aiInvocations: 0,
  checkoutUsers: 0,
  buyers: 0,
  aiBuyers: 0,
  bouncedSessions: 60,
  sources: [
    { value: 'Direct', count: 83 },
    { value: 'Google', count: 11 },
    { value: 'Facebook', count: 9 },
    { value: 'Zalo', count: 2 },
  ],
  devices: [
    { value: 'desktop', count: 61 },
    { value: 'mobile', count: 44 },
    { value: 'tablet', count: 3 },
  ],
  publicPages: ['/', '/meow-quizz', '/meow-quizz/ho-so', '/danh-muc', '/gio-hang', '/thanh-toan'],
};

test('builds a deterministic namespaced dataset in the approved target ranges', () => {
  const first = buildAnalytics30DayDataset({ now: NOW, baseline: BASELINE });
  const second = buildAnalytics30DayDataset({ now: NOW, baseline: BASELINE });

  assert.deepEqual(first, second);
  assert.equal(validateAnalyticsDataset(first), true);
  assert.ok(first.sessions.every((item) => item.sessionId.startsWith(NAMESPACE)));
  assert.ok(first.pageViews.every((item) => item.sessionId.startsWith(NAMESPACE)));
  assert.ok(first.events.every((item) => item.eventId.startsWith(NAMESPACE)));
  assert.ok(first.summary.uniqueVisitors >= TARGETS.uniqueVisitors.min);
  assert.ok(first.summary.uniqueVisitors <= TARGETS.uniqueVisitors.max);
  assert.ok(first.summary.sessions >= TARGETS.sessions.min);
  assert.ok(first.summary.sessions <= TARGETS.sessions.max);
  assert.ok(first.summary.pageViews >= TARGETS.pageViews.min);
  assert.ok(first.summary.pageViews <= TARGETS.pageViews.max);
  assert.ok(first.summary.aiUsers >= TARGETS.aiUsers.min);
  assert.ok(first.summary.aiUsers <= TARGETS.aiUsers.max);
  assert.ok(first.summary.aiInvocations >= TARGETS.aiInvocations.min);
  assert.ok(first.summary.aiInvocations <= TARGETS.aiInvocations.max);
  assert.ok(first.summary.checkoutUsers >= TARGETS.checkoutUsers.min);
  assert.ok(first.summary.checkoutUsers <= TARGETS.checkoutUsers.max);
  assert.ok(first.summary.buyers >= TARGETS.buyers.min);
  assert.ok(first.summary.buyers <= TARGETS.buyers.max);
  assert.ok(first.summary.aiBuyers >= TARGETS.aiBuyers.min);
  assert.ok(first.summary.aiBuyers <= TARGETS.aiBuyers.max);
  assert.ok(first.summary.purchaseConversionRate >= 4);
  assert.ok(first.summary.purchaseConversionRate <= 5.5);
  assert.ok(first.summary.bounceRate >= 40);
  assert.ok(first.summary.bounceRate <= 48);
});

test('covers 30 Vietnam days and keeps event/page-view references and chronology valid', () => {
  const dataset = buildAnalytics30DayDataset({ now: NOW, baseline: BASELINE });
  const sessionById = new Map(dataset.sessions.map((item) => [item.sessionId, item]));
  const days = new Set(dataset.sessions.map((item) => new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(item.startedAt)));

  assert.equal(days.size, 30);
  for (const item of [...dataset.pageViews, ...dataset.events]) {
    const session = sessionById.get(item.sessionId);
    assert.ok(session, `missing session ${item.sessionId}`);
    assert.equal(item.anonymousId, session.anonymousId);
    assert.ok(item.createdAt >= session.startedAt);
    assert.ok(item.createdAt <= session.lastActivityAt);
    assert.doesNotMatch(item.pagePath, /^\/admin(?:\/|$)/);
  }

  const eventsByIdentity = new Map();
  for (const item of dataset.events) {
    const items = eventsByIdentity.get(item.anonymousId) || [];
    items.push(item);
    eventsByIdentity.set(item.anonymousId, items);
  }
  for (const items of eventsByIdentity.values()) {
    const firstAi = items.filter((item) => item.eventType === 'ai').sort((a, b) => a.createdAt - b.createdAt)[0];
    const purchase = items.find((item) => item.eventName === 'purchase_success');
    if (firstAi && purchase) assert.ok(firstAi.createdAt < purchase.createdAt);
  }
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `node --test server/src/seeds/analytics30DayDataset.test.js`

Expected: FAIL with `Cannot find module './analytics30DayDataset'`.

- [ ] **Step 3: Implement the pure generator**

Create `server/src/seeds/analytics30DayDataset.js` with these exact exports and constants:

```js
const { EVENT_TYPE_BY_NAME } = require('../services/analytics/eventValidation');
const { getVietnamParts, startOfVietnamDay } = require('../services/analytics/dateRange');

const NAMESPACE = 'demo30_v1_';
const AI_FEATURES = ['pawworld_genius_chatbot', 'meow_quizz_recommendation'];
const TARGETS = Object.freeze({
  uniqueVisitors: { min: 300, max: 340, value: 320 },
  sessions: { min: 440, max: 480, value: 460 },
  pageViews: { min: 1500, max: 1700, value: 1600 },
  aiUsers: { min: 75, max: 90, value: 84 },
  aiInvocations: { min: 150, max: 190, value: 170 },
  checkoutUsers: { min: 30, max: 36, value: 34 },
  buyers: { min: 14, max: 18, value: 16 },
  aiBuyers: { min: 9, max: 12, value: 11 },
  bounceRate: 44,
});
```

Implement `buildAnalytics30DayDataset({ now, baseline })` as a composition of focused helpers in the same file:

```js
function needed(target, current = 0) {
  return Math.max(0, target - Number(current || 0));
}

function createRandom(seed = 20260714) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function distribute(total, buckets, minimum = 0) {
  const result = Array.from({ length: buckets }, () => minimum);
  for (let index = minimum * buckets; index < total; index += 1) result[index % buckets] += 1;
  return result;
}

function identityOf(index) {
  return `${NAMESPACE}anon_${String(index + 1).padStart(4, '0')}`;
}
```

The remaining helpers must implement these concrete rules:

- Calculate additions from `TARGETS.*.value - baseline.*`; increase generated visitors when required so all generated AI/checkout/buyer identities are valid subsets.
- Generate at least one session on each of the 30 Vietnam dates returned from `startOfVietnamDay(getVietnamParts(now) + day offset)`; apply a deterministic hour between 08:00 and 22:00 Vietnam time.
- Assign visitors round-robin to sessions, with source/device weighted by the baseline arrays after adding one smoothing unit for `Google`, `Facebook`, `Zalo`, and `mobile`.
- Allocate exactly the required generated page-view count: bounced demo sessions receive one view; other demo sessions receive at least two; distribute remaining views round-robin.
- Use only `baseline.publicPages` after filtering `/admin/*`; fall back to `['/', '/meow-quizz', '/meow-quizz/ho-so', '/danh-muc', '/gio-hang', '/thanh-toan']`.
- Mirror every generated page view with a `page_view` event using `EVENT_TYPE_BY_NAME.page_view`.
- Add deterministic `product_viewed`, `cta_click`, and `add_to_cart` events to engaged identities.
- Spread the required AI invocation count across the required AI identities. Each invocation emits `ai_started`, `ai_submitted`, then `ai_completed` for 92% or `ai_failed` for 8%, with `metadata.aiFeatureName` alternating between the two approved features and `durationMs` between 900 and 5200.
- Select checkout identities as a subset of generated visitors; select buyers as a subset of checkout identities; select the configured number of AI buyers from the intersection with AI identities. Emit `checkout_started` before `purchase_success`.
- Set each session's `lastActivityAt` and `endedAt` after its final generated page view/event.
- Return `{ sessions, pageViews, events, summary }`, where `summary` contains final baseline-plus-demo counts and calculated purchase/bounce rates.

Implement `validateAnalyticsDataset(dataset)` to throw on duplicate IDs, missing session references, identity mismatches, timestamps outside session bounds, disallowed event names, `/admin/*` paths, missing 30-day coverage, non-monotonic funnel subsets, or AI purchases without prior AI. Return `true` after all checks.

Export exactly:

```js
module.exports = {
  AI_FEATURES,
  NAMESPACE,
  TARGETS,
  buildAnalytics30DayDataset,
  validateAnalyticsDataset,
};
```

Also export `getVietnamParts` from `server/src/services/analytics/dateRange.js` so the generator uses the production timezone implementation rather than duplicating it.

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run: `node --test server/src/seeds/analytics30DayDataset.test.js`

Expected: 2 tests pass, 0 fail.

- [ ] **Step 5: Run the date-range regression tests**

Run: `node --test server/src/services/analytics/dateRange.test.js`

Expected: all date-range tests pass.

- [ ] **Step 6: Commit the generator slice**

```bash
git add server/src/seeds/analytics30DayDataset.js server/src/seeds/analytics30DayDataset.test.js server/src/services/analytics/dateRange.js
git commit -m "feat: generate deterministic 30-day analytics data"
```

### Task 2: Atlas Dry-Run, Apply, and Cleanup CLI

**Files:**
- Create: `server/src/seeds/seedAnalytics30Days.js`
- Modify: `server/package.json:7-12`
- Modify: `package.json:10-17`

- [ ] **Step 1: Add the server and workspace commands**

Add to `server/package.json` scripts:

```json
"seed:analytics": "node src/seeds/seedAnalytics30Days.js"
```

Add to the root `package.json` scripts:

```json
"seed:analytics": "npm run seed:analytics -w server --"
```

- [ ] **Step 2: Implement baseline collection and mode validation**

Create `server/src/seeds/seedAnalytics30Days.js`. It must:

```js
require('../config/env');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const AnalyticsPageView = require('../models/AnalyticsPageView');
const AnalyticsSession = require('../models/AnalyticsSession');
const controller = require('../controllers/admin/analytics.admin.controller');
const { parseDateRange } = require('../services/analytics/dateRange');
const { NAMESPACE, buildAnalytics30DayDataset, validateAnalyticsDataset } = require('./analytics30DayDataset');

function readMode(argv) {
  const flags = argv.filter((value) => ['--dry-run', '--apply', '--cleanup'].includes(value));
  if (flags.length > 1) throw new Error('Choose only one of --dry-run, --apply, or --cleanup');
  return flags[0] || '--dry-run';
}
```

`collectBaseline(now)` must query the production models over `parseDateRange({ preset: 'last_30_days' }, now)` and return the exact baseline shape used in Task 1. Identity counts use the controller convention: `user:<userId>` when present, otherwise `anon:<anonymousId>`. AI invocation count is the number of `ai_completed` plus `ai_failed` events. Public pages exclude `/admin/*`.

- [ ] **Step 3: Implement namespace-only mutation functions**

Use an escaped prefix regex and delete in dependency order:

```js
function namespaceRegex() {
  return new RegExp(`^${NAMESPACE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
}

async function cleanupNamespace() {
  const prefix = namespaceRegex();
  const [events, pageViews, sessions] = await Promise.all([
    AnalyticsEvent.deleteMany({ eventId: prefix }),
    AnalyticsPageView.deleteMany({ sessionId: prefix }),
    AnalyticsSession.deleteMany({ sessionId: prefix }),
  ]);
  return { events: events.deletedCount, pageViews: pageViews.deletedCount, sessions: sessions.deletedCount };
}

async function insertDataset(dataset) {
  if (dataset.sessions.length) await AnalyticsSession.insertMany(dataset.sessions, { ordered: false });
  if (dataset.pageViews.length) await AnalyticsPageView.insertMany(dataset.pageViews, { ordered: false });
  if (dataset.events.length) await AnalyticsEvent.insertMany(dataset.events, { ordered: false });
}
```

For `--apply`, collect the non-demo baseline, build and validate the entire dataset, call `cleanupNamespace()`, then `insertDataset(dataset)`. If insertion fails after cleanup, set a non-zero exit code and print only the failed phase and error message.

- [ ] **Step 4: Print post-write dashboard evidence**

Use `controller._private.buildOverviewData({ query: { preset: 'last_30_days' } })` plus a Promise wrapper for `trafficSources`, `funnel`, `aiUsage`, and `pages`. Print one JSON object containing mode, baseline, generated counts, overview KPIs, source rows, funnel steps, AI rows, top pages, and namespace counts. Do not print the Mongo URI or real payloads.

Always disconnect in `finally`:

```js
(async () => {
  let phase = 'connect';
  try {
    const mode = readMode(process.argv.slice(2));
    await connectDB();
    phase = mode;
    await run(mode);
  } catch (error) {
    console.error(`Analytics seed failed during ${phase}: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
})();
```

- [ ] **Step 5: Verify dry-run cannot mutate Atlas**

Run the command twice and compare namespace counts:

```bash
npm run seed:analytics -- --dry-run
npm run seed:analytics -- --dry-run
```

Expected: both exit 0; `mode` is `--dry-run`; proposed counts match; stored namespace counts remain unchanged.

- [ ] **Step 6: Commit the CLI slice**

```bash
git add package.json server/package.json server/src/seeds/seedAnalytics30Days.js
git commit -m "feat: add safe analytics Atlas backfill command"
```

### Task 3: Default the Dashboard to 30 Days

**Files:**
- Modify: `client/src/pages/admin/AdminAnalyticsPage.test.js:28`
- Modify: `client/src/pages/admin/AdminAnalyticsPage.jsx:148,276`

- [ ] **Step 1: Add the failing preset regression test**

Append to `AdminAnalyticsPage.test.js`:

```js
test('AdminAnalyticsPage initializes and resets filters to the 30-day preset', () => {
  const matches = source.match(/preset:\s*'last_30_days'/g) || [];
  assert.equal(matches.length, 2);
  assert.doesNotMatch(source, /preset:\s*'last_7_days'/);
});
```

- [ ] **Step 2: Run the focused client test and confirm RED**

Run: `node --test client/src/pages/admin/AdminAnalyticsPage.test.js`

Expected: FAIL because the two active preset values are still `last_7_days`.

- [ ] **Step 3: Make the two-line UI change**

In `AdminAnalyticsPage.jsx`, change both state/reset objects to:

```js
preset: 'last_30_days',
```

Do not change `RANGE_OPTIONS`; its `last_7_days` option remains available.

- [ ] **Step 4: Run the focused client test and confirm GREEN**

Run: `node --test client/src/pages/admin/AdminAnalyticsPage.test.js`

Expected: 3 tests pass, 0 fail.

- [ ] **Step 5: Commit the UI slice**

```bash
git add client/src/pages/admin/AdminAnalyticsPage.jsx client/src/pages/admin/AdminAnalyticsPage.test.js
git commit -m "feat: default admin analytics to 30 days"
```

### Task 4: Full Verification and Atlas Apply

**Files:**
- Verify only; no additional source files.

- [ ] **Step 1: Run all server tests**

Run: `npm test -w server`

Expected: exit 0 with the original 92 tests plus the new generator tests passing.

- [ ] **Step 2: Run all client tests**

Run: `npm test -w client`

Expected: exit 0 with the original 46 tests plus the new preset test passing.

- [ ] **Step 3: Run the production client build**

Run: `npm run build:client`

Expected: exit 0 and Vite emits a production bundle without compilation errors.

- [ ] **Step 4: Capture the final dry-run proposal**

Run: `npm run seed:analytics -- --dry-run`

Expected: exit 0; generated and final projected metrics are within the design ranges; no generated path begins `/admin`.

- [ ] **Step 5: Apply the validated dataset to Atlas**

Run: `npm run seed:analytics -- --apply`

Expected: exit 0; the output includes all 30 traffic dates, 300-340 unique visitors, 440-480 sessions, 1,500-1,700 page views, 75-90 AI users, 30-36 checkout users, 14-18 buyers, and 9-12 AI-before-purchase buyers.

- [ ] **Step 6: Prove idempotency with a second apply**

Run: `npm run seed:analytics -- --apply`

Expected: exit 0; namespace counts and all overview/funnel/AI totals exactly match Step 5.

- [ ] **Step 7: Audit the final diff and requirements**

Run:

```bash
git status --short
git diff --check HEAD~3..HEAD
git log -4 --oneline
```

Expected: no uncommitted source changes, no whitespace errors, and separate commits for the generator, CLI, and UI preset after the design commit.
