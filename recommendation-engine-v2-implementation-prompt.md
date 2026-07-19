# SCPR Recommendation Engine V2 — Master Implementation Prompt

**Use this document as:** a single, complete briefing to give to an AI coding agent (Claude Code or equivalent) to implement Recommendation Engine V2 against the real SCPR repository.

**Do not implement this as one pass.** Follow the phases in order. Each phase has its own exit criteria and its own commit/PR. Do not start Phase N+1 until Phase N's exit criteria are met.

---

## 0. How to Use This Document

1. Read Section 1 (Role) and Section 5 (Git Workflow) first — do the branch setup before touching any code.
2. Read Section 6 carefully — it lists every place this prompt **deviates** from the original 10-part architecture spec you were given, and why. These deviations are intentional and are not up for silent reversal. If you disagree with one, stop and ask the human, don't just implement the original version.
3. Work through Section 9 (Phased Delivery Plan) top to bottom. Each phase links back to the detailed specs in Sections 10–15.
4. Section 17 is the master Definition of Done. Nothing is "complete" until it passes that checklist.
5. Section 18 tells you how to report progress back to the human at the end of each phase.

---

## 1. Role & Persona

You are acting as two people at once on this task:

**A Principal Backend Architect (30+ years)** who has shipped and maintained production recommendation systems. You are allergic to big-bang rewrites, hidden coupling, and hardcoded magic numbers. You extend existing code instead of replacing it. You ship in reviewable, revertible increments. You write tests before you trust your own code.

**A Career Counselor with 30+ years of experience** advising Indian students (Class 10, Class 12, diploma, ITI, working professionals). You know that a ranked list without a reason is not guidance — it's a guess with a percentage sign on it. You know that telling a student "you don't qualify" damages trust in a way that "here's what would open this path up" does not. You know real counselors weigh academics, interest, skill, personality, and *life constraints* together, not academics alone.

Every engineering decision below should be defensible from both chairs.

---

## 2. Mission Statement

Transform SCPR's recommendation pipeline from **single-factor cosine-similarity ranking** into a **transparent, multi-factor, explainable suitability engine** — without breaking, rewriting, or destabilizing anything currently in production.

You are computing **Career Suitability**, not **Career Prediction**. Say this explicitly anywhere the product surfaces scores to a student or parent.

---

## 3. Ground Truth: Current System

This is not a greenfield build. The following already exists and works. Confirm each of these against the repo before writing a single line of new code — do not assume, verify.

**Current pipeline (backend/src/recommendation/):**
```
Student Profile → Student DNA (onboarding/trait-engine.service.ts)
                 → Eligibility Engine (recommendation/eligibility-engine.service.ts)
                 → Trait Matching Engine / Cosine Similarity (recommendation/trait-matching-engine.service.ts)
                 → Top 20
                 → LLM Ranking & Explanation (ai-service/*)
                 → Top 5
```

**Files that already exist and must be reused, not duplicated:**
- `backend/src/recommendation/eligibility-engine.service.ts` (+ `.spec.ts`) — hard-filter logic. Keep as Stage 1 of the new pipeline.
- `backend/src/recommendation/trait-matching-engine.service.ts` (+ `.spec.ts`) — cosine similarity. This becomes the core of the new **Personality Engine** — do not write a second cosine similarity implementation.
- `backend/src/common/vector-math.ts` — shared vector math. Reuse this for all engines that need vector comparison (Personality, and optionally Interest/Skill if modeled as vectors).
- `backend/src/onboarding/trait-engine.service.ts` — generates Student DNA. **Do not modify.**
- `backend/src/recommendation/recommendation.service.ts` (+ `.spec.ts`) — current orchestrator. This will be refactored into a thin orchestrator (Section 9, Phase 2) but its public contract must keep working throughout.
- `backend/src/recommendation/recommendation.controller.ts` and `recommendation.module.ts` — existing API surface. Backward compatibility is mandatory (Section 12).
- `backend/src/recommendation/schemas/recommendation.schema.ts` and `recommendation-feedback.schema.ts` — existing Mongo schemas. Extend, don't replace.
- `backend/src/careers/schemas/career.schema.ts` — existing Career schema. Extend with new metadata fields only (Section 11).
- `backend/src/ai-service/prompts/career-recommendation.md` and the rest of `ai-service/prompts/` — existing prompt files. New prompts are added alongside these, not instead of them.
- `backend/src/ai-service/schemas/json-schemas/` — existing structured-output schemas + `index.ts` registry. New schemas get added here and registered the same way.

**Modules that must NOT be touched under any circumstances in this project:** `auth/`, `analytics/`, `dashboard/`, `history/`, `reports/`, `onboarding/` (except reading from it, never writing to it), `ai-service/providers/`, `ai-service/router.service.ts`, `ai-service/key-pool.service.ts`.

---

## 4. Non-Negotiable Principles

These come directly from the original spec and are correct as written. Do not weaken them.

1. **Deterministic before AI.** Business logic (all scoring, ranking, filtering) lives in the backend. The LLM explains and counsels; it never scores, ranks, invents careers, or overrides eligibility.
2. **Explainability first.** Every number a student sees must trace back to a measurable factor a human could audit.
3. **No hallucinated careers.** The AI layer may only discuss careers the backend already selected.
4. **Backward compatible.** No existing frontend page, API contract, or onboarding flow breaks.
5. **Extend, don't remove.** Existing code is deleted only after its replacement is proven equivalent or better in production (see Migration Plan, Section 16), never before.
6. **Config over hardcoding.** Weights, thresholds, bonus/penalty tables, and taxonomy live in versioned config files, not inline in service code.
7. **Honest about constraints.** A recommendation that's academically strong but practically unreachable (budget, relocation, duration) gets a penalty and a clear reason — never a silent exclusion and never framed as "you don't qualify." Frame it as "here's what would make this reachable."

---

## 5. Git & Safety Workflow

**Do this before writing any implementation code.**

```bash
git checkout main
git pull origin main
git checkout -b feature/recommendation-engine-v2
```

Rules for the rest of the project:

- All work happens on `feature/recommendation-engine-v2` or short-lived sub-branches cut from it, e.g. `feature/rec-v2-phase1-scoring-engines`, merged back into the feature branch via PR — never directly into `main`.
- `main` is never touched until Phase 7 (cutover) in Section 9, and only after the parallel-run comparison in Section 16 passes.
- Every phase ends in its own commit (or small commit series) with a message in the form:
  `rec-v2(phaseN): <what changed>` — e.g. `rec-v2(phase1): add academic, interest, skill engines with shared base class`
- Add a runtime feature flag at the orchestrator level:
  ```typescript
  // config/recommendation.constants.ts
  export const RECOMMENDATION_ENGINE_VERSION: 'v1' | 'v2' =
    (process.env.RECOMMENDATION_ENGINE_VERSION as 'v1' | 'v2') ?? 'v1';
  ```
  `RecommendationService` checks this flag and routes to the old pipeline or the new one. This is your instant rollback switch — it must exist before Phase 5 (Hybrid Ranking) is merged, not added at the end.
- Never squash away the ability to `git diff` V1 vs V2 output for the same student — Phase 6 depends on this.

---

## 6. Architect's Explicit Deviations From the Original 10-Part Spec

The original spec (Parts 1–10) is a strong architecture document but it was written all at once, without checking it against a live codebase or a delivery calendar. As the implementing architect, I am making the following corrections. Implement the project **as corrected below**, not as originally written.

| # | Original spec said | Correction | Why |
|---|---|---|---|
| 1 | Build all 9 engines + Diversity + Confidence + Explainability + full AI prompt suite together | Deliver in 8 phases (Section 9); MVP = Eligibility + Academic + Interest + Skill + Personality + Constraint + Hybrid Ranking only | Shipping 9 new subsystems into a production student-facing tool in one PR is an unacceptable regression risk. Phase it. |
| 2 | Build a "Career Evidence Graph" / "Career Knowledge Graph" (Parts 6 & 7) as a graph data structure | Model relationships as plain fields on the existing Mongo `Career` document: `relatedCareers: string[]`, `alternativeCareers: string[]`, `similarityVector: number[]`, `cluster`, `family`, `sector`, `domain` | No graph database exists in this stack today. Don't introduce one to solve a problem embedded arrays solve fine at this data scale (~742 careers). Revisit only if usage data justifies it (Part 10, Level 4–5). |
| 3 | Weights should be config-driven (Part 3 & 4 architect notes) | Confirmed and **elevated to a Phase 1 hard requirement**, not later polish | The original spec correctly identifies this but treats it as an optional nice-to-have at the end. It's actually foundational — build it first or you'll hardcode weights and have to refactor later. |
| 4 | Confidence Engine has a "Recommendation Stability" component worth 15% weight, based on comparing recommendation runs over time | Deferred until recommendation versioning/history exists with ≥2 stored generations per student. Until then, redistribute that 15% proportionally across the other 5 confidence components, and document this as a temporary rule in `confidence.rules.ts` with a `// TODO: re-enable stability component once versioning ships` comment | The component depends on data that doesn't exist yet on day one. Don't fake it — redistribute honestly and flag it. |
| 5 | "Decision Boundary Analysis Engine" — what-if simulation ("if your math improves by 15 points, X becomes rank 1") | Out of scope for V2. Design the score-breakdown data model (Section 10.9–10.11) so it's possible later, but do not build the simulator now | Requires re-running the scoring pipeline under hypothetical deltas — real compute cost, real UX design work. Prove the base engine is stable and fast first. |
| 6 | Adaptive questioning when confidence < 60 (ask 5 more questions live) | Out of scope for V2. V2 instead surfaces a clear, supportive "we need a bit more information" message with a link back to the assessment. Adaptive re-questioning is a V3 candidate that touches the onboarding flow, which this project is explicitly forbidden from modifying | Keeps the promise in Section 3 that onboarding is untouched. |
| 7 | Test dataset: 300 synthetic student profiles across 8 categories | MVP test dataset: **40 personas**, 5 per category from the original persona list (Section 14), expanding toward 300 only after Phase 6 ships and the pipeline is stable in the parallel-run comparison | Don't spend two weeks building a 300-profile dataset before a single engine has run against real code. Build enough to catch real bugs, expand later. |
| 8 | 6 scoring engines (Academic, Interest, Skill, Personality, Constraint, Opportunity) built as fully independent implementations | All 6 extend one shared `BaseScoringEngine` abstract class with common `normalize()`, `clamp()`, `applyBonuses()`, `applyPenalties()` helpers | Six independently-written normalization implementations is how six slightly different rounding bugs happen. Share the primitives, keep the scoring logic per-engine. |
| 9 | Bonus/penalty logic implied as inline conditionals inside each engine | Table-driven rule sets evaluated by a small interpreter (`utils/bonus.ts`, `utils/penalty.ts`) reading from `config/recommendation-weights.ts` | Same "config over hardcoding" principle the original spec already applies to weights — apply it consistently to bonuses/penalties too. |
| 10 | 4-level career taxonomy (Sector → Domain → Family → Cluster) designed abstractly before touching the data | Phase 3 opens with a taxonomy **audit script** that reads the actual 742-career catalog and proposes the taxonomy from real data, which a human then reviews before it's finalized | Don't design a classification system in the abstract when the real catalog is sitting right there in the repo. |
| 11 | Constraint Engine penalizes budget/relocation/duration mismatches | Same math, but **all user-facing copy generated from constraint penalties must be framed as "what would make this reachable," never "you don't qualify"** | Counseling principle: a penalty is information, not a rejection. This is a copy/UX guardrail on top of the existing math, not a change to the scoring itself. |
| 12 | Migration plan mentions running V1 and V2 in parallel (Part 4, Phase 4) | Confirmed, and made concrete: the `RECOMMENDATION_ENGINE_VERSION` feature flag (Section 5) is the mechanism, and Section 16 defines exactly what "parallel run passes" means | Turns a vague migration step into an testable, revertible gate. |

Nothing else in the original 10 parts is overridden — the scoring philosophy, the engine responsibilities, the explainability requirements, and the AI guardrails in Parts 1–10 are sound and should be implemented as designed, subject only to the corrections above.

---

## 7. Final Target Architecture (End State, All Phases Complete)

```
Student
  ↓
Eligibility Engine                         [existing, reused]
  ↓
Academic Engine        ─┐
Interest Engine         │
Skill Engine             │  run in parallel via Promise.all
Personality Engine       │  (Section 13)
Constraint Engine        │
Opportunity Engine      ─┘
  ↓
Hybrid Ranking Engine
  ↓
Top 20
  ↓
Diversity Engine
  ↓
Top 8
  ↓
Confidence Engine
  ↓
Explainability Engine
  ↓
Top 5 + full score breakdown + reasons
  ↓
Prompt Builder → LLM Personalization (career-explanation, roadmap, skill-gap, etc.)
  ↓
Student
```

RecommendationService becomes a thin **orchestrator** — it calls engines, it does not contain scoring logic itself.

---

## 8. Folder Structure To Create

Legend: `[EXISTS]` = already in repo, reuse/extend. `[NEW]` = create in this project.

```
backend/src/recommendation/
├── recommendation.controller.ts                    [EXISTS – extend response shape only]
├── recommendation.service.ts                       [EXISTS – refactor into orchestrator]
├── recommendation.module.ts                         [EXISTS – register new providers]
│
├── dto/
│   ├── recommendation.dto.ts                        [EXISTS]
│   ├── generate.dto.ts                               [NEW]
│   ├── score.dto.ts                                  [NEW]
│   └── career-ranking.dto.ts                         [NEW]
│
├── interfaces/                                       [NEW folder]
│   ├── engine.interface.ts
│   ├── score-breakdown.interface.ts
│   ├── career-ranking.interface.ts
│   └── recommendation.interface.ts
│
├── config/                                            [NEW folder]
│   ├── recommendation-weights.v1.json
│   ├── recommendation.constants.ts
│   └── thresholds.ts
│
├── engines/                                            [NEW folder]
│   ├── base-scoring.engine.ts                          [NEW — shared abstract class]
│   ├── eligibility.engine.ts                            [wraps EXISTING eligibility-engine.service.ts, do not rewrite logic]
│   ├── academic.engine.ts                                [NEW]
│   ├── interest.engine.ts                                [NEW]
│   ├── skill.engine.ts                                    [NEW]
│   ├── personality.engine.ts                              [wraps EXISTING trait-matching-engine.service.ts]
│   ├── constraint.engine.ts                                [NEW]
│   ├── opportunity.engine.ts                                [NEW — Phase 4]
│   ├── diversity.engine.ts                                  [NEW — Phase 3]
│   ├── confidence.engine.ts                                  [NEW — Phase 5]
│   ├── explainability.engine.ts                               [NEW — Phase 5]
│   └── hybrid-ranking.engine.ts                                [NEW — Phase 2]
│
├── services/                                             [NEW folder]
│   ├── ranking.service.ts
│   ├── recommendation-cache.service.ts
│   ├── recommendation-audit.service.ts
│   └── recommendation-metrics.service.ts
│
├── schemas/
│   ├── recommendation.schema.ts                          [EXISTS – extend fields, Section 11]
│   └── recommendation-feedback.schema.ts                  [EXISTS – unchanged]
│
├── eligibility-engine.service.ts (+ .spec.ts)               [EXISTS – kept, called by engines/eligibility.engine.ts]
├── trait-matching-engine.service.ts (+ .spec.ts)              [EXISTS – kept, called by engines/personality.engine.ts]
│
├── testing/                                              [NEW folder — Phase 6]
│   ├── unit/
│   ├── integration/
│   ├── scenarios/
│   ├── benchmark/
│   ├── datasets/
│   ├── snapshots/
│   └── performance/
│
└── utils/                                                 [NEW folder]
    ├── normalize.ts
    ├── weight-calculator.ts
    ├── penalty.ts
    ├── bonus.ts
    └── validators.ts

backend/src/careers/schemas/career.schema.ts               [EXISTS – add careerMetadata block, Section 11]

backend/src/ai-service/prompts/recommendation/               [NEW subfolder]
    ├── career-explanation.md
    ├── career-comparison.md
    ├── career-roadmap.md
    ├── skill-gap.md
    ├── career-summary.md
    ├── career-faq.md
    └── career-alternatives.md

backend/src/ai-service/schemas/json-schemas/                 [EXISTS – add + register new schemas]
    ├── career-explanation.schema.ts                          [NEW]
    ├── career-comparison.schema.ts                             [NEW]
    ├── skill-gap.schema.ts                                       [NEW]
    └── index.ts                                                    [EXISTS – register the above]
```

---

## 9. Phased Delivery Plan

Each phase = one PR into `feature/recommendation-engine-v2`. Do not proceed to the next phase until the exit criteria are met and the human has reviewed the PR.

### Phase 0 — Setup & Safety Net (½ day)
- Branch created (Section 5).
- Feature flag `RECOMMENDATION_ENGINE_VERSION` added and wired into `recommendation.module.ts`, defaulting to `v1`.
- Empty folder structure created (Section 8) with placeholder interface files.
- **Exit criteria:** app builds and boots with flag defaulting to `v1`; existing test suite (`recommendation.service.spec.ts`, `eligibility-engine.service.spec.ts`, `trait-matching-engine.service.spec.ts`) still passes unmodified.

### Phase 1 — Config Foundation & Shared Primitives
- `config/recommendation-weights.v1.json`, `config/recommendation.constants.ts`, `config/thresholds.ts` (Section 10.9 weight table).
- `interfaces/engine.interface.ts`, `interfaces/score-breakdown.interface.ts` (Section 10.1).
- `engines/base-scoring.engine.ts` abstract class.
- `utils/normalize.ts`, `utils/weight-calculator.ts`, `utils/penalty.ts`, `utils/bonus.ts`.
- Unit tests for every util function.
- **Exit criteria:** 100% unit test coverage on `utils/` and `base-scoring.engine.ts`; no engine logic yet.

### Phase 2 — Core Scoring Engines (Academic, Interest, Skill, Personality, Constraint)
- Implement each engine per Section 10.3–10.7, each extending `BaseScoringEngine`.
- `engines/personality.engine.ts` wraps `trait-matching-engine.service.ts` — no duplicated cosine similarity code.
- `engines/eligibility.engine.ts` wraps `eligibility-engine.service.ts` unchanged.
- Unit tests per engine (Section 14 checklist).
- **Exit criteria:** each engine independently returns a valid `ScoreBreakdown` for a hand-built test student/career pair; no orchestration wiring yet.

### Phase 3 — Hybrid Ranking, Taxonomy Audit & Diversity Engine
- `engines/hybrid-ranking.engine.ts` (Section 10.9): weighted sum + bonuses − penalties + tie-breaking.
- Taxonomy audit script reads the real career catalog, proposes Sector/Domain/Family/Cluster — human reviews output before finalizing `careerMetadata.cluster/family/sector/domain` values.
- `engines/diversity.engine.ts` (Section 10.10) using the reviewed taxonomy + similarity threshold.
- **Exit criteria:** given a full eligible career list, produces a ranked Top 20 then a diversified Top 8 with no single-cluster domination (validated against at least 5 personas manually).

### Phase 4 — Opportunity Engine & Orchestrator Refactor
- `engines/opportunity.engine.ts` (Section 10.8) — capped at 10% weight, never dominant.
- Refactor `recommendation.service.ts` into a thin orchestrator that runs Phases 2–4 engines via `Promise.all` where independent (Section 13), then Hybrid Ranking, then Diversity.
- Wire the `RECOMMENDATION_ENGINE_VERSION` flag: `v2` routes here, `v1` still calls the old path untouched.
- **Exit criteria:** with flag set to `v2` in a local/staging environment, a full request returns a Top 8 diversified list end-to-end; `v1` path still works identically to before this project started.

### Phase 5 — Confidence & Explainability Engines
- `engines/confidence.engine.ts` (Section 10.11) — with the stability-component deferral from Deviation #4.
- `engines/explainability.engine.ts` (Section 10.12) — produces the `RecommendationReason` object (Section 10.12) for every ranked career, without calling AI.
- Recommendation schema extended (Section 11) to store the full breakdown.
- **Exit criteria:** every career in the Top 5 has a populated confidence score and a reason object with primary reasons, strengths, weaknesses, bonuses, and penalties — all generated without any LLM call.

### Phase 6 — Testing & Benchmark Dataset (MVP scope, Deviation #7)
- Build the 40-persona MVP dataset (Section 14).
- Snapshot testing: store Top 5 + full breakdown per persona; any future weight/logic change must show a diffed, explained snapshot change, not a silent one.
- Performance tests against Section 13 SLA targets.
- **Exit criteria:** all 40 personas produce recommendations that pass the sanity checklist in Section 14 (no duplicate careers, confidence present, explainability complete, diversity present); performance within SLA on a 742-career catalog.

### Phase 7 — AI Prompt Layer
- New prompts under `ai-service/prompts/recommendation/` (Section 15), each single-responsibility, each following the existing prompt file conventions already used in the repo.
- New JSON schemas registered in `ai-service/schemas/json-schemas/index.ts`.
- Prompt Builder component: assembles compact context (career + scores + reasons, never the raw student profile, never all 742 careers) — see Section 15.
- **Exit criteria:** for a sample of 10 personas, each AI-generated explanation/roadmap validates against its JSON schema on first try in ≥95% of runs, and is manually spot-checked for zero hallucinated careers or contradicted backend data.

### Phase 8 — Parallel Run, Cutover & Cleanup
- Run V1 and V2 side by side (flag-controlled) against the same live traffic sample or replayed requests; compare outputs per Section 16.
- Once comparison passes, flip default flag to `v2` in staging, then production.
- Only after a stable production period, remove deprecated V1-only code paths that are no longer reachable — **never remove `eligibility-engine.service.ts` or `trait-matching-engine.service.ts`, they are still in use inside the new engines.**
- **Exit criteria:** Section 17 Master DoD fully checked.

---

## 10. Engine-by-Engine Technical Spec

### 10.1 Shared Engine Interface & Base Class

```typescript
// interfaces/score-breakdown.interface.ts
export interface ScoreBreakdown {
  score: number;              // 0–100, normalized
  weight: number;              // 0–1, this engine's contribution weight (from config)
  weightedScore: number;       // score * weight
  confidence: number;          // 0–100, this engine's own confidence in its inputs
  bonuses: number;             // total bonus points applied (pre-cap)
  penalties: number;           // total penalty points applied (pre-cap)
  matchedFactors: string[];
  missingFactors: string[];
  reasoning: string[];
}

// interfaces/engine.interface.ts
export interface RecommendationEngine {
  readonly name: string;
  readonly version: string;
  calculate(student: StudentContext, career: CareerContext): Promise<ScoreBreakdown> | ScoreBreakdown;
}
```

```typescript
// engines/base-scoring.engine.ts
export abstract class BaseScoringEngine implements RecommendationEngine {
  abstract readonly name: string;
  readonly version = 'v2';

  protected normalize(value: number, min: number, max: number): number {
    return this.clamp(((value - min) / (max - min)) * 100, 0, 100);
  }

  protected clamp(value: number, min = 0, max = 100): number {
    return Math.min(max, Math.max(min, value));
  }

  protected applyBonuses(base: number, bonuses: { label: string; points: number }[], cap = 15): { score: number; total: number; labels: string[] } {
    const total = this.clamp(bonuses.reduce((sum, b) => sum + b.points, 0), 0, cap);
    return { score: this.clamp(base + total), total, labels: bonuses.map(b => b.label) };
  }

  protected applyPenalties(base: number, penalties: { label: string; points: number }[], cap = 40): { score: number; total: number; labels: string[] } {
    const total = this.clamp(penalties.reduce((sum, p) => sum + p.points, 0), 0, cap);
    return { score: this.clamp(base - total), total, labels: penalties.map(p => p.label) };
  }

  abstract calculate(student: StudentContext, career: CareerContext): ScoreBreakdown;
}
```

Every engine in 10.3–10.8 extends this. Do not reimplement `normalize`/`clamp`/bonus/penalty capping per engine.

### 10.2 Eligibility Engine — Keep As-Is

Wrap the existing `eligibility-engine.service.ts` behind `engines/eligibility.engine.ts`. Its job stays exactly "can this student pursue this career," never "should they." No new logic in Phase 1–4; only revisit if a specific bug is found.

### 10.3 Academic Engine — NEW

**Inputs:** overall percentage, individual subject marks, favorite subjects, weak subjects, board, current stream.

**Component weights:**

| Component | Weight |
|---|---|
| Required Subjects Match | 60% |
| Overall Performance | 20% |
| Favorite Subjects Alignment | 10% |
| Weak Subject Penalty | 10% |

Output: `ScoreBreakdown` with `weight = config.academic` (default 0.25, see 10.9).

### 10.4 Interest Engine — NEW

**Inputs:** per-domain interest scores (Technology, Medicine, Business, Research, Government, Creative Arts, Teaching, Sports, Agriculture, Finance, Media, etc.) vs. the career's interest profile.

Score = similarity between student interest vector and career interest vector (cosine similarity via `common/vector-math.ts`, or weighted overlap — pick cosine for consistency with Personality Engine, document the choice in code comments).

Output weight = `config.interest` (default 0.20).

### 10.5 Skill Engine — NEW

**Inputs:** practical ability scores — Communication, Leadership, Coding, Drawing, Creativity, Observation, Problem Solving, Critical Thinking, Mathematics, Writing, Public Speaking, Logical Thinking, Teamwork, Negotiation.

Same vector-similarity approach as Interest Engine, against the career's required-skill profile.

Output weight = `config.skill` (default 0.20).

### 10.6 Personality Engine — Wraps Existing Code

Do not write new cosine similarity logic. `engines/personality.engine.ts` calls `trait-matching-engine.service.ts` (which already does Student DNA vs Career Trait Vector cosine similarity) and wraps its result into the standard `ScoreBreakdown` shape.

Output weight = `config.personality` (default 0.15).

### 10.7 Constraint Engine — NEW

**Inputs:** budget, preferred location, government/private preference, maximum study duration, abroad willingness, family responsibilities, financial need.

This engine **penalizes rather than filters** — a career that's a hard-eligibility pass but a poor constraint fit gets a low constraint score, not exclusion.

**Copy guardrail (Deviation #11):** any human-readable string this engine (or the Explainability Engine, using its output) produces must be framed as *"here's what would make this more reachable"*, never *"you don't qualify"* or *"you can't afford this."* Enforce this with a small lint check on any string constants added to this engine's reasoning output — flag any occurrence of "can't," "cannot," "not eligible," "don't qualify" for human review before merge.

Output weight = `config.constraint` (default 0.10).

### 10.8 Opportunity Engine — NEW (Phase 4)

**Inputs (career-level, not student-level):** job demand, growth rate, salary potential, automation risk, government opportunities, remote-work availability, industry stability.

This score belongs to the career, not the student — cache it per career, don't recompute per student request (Section 13).

**Hard rule:** this engine's output weight is capped at `config.opportunity` (default 0.10) and must never be allowed to exceed 15% even via config, to prevent market-trend chasing from overriding personal fit. Enforce this as a validated upper bound in `config/thresholds.ts`, not just a comment.

### 10.9 Hybrid Ranking Engine

**Default weight table** (`config/recommendation-weights.v1.json`):

| Engine | Weight |
|---|---|
| Academic | 25% |
| Interest | 20% |
| Skill | 20% |
| Personality | 15% |
| Constraint | 10% |
| Opportunity | 10% |

**Formula:**
```
finalScore = clamp(
  (academic.score * academic.weight)
  + (interest.score * interest.weight)
  + (skill.score * skill.weight)
  + (personality.score * personality.weight)
  + (constraint.score * constraint.weight)
  + (opportunity.score * opportunity.weight)
  + totalBonuses
  - totalPenalties,
  0, 100
)
```
- `totalBonuses` capped at 15 points total (not per engine).
- `totalPenalties` capped at 40 points total (not per engine).

**Tie-breaking priority** (when scores differ by < 0.5):
1. Higher Interest score
2. Higher Skill score
3. Higher Personality score
4. Higher Opportunity score
5. Alphabetical by career name

**Score interpretation:**

| Final Score | Interpretation |
|---|---|
| 90–100 | Excellent Match |
| 80–89 | Strong Match |
| 70–79 | Good Match |
| 60–69 | Moderate Match |
| Below 60 | Low Suitability |

Do not surface careers below 70 in the final Top 5 unless fewer than five careers exceed that threshold — in that case, surface what's available but flag lower confidence (Section 10.11) and suggest completing more of the assessment.

### 10.10 Diversity Engine (Phase 3)

- Runs **after** ranking, never before.
- Uses `careerMetadata.cluster` (from the taxonomy audit — Section 9, Phase 3) to group the Top 20/30.
- Similarity threshold: careers with similarity > 0.85 are treated as duplicates within a cluster; only the highest-scoring representative survives into the diversified list, others are stored as `relatedCareers` on the surfaced one, not discarded.
- Target output: diversified Top 8, trimmed to Top 5 after Confidence Engine runs.
- Ship this **configurable** (strict / balanced / exploration mode) from day one per the original spec's Part 7 §24 — this is cheap to add now and expensive to retrofit.

### 10.11 Confidence Engine (Phase 5)

**Components and weights (redistributed per Deviation #4 until stability data exists):**

| Component | Original Weight | V2-Launch Weight (stability deferred) |
|---|---|---|
| Profile Completeness | 25% | 29% |
| Answer Consistency | 20% | 24% |
| Career Separation | 20% | 24% |
| Assessment Quality | 10% | 12% |
| Data Quality | 10% | 12% |
| ~~Recommendation Stability~~ | ~~15%~~ | *disabled — see `confidence.rules.ts` TODO* |

**Confidence levels:**

| Confidence | Meaning |
|---|---|
| 90–100 | Highly Reliable |
| 80–89 | Reliable |
| 70–79 | Good |
| 60–69 | Moderate |
| Below 60 | Needs More Assessment |

**Below-60 behavior:** do not suppress the recommendation, but attach a clear, supportive message (per the copy guardrail in 10.7) pointing back to completing more of the assessment. Do not build live adaptive re-questioning (Deviation #6).

### 10.12 Explainability Engine (Phase 5)

Produces, per ranked career, without calling AI:

```typescript
interface RecommendationReason {
  careerId: string;
  careerName: string;
  rank: number;
  finalScore: number;
  confidence: number;
  primaryReasons: string[];      // max 5
  secondaryReasons: string[];
  bonuses: string[];
  penalties: string[];
  studentStrengths: string[];
  improvementAreas: string[];
  comparisonSummary: string;     // why this career ranked where it did relative to its neighbor
}
```

This is what the frontend renders immediately (Section 12) and what the Prompt Builder (Section 15) sends to the LLM — the LLM never re-derives this, it only rewrites it in natural language.

---

## 11. Data Model Changes

**Career schema (`backend/src/careers/schemas/career.schema.ts`) — additive only:**

```typescript
careerMetadata: {
  cluster: string;
  family: string;
  sector: string;
  domain: string;
  relatedCareers: string[];       // careerIds
  alternativeCareers: string[];   // careerIds
  similarityVector: number[];     // for diversity engine comparisons
  careerOpportunity: number;      // 0–100, cached, refreshed periodically not per-request
  automationRisk: number;
  salaryRange: { min: number; max: number; currency: 'INR' };
  futureGrowth: number;
  difficulty: number;
}
```

**Student Profile schema — additive, all optional, do not touch required fields:**

```typescript
recommendationPreferences?: {
  governmentWeight?: number;
  privateWeight?: number;
  startupWeight?: number;
  entrepreneurshipWeight?: number;
  remoteWorkWeight?: number;
  researchWeight?: number;
  diversityMode?: 'strict' | 'balanced' | 'exploration';
}
```

**Recommendation schema — extend the existing document, keep old fields for backward reads:**

```typescript
{
  // existing fields untouched
  recommendationVersion: 'v1' | 'v2';
  engineVersion: string;
  weightVersion: string;         // e.g. 'recommendation-weights.v1'
  generatedAt: Date;
  processingTimeMs: number;
  confidence: RecommendationConfidence;
  top20: CareerRanking[];
  top5: CareerRanking[];
  auditLog: {
    studentId: string;
    eligibleCareerCount: number;
    aiProvider?: string;
    aiGenerationTimeMs?: number;
  };
}
```

---

## 12. API Contract

**Existing endpoint stays:** `POST /recommendations/generate`

Response becomes richer but **additive-only** — every field the current frontend reads today must still be present in the same shape. New fields (`confidence`, `scoreBreakdown`, `top20`, `processingTime`, `recommendationVersion`) are additions the current frontend can safely ignore.

New DTOs: `GenerateRecommendationDto`, `RecommendationResultDto`, `CareerRankingDto`, `ScoreBreakdownDto`, `ConfidenceDto`, `RecommendationMetadataDto` — all in `recommendation/dto/`.

---

## 13. Caching, Performance & Concurrency Requirements

| Operation | Target |
|---|---|
| Eligibility filtering | < 100ms |
| Score calculation (all engines, all eligible careers) | < 400ms |
| Diversity | < 50ms |
| Confidence | < 50ms |
| Explainability | < 100ms |
| Total backend (excluding AI call) | < 700ms |

To hit this on a ~742-career catalog:
- Academic, Interest, Skill, Personality, Constraint engines run **independently per career** and can be parallelized with `Promise.all` across careers or across engines per career — pick whichever profiling shows is faster, but do not run them serially.
- Opportunity Engine scores are **career-level, not student-level** — compute once per career and cache (`recommendation-cache.service.ts`), never recompute per student request.
- Student DNA vector and normalized student profile are computed **once per request**, not once per career comparison.
- Recommendation results are cached and invalidated only when: academic data, interests, skills, goals, preferences, Student DNA, career database version, or recommendation engine version changes (Part 4 §13 of the original spec — unchanged, correct as written).

---

## 14. Testing & QA Plan (MVP scope — Deviation #7)

**40-persona dataset**, 5 personas each across: Science, Commerce, Arts, Diploma/ITI, Government Aspirants, Sports, Creative, Working Professionals seeking a pivot.

Every persona test asserts:
- [ ] No duplicate careers in Top 5 (same career twice)
- [ ] No near-duplicate cluster domination (e.g., not 4 of 5 from "Software" cluster)
- [ ] Every career has a populated confidence score
- [ ] Every career has ≥1 primary reason and, if penalized, ≥1 penalty explanation
- [ ] Final scores are within [0, 100]
- [ ] Confidence is within [0, 100]
- [ ] If confidence < 60, the "needs more assessment" message is attached
- [ ] Constraint-penalty copy contains no "can't/cannot/not eligible/don't qualify" language (Section 10.7 guardrail)

**Per-engine unit test checklist** (apply to each of Academic, Interest, Skill, Personality, Constraint, Opportunity):
- [ ] Normal case
- [ ] Missing/partial input data
- [ ] Extreme values (all 0s, all 100s)
- [ ] Output always within [0, 100]
- [ ] Bonus/penalty caps respected

**Snapshot testing:** store each persona's Top 5 + full breakdown after Phase 6. Any later change to weights, config, or engine logic must produce a diffed snapshot report reviewed by a human before merge — silent ranking drift is treated as a bug.

**Expand to 300 personas** only after Phase 8 cutover is stable in production for at least one full review cycle.

---

## 15. AI / Prompt Layer Integration (Phase 7)

Follow the existing prompt file conventions already in `ai-service/prompts/` (see the existing `career-recommendation.md`, `counselor-chat.md`, `roadmap-generation.md` for house style). New prompts live in `ai-service/prompts/recommendation/`:

- `career-explanation.md` — why this career, in plain language, from the `RecommendationReason` object.
- `career-comparison.md` — why A ranked above B, using `comparisonSummary`.
- `career-roadmap.md` — step-by-step plan from current class to career entry.
- `skill-gap.md` — current vs. required skill, with a learning plan.
- `career-summary.md` / `career-faq.md` / `career-alternatives.md` — supporting content.

**Every prompt must specify:** Role, Objective, Input shape, Constraints, Output Format (strict JSON), Failure Behaviour, Guardrails. Register a matching schema in `ai-service/schemas/json-schemas/` and add it to the existing `index.ts`.

**Guardrails (unchanged from original spec, correct as written):** the LLM never recommends a career outside the backend's Top 20, never predicts the future, never guarantees salary or success, never contradicts backend scores, never invents eligibility requirements.

**Context sent to the LLM must be minimal** — never the raw student profile, never the full career catalog. Send only: student name/class-level, the specific career's rank/score, its `RecommendationReason` fields, and nothing else. Build this via a dedicated Prompt Builder step between Explainability Engine and the LLM call — don't let each prompt call manually assemble context inline.

**JSON validation:** every AI response validated against its schema; one retry on failure; deterministic fallback (render straight from the `RecommendationReason` object with no AI styling) if the retry also fails. Recommendation generation must never fail or block just because the AI call failed.

---

## 16. Migration & Rollout Plan

1. Phases 0–7 happen entirely behind `RECOMMENDATION_ENGINE_VERSION=v1` in default/staging config. Production stays on V1 throughout.
2. Once Phase 7 is merged, run V2 against a replayed or sampled set of real (anonymized) student profiles with the flag set to `v2` in a non-production environment, and V1 against the same profiles.
3. **Comparison must show:** V2 is never worse than V1 on the sanity checklist in Section 14, V2 confidence scores correlate sensibly with profile completeness, and no V2 output fails schema/JSON validation.
4. Only after that comparison is reviewed and signed off does the flag default flip to `v2` — first in staging, then in production, watched closely for at least one full day before being treated as final.
5. Deprecated V1-only code inside `recommendation.service.ts` is removed only after production has run stably on V2 — `eligibility-engine.service.ts` and `trait-matching-engine.service.ts` are never removed, since V2's engines call them directly.

---

## 17. Master Definition of Done

Recommendation Engine V2 is complete only when **all** of the following are true:

- [ ] Eligibility filtering remains deterministic and untouched in logic.
- [ ] Academic, Interest, Skill, Personality, Constraint, and Opportunity each produce independent, normalized (0–100) `ScoreBreakdown` objects.
- [ ] Weights, thresholds, and bonus/penalty tables live in versioned config, not hardcoded in services.
- [ ] Hybrid Ranking combines all engines with deterministic tie-breaking.
- [ ] Diversity Engine prevents single-cluster domination in the final Top 5, configurable by mode.
- [ ] Confidence Engine produces a multi-component, honestly-labeled score (with the stability component correctly disabled/documented per Deviation #4).
- [ ] Explainability Engine produces a full `RecommendationReason` object for every ranked career without calling AI.
- [ ] AI layer only explains/personalizes; never scores, ranks, or invents careers; all outputs schema-validated with a deterministic fallback.
- [ ] Existing `/recommendations/generate` endpoint remains backward compatible; old frontend fields unchanged.
- [ ] `RECOMMENDATION_ENGINE_VERSION` flag allows instant rollback to V1 at any point up through cutover.
- [ ] 40-persona MVP test suite passes the full checklist in Section 14.
- [ ] Performance targets in Section 13 are met on the full career catalog.
- [ ] No modification was made to `auth/`, `analytics/`, `dashboard/`, `history/`, `reports/`, `onboarding/`, or `ai-service/providers|router|key-pool`.
- [ ] All constraint/confidence-related user-facing copy passes the supportive-framing guardrail (Section 10.7).
- [ ] All work happened on `feature/recommendation-engine-v2` and its sub-branches; `main` was untouched until the reviewed cutover in Section 16.

---

## 18. Deliverable / Reporting Format Expected at the End of Each Phase

At the end of every phase, report back with:

1. **What changed** — bullet list of files added/modified, mapped to the phase's task list.
2. **What was deliberately deferred and why** — if anything from this prompt wasn't finished, say so explicitly; don't silently skip.
3. **Test results** — what was run, what passed, what's still red.
4. **Any new deviation from this prompt** — if you had to make a judgment call not covered above, document it in the same table format as Section 6, and flag it for the human to confirm rather than assuming.
5. **Exact commands to verify locally** — e.g., how to flip the feature flag and hit the endpoint to see V2 output.

Do not mark a phase "done" in your own summary unless every exit criterion in Section 9 for that phase is checked off.
