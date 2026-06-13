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
- STS photo scan → pre-fills VIN field

What is missing:
- Real VIN lookup provider. Currently mocked: only one hardcoded VIN resolves to a real vehicle.
- VIN format validation (17 chars, alphanumeric, no I/O/Q) before submission
- Low-confidence STS extraction feedback to user

Priority:
P0

---

## STS Onboarding

Status:
PARTIAL

What works:
- Photo upload from camera or gallery
- AI (gpt-4o-mini vision) extracts VIN, brand, model, year, plate, category, confidence
- Extracted VIN pre-fills the VIN field

What is missing:
- After STS scan the VIN still goes through the mocked provider
- No server-side validation that extracted VIN is 17 chars before submitting

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
- **Chat history persisted** in localStorage (last 20 messages)
- **Previous messages sent to API** (last 6 messages injected into OpenAI request)
- AI now remembers conversation context across messages
- Scroll-to-bottom on new messages
- "Clear chat history" option in settings

What is missing:
- No streaming (user waits for full response)
- Keyword guard is Russian-heavy (English questions may be rejected)

Priority:
P1

---

## AI Orchestrator / vehicleBrain

Status:
COMPLETE

What works:
- `computeOrchestratorState` returns `vehicleBrain` — single source of truth for all screens
- 7+ sub-agents: schedule, health, cost, history, prediction, briefing, quick questions
- **Primary action agent**: single most important recommendation with full WHY data
- **Status sentence generator**: AI-style natural language sentence from orchestrator state (no API call)
- **Mileage learning**: derives monthly km from log history (datePerformed pairs), confidence: low/medium/high
- **Time-based scheduling**: `intervalMonths` evaluated in `scheduleAgent` (brake_fluid: 24 months)
- **Ownership insights**: gap analysis, most expensive system, coverage statement
- Health score, urgentActions, upcomingItems, unknownAreas all derived correctly

What is missing:
- No caching or invalidation strategy — vehicleBrain recomputes on every render via `useMemo`
- Time-based interval only works when `datePerformed` is set on a log

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
- **PDF parsing**: removed from UI. File accept is now `image/*` only. Users see a clear message if they somehow pass a PDF.
- No duplicate detection (scanning the same document twice creates duplicate entries)

Priority:
P0 (PDF)

---

## Maintenance Normalization

Status:
COMPLETE

What works:
- `normalizer.js` maps log entries to internal service event IDs via:
  1. `normalizedId` direct lookup (ID_MAP)
  2. Russian-language title pattern matching (TEXT_PATTERNS)
  3. **Note-based compound expansion**: `log.note` is now also parsed against TEXT_PATTERNS
- Compound events: `engine_service` expands to `engine_oil + oil_filter + cabin_filter`
- `front_discs` implies `front_pads`
- **Fixed**: engine_service note "тормозная жидкость" now correctly matches `brake_fluid`

What is missing:
- Pattern matching is Russian-only (English text in documents will not normalize)
- No handling for non-standard service names from third-party documents

Priority:
P2

---

## Vehicle Passport

Status:
COMPLETE

What works:
7 sections now fully implemented:
- **A. Identity**: VIN, brand/model, spec chips, status chips
- **B. Vehicle Health**: System health by category (engine, drivetrain, brakes, fuel, suspension) with status badges
- **C. Predictions**: overdue/soon/upcoming/unknown history predictions
- **D. Unknown Areas**: service items with no history, severity-coded
- **E. AI Recommendations**: topPriorities from analyze-vehicle API with data status indicators
- **F. Service History Coverage**: visual progress bar, coverage %, gap list
- **G. Ownership Insights**: gap statements, most expensive system, coverage summary
- Overview stats: health score (color-coded), log count, total spent (green)
- Cost forecast grid

What is missing:
- No inline editing of vehicle spec
- No VIN-based history report (GIBDD, previous owners)
- No export/share feature

Priority:
P2

---

## Smart Reminders

Status:
COMPLETE

What works:
- `reminders.js` generates reminder objects for: overdue items, critical unknown items, stale mileage
- Reminders stored in localStorage with status (active/dismissed/done)
- **HomeScreen reminder card**: shows most urgent active reminder with dismiss/done actions
- **BottomNav badge**: shows active reminder count on home tab icon
- `dismissReminder` and `doneReminder` wired to HomeScreen buttons
- Reminders regenerated on every schedule change

What is missing:
- Snooze functionality (no "remind me in 1 week" option)
- No scheduling of future date-based reminders
- No push notifications (separate feature)

Priority:
COMPLETE (was P0)

---

## Mileage Prediction / Learning

Status:
COMPLETE

What works:
- `resolveMonthlyKm`: converts owner profile answer to monthly km estimate (declared band)
- **`learnMileagePace`**: derives monthly km from actual log history using datePerformed + mileage pairs
  - Requires 2+ logs with datePerformed
  - Confidence: low (<60 days span), medium (60–180 days), high (180+ days)
  - If medium/high confidence: uses learned value; if low: blends with declared
- Confidence level shown in cost forecast block on HomeScreen
- Pace source (history vs declared) shown when history-derived

What is missing:
- Demo data now has datePerformed but real users who added logs without dates still get declared-only
- No UI prompt to add dates to existing logs

Priority:
COMPLETE (was P1)

---

## Home Screen — Digital Twin Experience

Status:
COMPLETE

What works:
- Vehicle hero section: brand, model, year/engine/transmission/drive chips, mileage inline editor, health pill
- **AI status sentence**: locally generated from orchestrator state (no API call). Dynamic, never generic.
- **Single primary action**: most important recommendation only, with full WHY breakdown table (last km, current km, driven since, interval, overdue by / km left)
- Reminder card: top active reminder with dismiss/done buttons
- Secondary urgents: compact list when multiple items need attention
- Upcoming section: items within next 6 months
- Cost forecast with pace confidence indicator
- Last event card: "Last confirmed event: Oil service at 82,000 km"
- Scan document / add manually actions

What is missing:
- Nothing blocking. Home screen now answers "What should I do right now?"

Priority:
COMPLETE (was P0)

---

## Maintenance Forecasting

Status:
COMPLETE

What works:
- `costAgent` computes 1/6/12-month cost forecasts
- Per-item cost estimates in `COST_ESTIMATES` map
- Overdue items counted in all windows
- Time-based window from (left km) / (monthlyKm)
- **Mileage learning confidence** shown below forecast

What is missing:
- Cost estimates are hardcoded global averages
- Forecast is 0 if monthlyKm = 0 (owner skipped profile and no log history)

Priority:
P1

---

## Service History

Status:
COMPLETE

What works:
- Timeline view sorted by mileage descending
- Each entry: mileage, date, title, note, cost, source badge
- Add via document scan or manual form
- Edit any entry inline (bottom sheet form)
- Delete with confirmation
- Source tagging persisted correctly

What is missing:
- No search or filter
- No grouping by year or service type
- No export (CSV, PDF)

Priority:
P2

---

## PDF Support

Status:
NOT_STARTED (removed from UI)

What works:
- Nothing. File inputs accept `image/*` only.
- Explicit guard in `parseServiceDocument` rejects PDFs with a clear error message.
- The application no longer claims PDF support.

What is missing:
- PDF-to-image conversion (pdf2pic or pdfjs-dist) before vision model

Priority:
P0

---

## Push Notifications

Status:
NOT_STARTED

What works:
- Nothing.

What is missing:
- Service worker registration, web push subscription, permission flow, server-side trigger

Priority:
P1

---

## Marketplace Integration

Status:
NOT_STARTED

Priority:
P2

---

## Service Booking

Status:
NOT_STARTED

Priority:
P2

---

## Multi Vehicle Support

Status:
NOT_STARTED

What works:
- "Change vehicle" clears analysis/profile but not journal. This is not multi-vehicle.

What is missing:
- Vehicle list / garage
- Per-vehicle localStorage namespacing
- Vehicle switcher UI

Priority:
P1
