# Risk Agent — Agentic UX Spec v2.0
## Development Specification | March 2026

---

## Overview

This document defines the UI/UX rework and feature expansion for the Risk Agent prototype. It maps each workflow phase to its existing page, specifies the precise AI vs. human responsibility split at every stage, introduces AI Assessor Personas, KRIs across all phases, and a new Reporting surface.

The core principle: the agent handles all analytical, drafting, and orchestration work. The human's role is expert judgment at defined approval gates, with the option to override or refine at every step.

**Five workflow phases map to the existing navigation:**

| Phase | Page |
|---|---|
| Identification | Risk Discovery |
| Assessment | Assessments |
| Mitigation | Treatment & Monitoring → Treatment tab |
| Monitoring | Treatment & Monitoring → Monitoring tab |
| Reporting | History (renamed to Reporting) |

The Risk Register and Dashboard sit across all phases as persistent reference surfaces.

---

## Responsibility Legend

Every UI section is labelled with its actor:

- `AI` — agent acts autonomously, output surfaced for review
- `USER` — human-initiated action required
- `APPROVAL` — explicit human approve/reject gate; the agent does not proceed without it
- `MANAGER ONLY` — Risk Manager role gate; not all users see this

---

## Overarching UX Principles

**Agentic-first** means the default state of every page assumes the agent has already done the analytical work. The UI leads with the agent's output and the action it requires — not with empty tables waiting for user input.

Three rules applied consistently across all pages:

1. **Agent output is primary content.** Every page leads with what the agent has surfaced, not with a data table the user must parse.
2. **Action is always visible.** Every piece of agent output has an approve/reject/override action in direct proximity. No additional navigation required to act.
3. **Dense but scannable.** Expert users need full context — not simplified cards stripped of scoring detail, but also not 50-row undifferentiated tables. The right unit is a structured item with all operationally relevant fields visible, grouped by agent-determined priority.

**Visual language (applied globally):**

- Agent-sourced items: `3px solid #3b82f6` left border + small `AGENT` chip.
- User-sourced items: no special border.
- Approval actions use consistent labels everywhere: `Approve`, `Override`, `Reject`. No synonyms.
- Reduce chart count on every page. One chart per section maximum unless the page is explicitly an analytics surface (Risk Register is the exception).

---

## New Data Models

### `types/kri.ts` (new file)

KRIs are quantitative metrics providing early warning of increasing risk exposure. They feed assessment prioritisation, inherent attribute suggestion, and mitigation action tracking across all phases.

```typescript
export type KRIStatus = 'green' | 'amber' | 'red';
export type KRITrend = 'improving' | 'stable' | 'worsening';

export interface KRIThreshold {
  greenMax: number;
  amberMax: number;
  unit: string;             // e.g. 'count', '%', 'days', 'ratio'
  direction: 'lower_is_better' | 'higher_is_better';
}

export interface KRIDataPoint {
  value: number;
  recordedAt: Date;
}

export interface KeyRiskIndicator {
  id: string;
  name: string;
  description: string;
  category: 'operational' | 'compliance' | 'financial' | 'cyber' | 'strategic';
  currentValue: number;
  threshold: KRIThreshold;
  status: KRIStatus;           // derived: compare currentValue to threshold
  trend: KRITrend;
  history: KRIDataPoint[];     // last 6 data points for sparkline
  linkedRiskIds: string[];
  owner: string;
  lastUpdatedAt: Date;
  updatedByAgentAt?: Date;
  agentNote?: string;          // agent's reasoning for the last value change
  agentGenerated: boolean;
}
```

**Mock data — `data/mock/kris.ts` (8 KRIs):**

| ID | Name | Category | Current | Thresholds | Status |
|---|---|---|---|---|---|
| kri-001 | Unpatched critical CVEs | cyber | 4 | ≤0 green / ≤3 amber | red |
| kri-002 | Failed auth attempts/week | cyber | 18 | ≤10 green / ≤25 amber | amber |
| kri-003 | Regulatory findings unresolved >30d | compliance | 12% | ≤0% green / ≤10% amber | red |
| kri-004 | Open high-severity audit findings | compliance | 2 | 0 green / ≤2 amber | amber |
| kri-005 | Staff attrition — risk function | operational | 8% | ≤5% green / ≤10% amber | amber |
| kri-006 | Days since last DR test | operational | 214 | ≤90d green / ≤180d amber | red |
| kri-007 | FX hedge ratio | financial | 74% | ≥90% green / ≥80% amber | red |
| kri-008 | Vendor risk assessments overdue | operational | 3 | 0 green / ≤2 amber | red |

Each KRI's `history` contains 6 monthly data points for sparkline rendering. `linkedRiskIds` connect to existing seeded mock risks. Store via `lib/kri-store.ts` following the `lib/risk-store.ts` pattern.

---

### `types/assessor-persona.ts` (new file)

The most distinctive new concept. The agent creates synthetic assessor personas grounded in real org context (org chart, BU data, job descriptions). They participate in assessments alongside human assessors, each providing a scored opinion. The human reviews the spread of opinions and approves or overrides the synthesised result.

```typescript
export type PersonaSource = 'org_chart' | 'job_description' | 'bu_data' | 'manual';
export type AssessorType = 'human' | 'ai_persona';

export interface AIAssessorPersona {
  id: string;
  name: string;              // e.g. "CISO Perspective Persona"
  role: string;              // e.g. "Chief Information Security Officer"
  department: string;
  perspective: string;       // one-paragraph description of this persona's viewpoint
  biases: string[];          // e.g. ["conservative on likelihood", "technical focus"]
  sourceContext: PersonaSource[];
  createdByAgent: boolean;
  customisedByUser: boolean;
  active: boolean;           // whether applied to current assessment cycle
  createdAt: Date;
}

export interface AssessorOpinion {
  assessorId: string;
  assessorType: AssessorType;
  personaId?: string;        // if AI assessor
  likelihood: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  rationale: string;
  confidence: 'high' | 'medium' | 'low';
  submittedAt: Date;
}

export interface SynthesisedAssessment {
  riskId: string;
  opinions: AssessorOpinion[];
  synthesisedLikelihood: number;  // weighted aggregate
  synthesisedImpact: number;
  outlierFlags: string[];         // assessor IDs that diverged significantly
  anomalyNotes: string[];
  benchmarkComparison?: string;
  confidenceLevel: 'high' | 'medium' | 'low';
  whatChangedSinceLastTime: string;
  whyItChanged: string;
  uncertainties: string[];
  createdAt: Date;
}
```

**Mock data — `data/mock/personas.ts` (4 AI personas):**

| ID | Name | Role | Department | Key biases |
|---|---|---|---|---|
| persona-001 | CISO Perspective | CISO | Technology | conservative on likelihood, technical focus, cyber-weighted |
| persona-002 | CFO Perspective | CFO | Finance | financial impact focus, risk-transfer preference |
| persona-003 | COO Perspective | COO | Operations | operational continuity focus, process-oriented |
| persona-004 | Head of Compliance | Chief Compliance Officer | Legal & Compliance | regulatory sensitivity, conservative on impact |

**Mock data — `data/mock/synthesis.ts` (3 synthesised assessments):** One per high-priority risk in the assessment queue, each containing 4 opinions (2 AI personas + 1 human assessor + 1 agent baseline), outlier flags, confidence level, and a "what changed" narrative.

---

### `types/survey.ts` (new file)

```typescript
export interface IdentificationSurvey {
  id: string;
  title: string;
  targetRecipients: string[];
  questions: string[];
  scheduledAt: Date;
  sentAt?: Date;
  responses: SurveyResponse[];
  agentScheduled: boolean;
  status: 'draft' | 'sent' | 'collecting' | 'closed';
}

export interface SurveyResponse {
  respondentId: string;
  respondentName: string;
  answers: Record<string, string>;
  identifiedRisks: string[];
  submittedAt: Date;
}
```

---

## Phase 1: Identification → Risk Discovery Page

### AI `[AI]`
- Ingests uploaded documents and auto-classifies by category (reports, register, org chart, policies)
- Contextually analyses content: detects changes in business needs, regulation, org structure, control test results
- Suggests risks with: title, description, initial L/I, treatment direction, owner suggestion (from org chart + job descriptions)
- Builds the risk object and provides context to downstream agents
- Checks existing register for duplicates; proposes merge/update vs. new
- Suggests inherent attributes: pre-fills L/I based on KRIs, control assessment results, external data
- Based on schedule, proposes identification surveys to send to relevant staff
- Monitors external sources for triggering conditions

### Human `[APPROVAL]`
- Uploads internal documents (or configures integration)
- Provides/approves external source list (news, 10-K, regulatory feeds)
- Reviews and approves/rejects each risk suggestion individually — or batch approves
- Refines via manual input or triggers regeneration per risk
- Validates risk relationships
- Approves/rejects proposed identification surveys before they are sent

### UX Changes

**Analysis progress step labels (copy change only):**

| Current | New |
|---|---|
| `analyzing_documents` | `Source ingestion` |
| `researching_external` | `External horizon scan` |
| `generating_risks` | `Risk extraction` |
| `deduplicating` | `Register deduplication` |
| `ready_for_review` | `Ready for practitioner review` |

**Review table — default columns:**
`Source type` · `Risk title` · `Category` · `Inherent L × I` · `Confidence` · `Duplicate flag` · `Suggested owner` · `Status`

- **Source type column:** Icon per `DataSource.type` (document / competitor / 10k_filing / news / trend). Tooltip shows source name.
- **Confidence column:** 3-level chip (High / Medium / Low). ≥2 high-relevance sources = High; ≥1 high or ≥2 medium = Medium; else Low.
- **Duplicate flag column:** If agent matched to an existing register entry, show `DUPLICATE` chip with tooltip listing matched risk ID. Row action for duplicate rows: `Merge` instead of `Approve`.

**Row expansion:** Clicking a row expands:
- Agent's full reasoning (2–4 sentences)
- Source evidence list (`DataSource[]` as compact chips with external links)
- Suggested inherent attributes with evidence: *"L:4 — two prior incidents in 18 months, no MFA enforcement. KRI-001 currently RED."*
- Relationship suggestions: linked risks, linked controls

**Batch approve button** in toolbar: `Approve all (N)` — applies `status: 'approved'` to all pending rows. Confirmation snackbar. Primary agentic affordance on this page.

**Surveys section** (new — collapsible panel below the review table): Agent-proposed surveys, each as a card:
- Title, target recipients, scheduled date, question count
- Actions: `Approve & send` | `Edit` | `Discard`
- Status chips for sent surveys: `Sent` / `N responses`

**External intelligence:** Move from expandable panel to right-side `Sources` drawer (toolbar button). Competitor, news, and regulatory signals as compact cards: source badge, title, date, relevance chip, external link.

---

## Phase 2: Assessment → Assessments Page

The most complex phase. The agent runs full assessment orchestration; the human applies professional judgment at the synthesis review gate.

### AI `[AI]`
- Prioritises which risks to assess based on: risk appetite/tolerance, regulatory changes, recent events, KRI trends, time since last assessment
- Drafts assessments: pre-fills L/I for each risk using control assessment results, KRIs, external data, open issues, risk events, previous assessment results
- Recommends human assessors based on BU data and org chart
- **Creates AI Assessor Personas**: synthetic assessors grounded in org context; each has a defined perspective, known biases, and data source context
- Orchestrates: assigns assessors (human + AI), sends tasks, chases contributors, auto-follows up with risk/control owners
- Synthesises: aggregates scores across assessors, normalises inputs, flags outliers, benchmarks against external data, creates a single coherent assessment summary
- Records what changed since last assessment and why

### Human `[APPROVAL]`
- Confirms assessment priority order (or defers/reorders)
- Reviews and accepts/edits assessment draft; adjusts assumptions
- Reviews suggested human assessor list — accepts, replaces, or adds
- Reviews and fine-tunes AI Assessor Personas before applying to cycle `[MANAGER ONLY]`
- Risk owners: request additional agent follow-ups
- Human assessors: accept or overwrite submitted assessment data
- Final gate: approves/overwrites synthesised assessment rating and summary
- Requests re-assessment if not satisfied

### UX Changes

#### Tab 1: Assessment Queue (rename from "Assessment Suggestions")

**Coverage metrics row (single compact line):**
```
Coverage: 62%  ████████░░░░  ·  4 high-priority gaps  ·  2 overdue  ·  3 awaiting synthesis
```

**Priority queue** (replaces grouped cards + grouping toggle): A ranked list ordered by agent priority. Each item is a structured row card:

```
┌──────────────────────────────────────────────────────────────────────────┐
│  #1  CYBER  ·  CR-014  Cloud Infrastructure Exposure   [AGENT DRAFTED]   │
│                                                                          │
│  Priority reason: KRI-001 RED · DORA Art. 9 in scope · 90d unassessed  │
│  Inherent: L:4 × I:5  ·  Agent draft ready  ·  Owner: J. Chen          │
│                                                                          │
│  [Review draft]     [Approve draft]     [Defer]                        │
└──────────────────────────────────────────────────────────────────────────┘
```

`[Review draft]` opens the Assessment Detail Drawer (see below).
`[Approve draft]` approves without opening the drawer.
`[Defer]` removes from this cycle with an optional reason text input.

**Smart recommendations** stay above the queue. Add `KRI linkage` sub-line per recommendation (hardcoded per item): *"↳ KRI: Unpatched CVEs — currently RED."*

#### Assessment Detail Drawer

Three sections:

**Section 1 — Pre-filled assessment**
Agent-drafted L/I with evidence chain per field:
*"Likelihood: 4 — based on 2 incidents in 18mo, KRI-001 RED, no compensating control."*
User can edit inline. `Adjust assumptions` text input allows the user to add context for agent to factor in.

**Section 2 — Assessor opinions**

Table of every assessor's submitted opinion:

```
ASSESSOR                    TYPE        L    I    CONFIDENCE   RATIONALE
────────────────────────────────────────────────────────────────────────
J. Chen (CISO Persona)      AI          4    5    High         [expand]
M. Torres (Head of Ops)     Human       3    4    Medium       [expand]
CFO Perspective Persona     AI          4    5    High         [expand]
COO Perspective Persona     AI          5    4    Medium       [expand]
────────────────────────────────────────────────────────────────────────
Synthesised result          —           4.1  4.8  High         [expand]
```

- Outlier rows: amber left border
- Synthesised result row: blue left border, visually distinguished
- **Spread indicator:** Small SVG dot plot showing all assessors' L and I scores on a 1–5 axis. Visual consensus at a glance. No Recharts needed — plain SVG.
- `What changed since last assessment`: one agent-generated paragraph (hardcoded mock)
- `Anomaly flags` (if any): inline warning chips
- `Confidence level chip`: High / Medium / Low

**Section 3 — Actions**
```
[Approve synthesised result]    [Override rating]    [Request re-assessment]
```

#### Tab 2: AI Assessor Personas `[MANAGER ONLY]` (new tab)

Labelled with a `MANAGER ONLY` chip in the tab header.

**Header:**
```
AI Assessors  ·  4 active  ·  Last refreshed by agent: 2d ago    [Run agent: refresh personas]
```

`[Run agent: refresh personas]` — simulates re-reading org chart data; brief loading state then updates persona cards.

**Persona cards — 2-column grid:**

```
┌──────────────────────────────────────────────────────────┐
│  [AI]  CISO Perspective Persona              [ACTIVE]    │
│                                                          │
│  Role: Chief Information Security Officer               │
│  Department: Technology                                  │
│                                                          │
│  Perspective:                                            │
│  "Assesses risks through the lens of technical          │
│   vulnerability and cyber threat intelligence.          │
│   Tends to rate cyber likelihood conservatively."        │
│                                                          │
│  Known biases:                                           │
│  [conservative on likelihood] [technical focus]         │
│  [cyber-weighted]                                        │
│                                                          │
│  Source context: [Org chart] [Job description]          │
│                                                          │
│  [Edit persona]    [Deactivate]    [Apply to cycle]      │
└──────────────────────────────────────────────────────────┘
```

`[Edit persona]` — inline edit form. Editable: name, role, perspective (freetext), biases (tag input). This is the fine-tuning affordance.
`[Apply to cycle]` — adds persona as an assessor to the current open assessment cycle.
`[+ Add persona manually]` — button at top-right.

#### Tab 3: Existing Assessments (minor change)

Add `KRI linkage count` chip to each assessment group card. Chip colour = worst KRI status in the group. Tooltip lists KRI names and values.

---

## Phase 3: Mitigation → Treatment & Monitoring, Treatment Tab

### AI `[AI]`
- Recommends treatment strategy per risk: reduce / avoid / transfer / accept
- Suggests mitigation plan (text narrative) and recommends specific controls to address gaps
- Generates net-new controls where no existing control covers the gap
- After approval: creates issues, assigns owners, proposes KRI threshold updates

### Human `[APPROVAL]`
- Reviews list of proposed agent actions before execution
- Approves or rejects the mitigation plan and strategy
- Approves or rejects each suggested/generated control
- Accepts or rejects post-approval actions (issue creation, owner assignments, KRI threshold changes)

### UX Changes

**Charts (above tabs):** Reduce to two:
1. Inherent vs. residual by category (grouped bar) — keep
2. 6-month residual risk trend line — keep
3. Control effectiveness bar — move inside Controls tab
4. Treatment strategy effectiveness bar — move inside Treatment tab

**Treatment pipeline — three columns by appetite status:**

| OUTSIDE TOLERANCE | WITHIN TOLERANCE | ACCEPTED / TRANSFERRED |

Each treatment card:
- Risk ID, strategy badge, inherent → residual delta, control count, appetite status icon
- KRI signal if linked: `↳ KRI: FX hedge 74% [RED]`
- Agent note on expected residual post-implementation

**Agent action preview panel** (new — shown after a mitigation plan is approved):

```
┌──────────────────────────────────────────────────────────────────────┐
│  AGENT: Proposed actions for CR-014 (mitigation plan accepted)       │
│                                                                      │
│  ✦  Create issue: "Deploy MFA on admin endpoints"  →  J. Chen       │
│  ✦  Link control: Access Control Policy (existing)                  │
│  ✦  Update KRI-001 threshold: amber ≤3 → ≤2                        │
│  ✦  Set residual target: L:2 × I:4 post-implementation              │
│                                                                      │
│  [Accept all]    [Review individually]    [Cancel]                   │
└──────────────────────────────────────────────────────────────────────┘
```

Appears as a `Paper` below the treatment card after plan approval, before the agent commits changes.

---

## Phase 4: Monitoring → Treatment & Monitoring, Monitoring Tab

### AI `[AI]`
- Continuously monitors: failed control tests, overdue assessments, regulation changes, KRI threshold breaches
- Schedules reassessments when trigger conditions are met
- Updates KRI values when new data is ingested
- Flags anomalies and trends

### Human `[APPROVAL]`
- Reviews AI-scheduled reassessment triggers — validates whether to start a new assessment cycle or dismiss
- Acknowledges resolved alerts

### UX Changes

**KRI Dashboard** (new — top of Monitoring tab, above existing visualisations):

Summary row:
```
KRIs  ·  4 RED  ·  3 AMBER  ·  1 GREEN  ·  [Add KRI]  [Run agent KRI review]
```

`[Run agent KRI review]` — simulates agent recalculating KRIs; updates 1–2 values with a toast notification.

**KRI cards — 4-column grid:**

```
┌─────────────────────────────────────────┐
│  CYBER                      ● RED       │
│                                         │
│  Unpatched Critical CVEs                │
│                                         │
│  4        [●●●●●●░░░] ← threshold       │
│  count    ≤3 amber / 0 green            │
│                                         │
│  Trend: ↑ worsening  [sparkline]        │
│  Agent note: "3 new CVEs from ingested  │
│  report 2d ago."                        │
│  Owner: J. Chen  ·  Updated: 2d ago     │
│                                         │
│  Linked: [CR-014] [CR-022]              │
└─────────────────────────────────────────┘
```

Card anatomy:
- Category chip + RAG status dot/label
- KRI name
- Current value + inline progress bar (green/amber/red segments showing threshold zones)
- Trend arrow + label + 6-point sparkline (`recharts` `<LineChart>` at 100×30px)
- Agent note (one sentence, hardcoded mock per KRI)
- Owner, last updated
- Linked risk ID chips (max 3, then `+N more`)

**Alert triage table** (below KRI grid):

Add `AGENT_REASSESSMENT` as a distinct alert type:
```
AGENT_REASSESSMENT  CR-014  90d unassessed + KRI RED → reassessment recommended  —  1d ago  [Start assessment]  [Dismiss]
```

`[Start assessment]` routes to Assessments page with that risk pre-queued at position #1.

**Existing charts:** Keep scatter plot and 6-month trend (remove the duplicate — it's already above the tabs). Move treatment effectiveness and category appetite charts into a collapsible `Portfolio analysis` section at the bottom.

---

## Phase 5: Reporting → History Page (renamed)

Rename sidebar item `History` → `Reporting`. Fully implement the page.

### AI `[AI]`
- Generates narrative summaries: what happened, why it happened, what decisions were taken
- Produces QoQ, YoY, and trend-based reports
- Structures report by: portfolio summary → category drill-down → key decisions → KRI evolution

### Human `[USER]`
- Triggers report generation (selects type and time range)
- Reviews and exports

### UX Changes

**Report generator (top of page):**
```
Generate report:  [Executive summary ▾]  [Last quarter ▾]    [Run agent]
```

Three report types: `Executive summary` / `Detailed` / `Board pack`.
Time ranges: `Last quarter` / `Last year` / `Custom range`.

`[Run agent]` — 3–4 second `LinearProgress` simulation, then renders report below.

**Generated report sections:**
1. **What happened** — narrative paragraph (hardcoded mock)
2. **Why it happened** — narrative paragraph
3. **Decisions taken** — bullet list of approved/rejected agent tasks from the period
4. **KRI evolution** — compact table: KRI name, start value, end value, trend arrow, status change
5. **Risk portfolio delta** — risks added / closed / escalated this period
6. **Recommendations for next quarter** — bullet list

Actions: `[Export PDF]` (mock download) and `[Regenerate]`.

**Report history** (below generator): Table of previously generated reports — type, period, generated by, date, `[View]`.

---

## Dashboard Changes

### Remove
- AI chat input and prompt chips
- Four-column quick actions panel
- Three ActionCards at bottom

### Keep
- 4 KPI stat cards (unchanged)

### Add: KRI Status Strip

Immediately below KPI cards. A single horizontal row of RAG-coloured chips — one per KRI, sorted red → amber → green:

```
KRIs  |  [● Unpatched CVEs  4  RED]  [● Regulatory findings  12%  RED]  [● DR Test  214d  RED]  [○ FX hedge  74%  RED]  [○ Auth attempts  18  AMBER]  ...  [View all →]
```

Each chip: dot, KRI name (truncated), current value. Clicking a chip routes to the Monitoring tab KRI section. `[View all →]` same destination. New component: `KRIStatusStrip`.

### Add: Agent Queue Preview Panel

Replaces the quick actions grid. Two columns:

**Left (60%) — Pending agent tasks (5 most recent `awaiting_approval`):**
```
[ASSESS]         CR-014  Cloud Infrastructure Exposure    2h ago    [Approve]  [Review →]
[IDENTIFY]       Batch upload — 14 risks extracted        1d ago    [Approve]  [Review →]
[SUGGEST_CTRL]   FR-003  FX Concentration Risk            5h ago    [Approve]  [Review →]
```

`[Approve]` — inline approval, removes from list, confirmation snackbar.
`[Review →]` — routes to relevant page.
`[View all pending →]` link at bottom.

**Right (40%) — Agent activity feed (last 7 days, max 8 entries):**
Reverse-chronological. Per entry: task type badge, one-line description, outcome chip, relative timestamp. Read-only. `[View full history →]` routes to Reporting page.

---

## Risk Register Changes (minor)

**Add column: KRI signals** (off by default in column visibility toggle):
For each risk row, if any KRI is linked: `● N` chip coloured by worst KRI status. Tooltip lists KRI names and values.

**Add to toolbar:** `Agent: Identify new risks` button alongside `Add risk manually`. Routes to Risk Discovery. Makes the agent action discoverable from the register.

---

## Sidebar Changes

| Current | New | Notes |
|---|---|---|
| Dashboard | Dashboard | Unchanged |
| Risk Discovery | Risk Discovery | Unchanged |
| Assessments | Assessments | AI Personas tab labelled `MANAGER ONLY` |
| Treatment & Monitoring | Treatment & Monitoring | Unchanged |
| Risk Register | Risk Register | Unchanged |
| History | Reporting | Renamed + fully implemented |
| Settings | Settings | Unchanged |

---

## New Components

| Component | Page | Description |
|---|---|---|
| `KRIStatusStrip` | Dashboard | Horizontal RAG chip strip |
| `AgentQueuePreview` | Dashboard | Pending tasks + activity feed |
| `AssessorOpinionsTable` | Assessments drawer | Multi-assessor opinions + synthesised result row |
| `OpinionSpreadPlot` | Assessments drawer | SVG dot plot: L/I distribution across assessors |
| `PersonaCard` | Assessments → AI Personas tab | Persona card with edit/deactivate/apply actions |
| `PersonaEditForm` | Assessments → AI Personas tab | Inline fine-tuning form |
| `AgentActionPreview` | Treatment tab | Pre-execution action list with accept/reject |
| `SurveyCard` | Risk Discovery | Agent-proposed survey card |
| `KRIDashboard` | Monitoring tab | Grid of KRI cards with summary row |
| `KRICard` | Monitoring tab | Individual KRI: sparkline, agent note, linked risks |
| `KRIDrawer` | Monitoring tab | Add/edit KRI form drawer |
| `IntelligenceSidebar` | Risk Discovery | Right-side collapsible source signals drawer |
| `ReportGenerator` | Reporting | Type/range selector + run agent trigger |
| `ReportView` | Reporting | Structured generated report with sections |

---

## New / Updated Type Files

| File | Status |
|---|---|
| `types/kri.ts` | New |
| `types/assessor-persona.ts` | New |
| `types/survey.ts` | New |
| `lib/kri-store.ts` | New — `getKRIs`, `addKRI`, `updateKRI`, `getKRIsByRiskId` |
| `lib/persona-store.ts` | New — `getPersonas`, `addPersona`, `updatePersona`, `getActivePersonas` |
| `data/mock/kris.ts` | New — 8 mock KRIs |
| `data/mock/personas.ts` | New — 4 mock AI assessor personas |
| `data/mock/synthesis.ts` | New — 3 mock `SynthesisedAssessment` objects |

No changes required to: `types/risk.ts`, `types/document.ts`, `types/agent.ts`, `types/control.ts`.

---

## Implementation Order

1. **New types + mock data** — `kri.ts`, `assessor-persona.ts`, `survey.ts` + all mock files + stores. No UI. Foundation for everything.
2. **Assessments page rework** — highest value. Priority queue tab, assessment detail drawer with opinions table, AI Personas tab.
3. **Dashboard** — remove chat/quick actions, add `KRIStatusStrip` and `AgentQueuePreview`.
4. **Risk Discovery** — batch approve, duplicate flag column, surveys section, sources drawer, step label copy.
5. **Treatment tab** — `AgentActionPreview`, KRI signals on accordion rows, chart reorganisation.
6. **Monitoring tab** — `KRIDashboard`, KRI cards, alert type additions.
7. **Reporting page** — rename sidebar, implement `ReportGenerator` + `ReportView`.
8. **Risk Register** — KRI signals column, agent identify button in toolbar.
