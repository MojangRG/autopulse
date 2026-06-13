# Changelog

---

## 2026-06-13 — Digital Twin Foundation

### Phase

DIGITAL TWIN FOUNDATION — complete implementation pass.

### Changes

**Home Screen rebuilt (Item 1)**
- Replaced metric-heavy dashboard with vehicle-centric experience
- AI status sentence generated locally from orchestrator state (never generic)
- Single primary action card with full WHY breakdown: last service km, current km, distance driven since, interval, overdue by
- Reminder card on home (top active reminder with dismiss/done)
- Secondary urgent items in compact list
- Last confirmed event card ("Last confirmed event: Oil service at 82,000 km")
- Removed redundant scan button from within primary action, kept actions section

**Smart Reminders activated (Item 2)**
- `reminders.js` fully integrated for the first time
- Reminders generated on every orchestrator schedule change
- HomeScreen reminder card with dismiss/done handlers
- BottomNav badge shows active reminder count on home tab
- Reminder state persisted in localStorage, merges with existing on each generation

**vehicleBrain (Item 3)**
- `computeOrchestratorState` now returns `vehicleBrain` object
- All screens consume vehicleBrain props
- Added: `statusSentence`, `primaryAction`, `mileagePaceData`, `insights`
- `primaryActionAgent` determines single most important thing with WHY data
- `ownershipInsights` produces gap statements, most expensive system, coverage summary

**Prediction Engine V1 (Item 4)**
- `predictionAgent` already existed; now surfaced on HomeScreen via primary action
- Time-based predictions via `intervalMonths` in `scheduleAgent`
- Primary action type: overdue / upcoming / scan (with full context)

**Mileage Learning (Item 5)**
- `learnMileagePace(data, declaredMonthlyKm)` — derives monthly km from log history
- Uses `datePerformed` + `mileage` pairs, requires 2+ logs with dates
- Confidence: low (<60 days), medium (60–180 days), high (>180 days)
- Default data updated with realistic `datePerformed` dates
- Confidence indicator shown in cost forecast block

**AI Mechanic Memory (Item 6)**
- Chat persisted in localStorage (key: `autopulse-chat`, last 20 messages)
- Previous messages (last 6) sent to OpenAI API as conversation history
- AI now maintains context across messages in a session
- "Clear chat history" option added in More → Settings
- Scroll-to-bottom on new messages

**Passport Evolution (Item 7)**
- Transformed into 7-section Vehicle Passport:
  A. Identity, B. System Health, C. Predictions, D. Unknown Areas,
  E. AI Recommendations, F. Service History Coverage, G. Ownership Insights
- Coverage section: visual progress bar, coverage %, gap list
- Ownership Insights: gap statements ("Нет записей о замене: тормозная жидкость"), most expensive system, coverage summary
- Health score now color-coded in stats row (green/amber/red)
- Removed system icons (cleaner layout)
- gap-badge now severity-coded (high=red, medium=amber)

**Document Scan Intelligence (Item 8)**
- `normalizer.js` now parses `log.note` field against all TEXT_PATTERNS
- Fixed: engine_service log with note "тормозная жидкость" now marks `brake_fluid` as serviced
- Compound note expansion works for all supported service types

**PDF Truth Fix (Item 9)**
- Removed `.pdf` from all file input `accept` attributes (HomeScreen + JournalScreen)
- Added explicit PDF guard in `parseServiceDocument` with clear user message
- App no longer claims PDF support

**Premium Design Pass (Item 10)**
- Full `App.css` rewrite: 439 lines
- Darker card backgrounds (#0f1218 instead of #10131a)
- Borders replaced with rgba opacity (rgba(255,255,255,0.06))
- More whitespace throughout (padding 20px vs 16px in key areas)
- Stronger typographic hierarchy
- New classes: `.primary-action-card`, `.why-row`, `.why-key`, `.why-val`, `.last-event-card`, `.urgent-secondary-list`, `.coverage-card`, `.insight-list`, `.nav-badge`, `.pace-source`
- Nav badge for reminder count
- Topbar simplified (no border)

**Product Honesty (Item 11)**
- Primary action card now shows: Last service km · Current km · Distance driven · Interval · Overdue by
- Stale mileage reminder message quantifies estimated km missed
- Gap badges on passport are severity-coded (red/amber)

**Build (Item 13)**
- `npm run build` — PASS. Zero errors. 257KB JS / 25KB CSS (gzipped: 78KB / 5KB)

### Files Changed

- `src/utils/orchestrator.js` — rewritten
- `src/utils/normalizer.js` — updated
- `src/utils/predictions.js` — no changes
- `src/utils/reminders.js` — no changes (logic was already correct)
- `src/components/HomeScreen.jsx` — complete rewrite
- `src/components/BottomNav.jsx` — reminder badge added
- `src/components/PassportScreen.jsx` — 7-section evolution
- `src/components/AiScreen.jsx` — scroll-to-bottom added
- `src/components/JournalScreen.jsx` — PDF removed from accept
- `src/components/MoreScreen.jsx` — clear chat history option
- `src/App.jsx` — reminders integration, chat history, vehicleBrain props, PDF guard
- `src/App.css` — full premium design rewrite
- `api/ai-mechanic.js` — chat history support

### Completion Assessment

| Feature | Before | After |
|---|---|---|
| Home Screen experience | PARTIAL (dashboard) | COMPLETE (digital twin) |
| Smart Reminders | NOT_STARTED (UI) | COMPLETE |
| vehicleBrain | PARTIAL | COMPLETE |
| Status Sentence | NOT_STARTED | COMPLETE |
| Primary Action + WHY | NOT_STARTED | COMPLETE |
| Mileage Learning | PARTIAL | COMPLETE |
| AI Chat Memory | NOT_STARTED | COMPLETE |
| Passport (7 sections) | PARTIAL (5 sections) | COMPLETE |
| Note compound matching | NOT_STARTED | COMPLETE |
| PDF Honesty | BUG (accepted then rejected) | FIXED |
| Time-based scheduling | NOT_STARTED | PARTIAL (brake_fluid) |
| Premium Design | PARTIAL | COMPLETE |
| Build | PASS | PASS |

### Remaining Blockers to True Digital Twin

1. **Real VIN data** — without a real VIN provider, AutoPulse cannot onboard any real user's vehicle. The vehicle profile is AI-generated from a single VIN string, not real factory data.
2. **PDF parsing** — documents are still image-only. Most service station receipts are PDFs.
3. **Multi-vehicle** — the product assumes exactly one vehicle. Real users own multiple cars or switch cars.
4. **Push notifications** — "proactive guidance" requires push. Currently the app only acts when opened.
5. **Time-based intervals broadly** — only brake_fluid uses `intervalMonths`. Several other service items (coolant, spark plugs for some engines) need time-based intervals from the AI service profile.

---

## 2026-06-13 (earlier)

### Changes

- Added project governance files: master spec, product gap analysis, current state, changelog.
- Analyzed full codebase across 19 source files.

---

## 2026-06-12 (prior work — reconstructed from git log)

### Changes

- Added AI orchestration layer (`orchestrator.js`): 7 sub-agents. All screens derive state from single orchestrator.
- Added predictive experience features: mileage prediction, local briefing, context-aware quick questions.
- Refactored UI into product screens: HomeScreen, JournalScreen, PassportScreen, AiScreen, MoreScreen.
- Refactored journal flow with bottom-sheet modals, pending document confirmation, source tagging.
- Added owner profile intelligence: 4-question onboarding.
- Added document scanning flow with client-side image compression.
- Added car visual component and premium hero card design.
- Added cost forecasting (1/6/12 months).
- Added vehicle passport screen with system health by category.
- Added AI mechanic chat with vehicle context, keyword guard, quick question chips.
- Added maintenance normalization utility.
- Added reminders utility (logic complete, UI not connected at that time).
- Added API handlers: ai-mechanic, analyze-vehicle, create-vehicle-profile, parse-sts, parse-service-doc.
