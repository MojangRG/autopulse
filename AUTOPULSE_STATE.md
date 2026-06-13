# Current State

Date:
2026-06-13

---

## Current Version Summary

React 19 + Vite 8 single-page app. No backend server — API routes served by Vite's dev proxy or a serverless-compatible handler pattern (formidable + OpenAI SDK). All persistence is localStorage. AI via OpenAI-compatible proxy (aitunnel.ru) using gpt-4o-mini.

---

## Files Added

(This session — Digital Twin Foundation phase)

None added. All changes were to existing files.

---

## Files Modified

- `src/utils/orchestrator.js` — Added mileage learning, status sentence, primary action agent, vehicleBrain export, time-based scheduling (intervalMonths), ownership insights
- `src/utils/normalizer.js` — Added note-based compound matching (log.note parsed for service keywords)
- `src/components/HomeScreen.jsx` — Complete rewrite: vehicle hero, AI status sentence, single primary action with WHY breakdown, reminder card, last event card, secondary urgents
- `src/components/BottomNav.jsx` — Added reminder badge on home tab
- `src/components/PassportScreen.jsx` — Evolved to Vehicle Passport: 7 sections (Identity, Health, Predictions, Unknown Areas, AI Recommendations, Coverage, Ownership Insights)
- `src/components/AiScreen.jsx` — Added scroll-to-bottom on new messages; chat history now persisted (App.jsx handles storage)
- `src/components/MoreScreen.jsx` — Added "Clear chat history" option in settings
- `src/components/JournalScreen.jsx` — Removed `.pdf` from file input accept attribute (PDF fix)
- `src/App.jsx` — Integrated reminders.js; chat history persistence (localStorage, last 20 messages); vehicleBrain props passed to all screens; reminder handlers; PDF guard in parseServiceDocument; `mileagePaceData` passed to screens; `clearChatHistory` function
- `src/App.css` — Premium design pass: more whitespace, stronger hierarchy, fewer borders, premium typography; new classes for primary-action-card, why-row, reminder-card, coverage-card, insight-list, urgent-secondary-list, nav-badge
- `api/ai-mechanic.js` — Chat history support: accepts `history[]` array, injects previous messages into OpenAI request (last 6 messages); keyword guard expanded

---

## Features Completed

### Newly completed this session

- **Reminders UI** — `reminders.js` is now fully integrated. Reminders are generated on every orchestrator run, displayed on HomeScreen as cards (with dismiss/done actions), and counted in the BottomNav badge on the home tab.
- **Mileage Learning** — Monthly km now derived from actual log history (datePerformed + mileage pairs). Confidence level shown (low/medium/high). Declared band used as fallback. Shown in cost forecast block.
- **AI Mechanic Memory** — Chat history persisted in localStorage (key: `autopulse-chat`). Previous messages sent to API (last 6 messages). AI context includes prior conversation.
- **Primary Action with WHY** — Single most important action on HomeScreen now includes full reasoning: last service km, current km, distance driven since, recommended interval, overdue by amount.
- **Vehicle Status Sentence** — Locally generated AI-style status sentence on HomeScreen (no API call). Dynamic based on orchestrator state.
- **Time-based scheduling** — `intervalMonths` now computed in `scheduleAgent`. Brake fluid (24 months) uses time-based interval.
- **Note-based compound expansion** — `normalizer.js` now parses `log.note` field for service keywords. Engine service note "тормозная жидкость" now correctly marks `brake_fluid` as serviced.
- **PDF Honesty** — File inputs changed from `accept="image/*,.pdf"` to `accept="image/*"`. Explicit guard in `parseServiceDocument` rejects PDFs with a clear user message. The app no longer claims PDF support.
- **Passport evolution** — 7 sections: Identity, System Health, Predictions, Unknown Areas, AI Recommendations, Coverage bar (with %), Ownership Insights.
- **Premium design** — Full CSS rewrite: darker cards (#0f1218), removed visible borders (using rgba opacity), stronger whitespace, better hierarchy, badge on nav, WHY breakdown table.

### Previously completed (maintained)

- VIN onboarding UI flow, STS photo scan, manual VIN entry, manual form
- Owner profile questionnaire (4 questions)
- Service history journal (timeline, add/edit/delete, mileage-sorted)
- Document scanning for images (AI extraction, review/confirm modal, client-side compression)
- Maintenance normalization (ID_MAP + Russian title + note pattern matching)
- AI orchestrator (7 sub-agents, single source of truth → vehicleBrain)
- Health score (severity-weighted, 18–100 range)
- Service schedule with overdue/soon/ok states
- Cost forecasting (1/6/12 months)
- Vehicle passport screen (7 sections)
- AI mechanic chat (with history, vehicle context injection, keyword guard, quick questions)
- AI vehicle analysis API
- AI service profile creation API
- Local briefing (instant, zero-API)
- Quick questions (context-aware)
- Car visual component (brand/model SVG silhouette)
- MoreScreen: schedule view, stats, settings (change vehicle, clear chat, reset data)

---

## Features Partially Completed

- **Mileage learning**: Derived from `datePerformed` + `mileage` pairs. Requires at least 2 logs with `datePerformed` filled in. Demo data now has `datePerformed` on all 3 logs. Confidence: low/medium/high based on span.
- **Time-based scheduling**: `intervalMonths` evaluated in `scheduleAgent`. Only one rule uses it currently (`brake_fluid`, 24 months). Time-based items need a `datePerformed` on matching log to compute deadline.
- **Passport** — Read-only. No inline editing of vehicle spec.

---

## Known Bugs

- VIN lookup is mocked: only `JF1SK7AC2MG117103` (Subaru Forester SK 2020) resolves. All other VINs return 404.
- If the user scans the same document twice, duplicate entries are added with no warning.
- Chat history grows without limit in `chat` state; persisted as last 20 messages. Long sessions may cause stale history.

---

## Known Limitations

- All data is in `localStorage`. No sync, no backup, no cross-device access.
- Single vehicle only. "Change vehicle" deletes analysis/profile but not journal data.
- Russian language only (UI strings, AI prompts, pattern matching).
- No authentication. No user accounts.
- AI provider is aitunnel.ru proxy, not official OpenAI API.
- No test suite.
- No error boundary or offline handling.
- PDF scanning not supported. Users are shown a clear message.

---

## What Should Be Built Next

1. **Real VIN provider** — integrate NHTSA or a Russian VIN decoder API. P0.
2. **PDF parsing** — implement PDF-to-image conversion (pdf2pic or pdfjs-dist) before vision model. P0.
3. **Multi-vehicle support** — namespace localStorage keys per vehicle, add garage UI. P1.
4. **Push notifications** — service worker + Web Push API. P1.
5. **Streaming AI responses** — streaming for AI mechanic chat. P1.
6. **Duplicate document detection** — hash or date+mileage comparison before adding. P1.
7. **VIN validation** — 17-char format check before submission. P2.
