# Changelog

---

## 2026-06-13

### Changes

- Added project governance files: master spec, product gap analysis, current state, changelog.
- Analyzed full codebase across 19 source files (5 API handlers, 9 UI components, 4 utility modules).

### Files

- `AUTOPULSE_MASTER_SPEC.md` — product mission, vision, principles
- `AUTOPULSE_PRODUCT_GAPS.md` — honest feature-by-feature gap analysis (15 features evaluated)
- `AUTOPULSE_STATE.md` — current build state, known bugs, known limitations, next priorities
- `AUTOPULSE_CHANGELOG.md` — this file

### Impact

No code changes. Documentation only. Establishes shared understanding of product state and priorities.

---

## 2026-06-12 (prior work — reconstructed from git log)

### Changes

- Added AI orchestration layer (`src/utils/orchestrator.js`): 7 sub-agents (schedule, health, cost, history, prediction, briefing, quick questions). All screens now derive state from single orchestrator.
- Added predictive experience features: mileage prediction, local briefing, context-aware quick questions.
- Refactored UI into product screens: HomeScreen, JournalScreen, PassportScreen, AiScreen, MoreScreen.
- Refactored journal flow with bottom-sheet modals, pending document confirmation, source tagging.
- Added owner profile intelligence: 4-question onboarding, profile answers used across orchestrator and AI prompts.
- Added document scanning flow with client-side image compression and AI extraction.
- Added car visual component and premium hero card design.
- Added cost forecasting (1/6/12 months) on HomeScreen and PassportScreen.
- Added vehicle passport screen with system health by category, AI priorities, coverage percentage.
- Added AI mechanic chat with vehicle context, keyword guard, quick question chips.
- Added maintenance normalization utility (`normalizer.js`).
- Added reminders utility (`reminders.js`) — logic complete, UI not yet connected.
- Added API handlers: `ai-mechanic`, `analyze-vehicle`, `create-vehicle-profile`, `parse-sts`, `parse-service-doc`.

### Files

- `src/App.jsx`
- `src/App.css`
- `src/index.css`
- `src/main.jsx`
- `src/components/HomeScreen.jsx`
- `src/components/JournalScreen.jsx`
- `src/components/PassportScreen.jsx`
- `src/components/AiScreen.jsx`
- `src/components/MoreScreen.jsx`
- `src/components/OnboardingProfile.jsx`
- `src/components/BottomNav.jsx`
- `src/components/CarVisual.jsx`
- `src/utils/orchestrator.js`
- `src/utils/predictions.js`
- `src/utils/normalizer.js`
- `src/utils/reminders.js`
- `api/ai-mechanic.js`
- `api/analyze-vehicle.js`
- `api/create-vehicle-profile.js`
- `api/parse-sts.js`
- `api/parse-service-doc.js`

### Impact

Core product loop established: onboard vehicle → scan documents → get AI-driven maintenance decisions. All primary screens functional. Several features partially complete (reminders, PDF, VIN provider, multi-vehicle).
