# Product Gaps

Format:

## Feature

Status:
NOT_STARTED / PARTIAL / COMPLETE

What works:

What is missing:

Priority:
P0 / P1 / P2

---

## VIN Onboarding

Status:
PARTIAL

What works:
- UI flow: enter VIN + mileage, submit
- API endpoint `/api/create-vehicle-profile` calls AI to generate vehicle service profile
- Manual entry fallback (brand/model/year/engine/transmission/drive)
- Demo fill button for Subaru Forester

What is missing:
- Real VIN lookup provider. Currently mocked: only one hardcoded VIN (`JF1SK7AC2MG117103`) resolves to a real vehicle. Any other VIN returns 404.
- Integration with a real VIN database (NHTSA, autoteka.ru, avtokod.ru, or third-party decoder)
- VIN validation (format check before submission)

Priority:
P0

---

## STS Onboarding

Status:
PARTIAL

What works:
- Photo upload from camera or gallery
- AI (gpt-4o-mini vision) extracts: VIN, brand, model, year, plate, category, confidence
- Extracted VIN pre-fills the VIN field for the user to confirm

What is missing:
- After STS scan the VIN still goes through the same mocked provider — only the demo VIN produces a real vehicle profile
- No server-side validation that extracted VIN is 17 chars before submitting
- No feedback to user about extraction confidence ("low" confidence silently proceeds)

Priority:
P0 (blocked by VIN provider gap)

---

## AI Mechanic

Status:
COMPLETE

What works:
- Chat interface with vehicle context injected into every request
- Context includes: vehicle spec, current mileage, service logs (up to 15), AI analysis priorities, owner profile, local orchestrator summary
- Keyword guard: rejects non-automotive questions
- Quick question chips generated from orchestrator state
- Local briefing shown before first message
- Sends orchestrator health score and urgent/unknown areas to AI

What is missing:
- No conversation history sent to API — each message is stateless (no multi-turn memory)
- No streaming (user waits for full response)
- Keyword guard is Russian-only and will fail on English or mixed-language questions

Priority:
P1

---

## AI Orchestrator

Status:
COMPLETE

What works:
- `computeOrchestratorState` is single source of truth for all screens
- 7 sub-agents: schedule, health score, cost forecast, history, prediction, briefing, quick questions
- Health score computed from overdue/soon/unknown items with severity weighting
- urgentActions, upcomingItems, unknownAreas all derived from schedule
- Local briefing generated instantly with no API call
- Quick questions personalized based on schedule state and owner priority

What is missing:
- Service rules fall back to hardcoded DEFAULT_RULES when no AI-generated profile exists
- No caching or invalidation strategy — orchestrator recomputes on every render via `useMemo`
- No time-based interval awareness (intervalMonths exists in schema but is not used in scheduleAgent)

Priority:
P1

---

## Document Scanning

Status:
PARTIAL

What works:
- Image upload (camera or file picker)
- AI parses service documents: extracts work items, mileage, date, cost, source text
- Confidence level per extracted item (high/medium/low)
- Review/confirm modal before adding to journal
- User can edit, reorder, or remove extracted items before saving
- Client-side image compression before upload (max 1400px, 72% quality)
- Mileage auto-update when document mileage > current mileage

What is missing:
- PDF parsing: UI accepts `.pdf` files but API handler rejects them with an error. PDF support is not implemented.
- No receipt/OCR fallback for handwritten documents
- No duplicate detection (scanning the same document twice creates duplicate entries)

Priority:
P0

---

## Maintenance Normalization

Status:
COMPLETE

What works:
- `normalizer.js` maps log entries to internal service event IDs via two mechanisms:
  1. `normalizedId` direct lookup (ID_MAP)
  2. Russian-language title pattern matching (regex)
- Compound events: `engine_service` expands to `engine_oil + oil_filter + cabin_filter`
- `front_discs` implies `front_pads` (disc replacement includes pads)
- `logMatchesRule` correctly handles compound matching

What is missing:
- Pattern matching is Russian-only — English text in documents will not normalize correctly
- No handling for non-standard service names from third-party documents
- `brake_fluid` is not included in `engine_service` compound expansion in `normalizer.js` despite being listed in `App.jsx` defaultData demo log note

Priority:
P2

---

## Vehicle Passport

Status:
COMPLETE

What works:
- Identity card: VIN, brand/model, spec chips, history coverage %, overdue/soon counters
- System health by category: engine, drivetrain, brakes, fuel system, suspension
- Overview stats: health score, log count, total spent
- Cost forecast grid (1 month / 6 months / year)
- AI recommendations (topPriorities from analyze-vehicle API)
- Prediction list (overdue, soon, upcoming, unknown history)
- Unknown areas (service items with no history)
- Vehicle spec detail list

What is missing:
- Passport is read-only — no inline editing of vehicle spec
- No VIN-based history report (GIBDD check, previous owners, accident history)
- No export/share feature for the passport

Priority:
P2

---

## Smart Reminders

Status:
PARTIAL

What works:
- `reminders.js` generates reminder objects for: overdue items, critical unknown items, stale mileage
- Reminders stored in localStorage with status (active/dismissed/done)
- `dismissReminder` and `doneReminder` functions exist
- Stale mileage reminder triggers when estimated km since last entry ≥ 5000

What is missing:
- No UI anywhere in the app displays reminders. The module is not imported or called from any screen or App.jsx.
- No notification badge, no reminder panel, no HomeScreen reminder card
- No scheduling of future reminders (e.g., "remind me at 90,000 km")

Priority:
P0

---

## Mileage Prediction

Status:
PARTIAL

What works:
- `resolveMonthlyKm` converts owner profile answer to monthly km estimate
- Owner profile asks "how many km per month?" with 4 bands: <500, 500–1500, 1500–3000, >3000
- Monthly km used for: estimatedMonths on upcoming items, cost forecast, stale mileage reminder, briefing

What is missing:
- No ML or pattern-based prediction. Estimate is a flat band from a single user answer.
- No derivation from actual log history (date/mileage pairs could triangulate real pace)
- If owner skips profile, monthlyKm = 0 and all time-based features are disabled (cost forecast shows "—", no estimatedMonths)

Priority:
P1

---

## Maintenance Forecasting

Status:
COMPLETE

What works:
- `costAgent` in orchestrator computes 1-month, 6-month, 12-month cost forecasts
- Per-item cost estimates defined in `COST_ESTIMATES` map (Russian mid-range market)
- Overdue items counted in all forecast windows
- Items within window calculated from (left km) / (monthly km)
- Displayed on HomeScreen and PassportScreen

What is missing:
- Cost estimates are hardcoded global averages, not vehicle-specific or region-specific
- No time-based maintenance intervals (intervalMonths not used in scheduling)
- Forecast is zero if monthlyKm = 0 (owner skipped profile or profile not completed)

Priority:
P1

---

## Service History

Status:
COMPLETE

What works:
- Timeline view sorted by mileage descending
- Each entry: mileage, date, title, note, cost, source badge (scanned/manual)
- Add via document scan or manual form
- Edit any entry inline (bottom sheet form)
- Delete with confirmation
- Source tagging persisted correctly

What is missing:
- No search or filter in journal
- No grouping by year or service type
- No export (CSV, PDF)
- Entries with `datePerformed` and `dateAdded` — no clear distinction shown to user

Priority:
P2

---

## Push Notifications

Status:
NOT_STARTED

What works:
- Nothing. No service worker, no web push API integration, no notification permission flow.

What is missing:
- Everything: service worker registration, push subscription, notification permission request, server-side push trigger, notification display

Priority:
P1

---

## Marketplace Integration

Status:
NOT_STARTED

What works:
- Nothing.

What is missing:
- Parts catalog integration
- Price comparison for recommended parts
- Links to purchase parts or book services

Priority:
P2

---

## Service Booking

Status:
NOT_STARTED

What works:
- Nothing.

What is missing:
- Service center directory
- Booking calendar
- Appointment confirmation flow
- Integration with any booking API

Priority:
P2

---

## Multi Vehicle Support

Status:
NOT_STARTED

What works:
- "Change vehicle" button clears all vehicle data and restarts onboarding. This is not multi-vehicle — it is single-vehicle replacement.

What is missing:
- Vehicle list / garage
- Per-vehicle data namespacing in localStorage
- Vehicle switcher in UI
- Independent history, schedule, and analysis per vehicle

Priority:
P1
