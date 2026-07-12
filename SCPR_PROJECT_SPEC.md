# SCPR — Smart Career Path Recommendation System
## Project Specification (v1 — Built From Scratch)

**Stack:** NestJS 11 (TypeScript) + Mongoose 9 + MongoDB Atlas · React 19 + TypeScript + Vite frontend
**Purpose:** An AI career counselor for Class 10 students that turns a natural, step-by-step onboarding into a deterministic, explainable career recommendation — with AI used to personalize and explain, never to decide.
**Status:** Greenfield build. This spec is the single source of truth; the phased execution plan (`SCPR_EXECUTION_PLAN.md`) is how you actually build it.

---

## 1. Vision

> A student completes SCPR's onboarding and never feels like they took a test. They answered questions about their subjects, interests, what they're good at, what they want out of life, and how they handle pressure — and at the end, the system hands them a short, ranked, explained list of careers that actually fit them, with a roadmap to get there.

The system is not a chatbot that free-associates careers. It is a **deterministic engine that narrows the field, with an LLM that explains the shortlist** — every recommendation is traceable to code, not to a model's mood.

---

## 2. Why This Architecture (design rationale)

An earlier prototype tried to classify students directly into one of 700+ careers using a Random Forest + XGBoost ensemble trained on synthetic data. It kept collapsing onto the same one or two careers regardless of student input — the textbook failure mode of too many classes, too little representative data, and feature engineering too weak to separate similar careers. No amount of tuning fixes an insufficient dataset; the fix is architectural.

This spec replaces that with:

```
Student → Eligibility Engine → Trait Matching Engine → Top 20 → LLM (rank + explain) → Top 5
```

- **Eligibility and ranking are deterministic** (plain code/Mongo queries), so every recommendation is inspectable and defensible.
- **The LLM never invents a candidate and never decides eligibility** — it only ranks, explains, and personalizes a shortlist the backend already computed.
- Adding a new career is a database row, not a retrain.
- Swapping or adding an LLM provider touches one module, not the whole system.

---

## 3. Tech Stack

| Layer | Choice |
|---|---|
| Backend framework | NestJS 11 (TypeScript, modular, DI-first) |
| ODM | Mongoose 9 |
| Database | MongoDB Atlas |
| Validation | `class-validator` / `class-transformer` DTOs at the controller boundary; Zod or a lightweight schema check for LLM JSON output |
| Auth | JWT (short-lived access + refresh), Passport (`passport-jwt`, `passport-local`) |
| Frontend | React 19 + TypeScript + Vite |
| Frontend state | Zustand (client state, incl. JWT — **memory only**) |
| Server cache | TanStack Query |
| Styling | Tailwind CSS |
| AI providers | Gemini, Groq, Mistral, DeepSeek, GLM — behind one internal orchestration layer |
| PDF generation | Puppeteer (HTML→PDF) or `pdfmake`, decided in Phase 6 of the execution plan |
| Process | Sole developer / small team, capstone-grade but production-shaped |

---

## 4. High-Level Architecture

```
                         React 19 Frontend
                                │
                                ▼
                    NestJS API (JWT-guarded)
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
   Onboarding Module      Careers Module          Counselor Module
        │                       │                       │
        ▼                       │                       │
  Trait Engine (pure fn)        │                       │
        │                       │                       │
        └───────────┬───────────┘                       │
                     ▼                                  │
          Recommendation Module                          │
     ┌───────────────┼────────────────┐                  │
     ▼                ▼                ▼                  │
Eligibility      Trait Matching     ai-service ◄───────────┘
 Engine           Engine            (Multi-LLM
(Mongo query,    (cosine sim,        Orchestration
 no AI)           no AI)             Layer)
                                          │
                       ┌──────────────────┼──────────────────┐
                       ▼                  ▼                  ▼
                    Gemini             Groq/Mistral       DeepSeek/GLM
```

Downstream consumers — **Dashboard, Reports, Analytics, History** — read from `StudentProfile`, `StudentDNA`, and `Recommendation`; they never call an LLM provider directly and never compute eligibility/matching themselves.

---

## 5. Core Backend Modules

| Module | Responsibility |
|---|---|
| `auth` | Register, login, refresh, logout, `me`. JWT issuance only. |
| `onboarding` | The 8-step guided flow → `StudentProfile` → `StudentDNA` (pure, deterministic trait computation). |
| `careers` | Career catalog: descriptions, `trait_weights`, `eligibility` constraints. Public read, admin write. |
| `recommendation` | Eligibility Engine + Trait Matching Engine + one `ai-service` call → `Recommendation`. |
| `ai-service` | The **only** module allowed to talk to an LLM provider SDK. Routing, retries, fallback, caching, prompt templates, JSON validation, logging. |
| `counselor` | Open-ended chat, routed through `ai-service`, with rolling conversation memory/summarization. |
| `dashboard` | Aggregates journey state, onboarding %, recommendation freshness, saved careers. |
| `reports` | Builds a PDF report from `StudentDNA` + `Recommendation`. |
| `analytics` | Fire-and-forget event tracking. Must never throw into a user-facing request. |
| `history` | Unified timeline (onboarding milestones, recommendations, saved careers). |
| `common` | Shared utilities — vector math, response envelope helpers, guards, interceptors. |

**Module boundary rule:** only `recommendation` calls `careers` and `onboarding`'s outputs to build a payload; only `ai-service` imports a provider SDK; everything else is a thin consumer.

---

## 6. Domain Model (Mongoose Schemas)

### `User`
```
User
├── user_id            # UUID, hyphens stripped — stable external id, not _id
├── email, email_verified
├── password_hash
├── provider            # "local" (future: "google", etc.)
├── role                # "student" | "admin"
├── full_name
├── failed_login_attempts, locked_until   # never serialized to client
├── last_login
└── created_at / updated_at
```

### `StudentProfile` (one per user, resumable)
```
StudentProfile
├── user_id
├── onboarding_step            # current step key, for resume
├── completion_percentage
├── personal:          { name, dob, age, gender, city, state, board }
├── academic:           { status, class10_percent, class12_percent,
│                          subjects: { maths, science, english, sst, computer },
│                          favorite_subjects[], weak_subjects[], stream_interest }
├── interests:           { technology, business, helping_people, teaching, nature,
│                          research, sports, design, media, government, finance,
│                          machines }                      # 0–100 sliders
├── skills:               { communication, leadership, problem_solving, creativity,
│                          logical_thinking, coding, drawing, math, observation,
│                          patience }                       # 1–5 self-rated
├── goals:                 [ranked: money, respect, innovation, helping_society,
│                          freedom, job_security, business, work_life_balance]
├── work_preferences:       [office, outdoor, hospital, travel, factory, lab,
│                          creative_studio, remote]
├── constraints:            { govt_vs_private, budget_tier, study_duration_max,
│                          willing_to_relocate, abroad_ok, preferred_location }
├── scenario_responses:      [{ question_id, selected_option, trait_weights }]
├── current_dna              # embedded StudentDNA, latest snapshot
└── created_at / updated_at
```

Step order: **personal → academic → interests → skills → goals → work_preferences → constraints → scenarios.** One endpoint per section, not per question — the student is "setting up a profile," not "answering a quiz."

### `StudentDNA` (embedded) + `StudentDNAHistory` (append-only)
```
StudentDNA
├── analytical_thinking, creativity, communication, leadership,
│   research, business_acumen, technical_curiosity, empathy,
│   patience, risk_tolerance          # each 0–100
├── computed_at
└── source_version                     # trait-weight config version used

StudentDNAHistory
├── user_id, dna_snapshot, computed_at, trigger
│   # trigger: "onboarding_complete" | "profile_updated" | "manual_recompute"
```
Kept even before anything reads it — it's what lets the dashboard later show trait growth over time.

### `Career`
```
Career
├── career_code           # stable string id (not Mongo _id)
├── category_code
├── name, description, required_skills[], technical_skills[], soft_skills[]
├── market_demand, future_scope, career_progression
├── trait_weights          # CareerTraitProfile — how much this career values each trait, 0–100
│   analytical_thinking, creativity, communication, leadership, research,
│   business_acumen, technical_curiosity, empathy, patience, risk_tolerance
├── eligibility             # CareerConstraints — hard gates
│   min_maths, min_science, min_biology, min_english,
│   max_budget_tier, min_study_duration_years, max_study_duration_years,
│   required_stream, abroad_required
└── trait_weights_draft, eligibility_draft   # staging fields for LLM-assisted backfill, never live until reviewed
```

### `Recommendation`
```
Recommendation
├── user_id, onboarding_session_ref
├── pipeline_version
├── eligible_count                       # size after Eligibility Engine
├── shortlist: [{ career_code, match_score }]        # top 20 from Trait Matching Engine
├── final_recommendations: [{
│     career_code, rank, ai_score, explanation, roadmap,
│     suggested_colleges, suggested_certifications
│   }]                                    # top 5 from LLM
├── ai_provider_used, ai_model_used, fallback_used
├── generated_at
└── stale: bool                           # true if profile changed since generation

RecommendationFeedback
├── user_id, recommendation_id, career_code, rating, comment, created_at
```

### `ai-service` — `AIRequestLog`
```
AIRequestLog
├── task_type          # "career_recommendation" | "counselor_chat" | "career_trait_backfill" | "roadmap_generation" | "report_summary"
├── provider, model
├── input_tokens, output_tokens, latency_ms
├── success, fallback_used, cached
└── created_at
```

### `counselor` — `Conversation` / `ConversationMessage`
```
Conversation
├── user_id, started_at, last_message_at, summary   # rolling summary for long chats

ConversationMessage
├── conversation_id, role, content, intent, is_structured, created_at
```

### `reports` — `Report`
```
Report
├── user_id, recommendation_ref, status   # QUEUED | GENERATING | READY | DOWNLOADED | FAILED
├── file_ref, generated_at
```

### `analytics` — `AnalyticsEvent`
```
AnalyticsEvent
├── user_id, event_type, payload, created_at
```

---

## 7. The 8 Onboarding Categories → Student DNA

| # | Category | What it captures |
|---|---|---|
| 1 | Academic Strength | Favourite/weak subjects, learning style |
| 2 | Natural Intelligence | Logical, creative, verbal, memory, numerical leanings |
| 3 | Hobbies / Interests | What the student actually enjoys (coding, drawing, sports, music...) |
| 4 | Work Preference | Office vs field, people vs machines, business vs research |
| 5 | Core Values / Goals | Money, respect, helping people, innovation, freedom, job security |
| 6 | Financial Constraints | Budget tier, location, study duration tolerance |
| 7 | Energy / Temperament | Fast-paced vs patient, stress handling |
| 8 | Real-Life Scenarios | Decision-making under pressure, leadership, conflict |

These map onto the 8 onboarding steps and feed the **Trait Engine** — a pure, deterministic function (`TRAIT_SCORING_KEY: { trait_name: { source_field: weight } }`) that produces the 10-dimension `StudentDNA` vector:

**`analytical_thinking, creativity, communication, leadership, research, business_acumen, technical_curiosity, empathy, patience, risk_tolerance`**

No AI call happens in this step — it's a weighted mapping, same shape every time, fully unit-testable.

---

## 8. Recommendation Pipeline (detail)

| Stage | Input | Output | AI call? |
|---|---|---|---|
| Eligibility Engine | Full career catalog | ~subset passing hard constraints | No — Mongo query |
| Trait Matching Engine | Eligible careers | Top 20 by match score | No — cosine similarity in code |
| AI Personalization | Top 20 + StudentDNA + profile | Top 5, ranked + explained | Yes — exactly 1 routed `ai-service` call |

**Eligibility Engine** — pushed into the Mongo query itself, never loaded into memory first and filtered in JS (this is what keeps it scalable as the catalog grows toward 700+ careers):
```ts
this.careerModel.find({
  'eligibility.min_maths': { $lte: student.academic.subjects.maths },
  'eligibility.min_science': { $lte: student.academic.subjects.science },
  'eligibility.max_budget_tier': { $gte: student.constraints.budget_tier },
  'eligibility.min_study_duration_years': { $lte: student.constraints.study_duration_max },
});
```

**Trait Matching Engine** — weighted cosine similarity between `StudentDNA` vector and each `Career.trait_weights` vector:
```
match_score = cosineSimilarity(studentDnaVector, careerTraitVector) × 100
```
Sort descending, take top 20. Shared vector math lives in `common/vector-math.ts`.

**AI Personalization payload** (never send more than the top 20):
```json
{
  "student_profile": { "academic": {...}, "interests": {...}, "goals": [...] },
  "student_dna": { "analytical_thinking": 92, "technical_curiosity": 96, "...": "..." },
  "candidate_careers": [
    { "name": "Software Engineer", "match_score": 96 },
    { "name": "AI Engineer", "match_score": 94 }
  ]
}
```
The prompt template must explicitly instruct the model to **rank only from the provided candidates, never invent a career outside the list, return strict JSON**, and explain each pick using the student's actual profile signals.

**Staleness:** any profile-relevant field change marks the latest `Recommendation.stale = true`. `POST /recommendations/regenerate` re-runs the full pipeline.

---

## 9. `ai-service` — Multi-LLM Orchestration Layer

The single chokepoint every AI-consuming feature calls through. No other module imports a provider SDK.

```
ai-service/
├── ai-request-log.schema.ts
├── providers/
│   ├── provider.interface.ts       # AbstractLLMProvider
│   ├── gemini.provider.ts
│   ├── groq.provider.ts
│   ├── mistral.provider.ts
│   ├── deepseek.provider.ts
│   └── glm.provider.ts
├── key-pool.service.ts              # rotates across N keys per provider from env
├── router.service.ts                # task_type → ordered provider list
├── retry-manager.service.ts         # in-provider key retries, then cross-provider fallback
├── prompt-builder.service.ts
├── prompts/
│   ├── career-recommendation.md
│   ├── roadmap-generation.md
│   ├── counselor-chat.md
│   ├── career-trait-backfill.md
│   └── report-summary.md
├── json-validator.service.ts        # validates + repairs structured LLM output
├── cache.service.ts                 # keyed by hash(task_type + relevant input)
├── token-logger.service.ts          # writes AIRequestLog
├── ai-service.schemas.ts            # request/response DTOs
└── ai-service.client.ts             # single public entrypoint: aiService.run(taskType, context)
```

**Standardized response shape** every provider adapter must normalize to, so downstream code never knows which provider actually answered:
```json
{
  "provider": "gemini",
  "model": "gemini-2.5-pro",
  "task": "career_recommendation",
  "success": true,
  "data": { "...task-specific JSON..." },
  "usage": { "input_tokens": 1200, "output_tokens": 450 },
  "latency_ms": 1830,
  "fallback_used": false,
  "cached": false
}
```

**Routing table** (plain config — one-line edits, no code change):

| Task | Primary | Fallback 1 | Fallback 2 |
|---|---|---|---|
| Career ranking + explanation | Gemini | DeepSeek | Groq (LLaMA 3.3-70B) |
| Roadmap generation | Gemini | DeepSeek | Groq |
| JSON extraction / re-ranking | GLM | Gemini | Groq |
| Counselor chat (low-latency) | Groq (LLaMA 3.3-70B) | Groq (Mixtral 8x7B) | Gemini Flash |
| Career trait backfill | GLM | Gemini | Groq |
| PDF / report summary | Mistral | Gemini | Groq |

**Fallback flow:** rotate keys within a provider first (cheap, fast); escalate to the next provider only once every key for the current provider is exhausted, rate-limited, or times out.

**Prompts are `.md` files**, loaded and interpolated at call time — never a hardcoded string in a `.ts` file.

**`json-validator.service.ts`** validates against the expected schema per task, attempts repair (strip markdown fences, trim leading/trailing prose), then raises a typed error if unrecoverable.

**Health check:** `GET /ai-service/health` — pings/validates each configured provider's keys, returns a per-provider status map. Public route.

---

## 10. API Surface (target contract)

Global prefix: **`/api`**. JWT Bearer auth by default; routes are public only if explicitly marked.

| Module | Base | Key Endpoints | Auth |
|---|---|---|---|
| Health | `/health` | `GET /health` | Public |
| Auth | `/auth` | register, login, logout, refresh, me, verify-email/:token, forgot-password, reset-password | Mixed |
| Onboarding | `/onboarding` | start, step/:stepKey (GET/PUT), resume, complete, student-dna | Auth |
| Careers | `/careers` | list, categories, search, suggest, filter, :careerCode, related/:careerCode, roadmap/:careerCode, by-codes, save, saved, admin/* | Mostly public; save/admin need auth |
| Recommendation | `/recommendations` | generate, latest, regenerate, feedback | Auth |
| AI Service | `/ai-service` | `GET /ai-service/health` | Public |
| Counselor | `/counselor` | chat, conversations, conversations/:id, feedback, regenerate | Auth |
| Dashboard | `/dashboard` | `GET /dashboard` | Auth |
| Analytics | `/analytics` | me, platform (admin), careers (admin), ai (admin), event | Auth / Admin |
| Reports | `/report` | generate, status/:reportId, download/:reportId, history | Auth |
| History | `/history` | `GET /history` (`?type=all\|careers\|recommendations\|onboarding`) | Auth |

**Naming conventions (non-negotiable, everywhere on the wire):**
- `snake_case` field names throughout, front to back — do not camelCase anything crossing the API boundary.
- `career_code` / `category_code` are the stable string identifiers, never Mongo `_id`.
- `user_id` is a hyphen-stripped UUID, not the Mongo `_id`.

**Error shape (stable, consistent across the API):**
```ts
{ statusCode: number; message: string; detail?: string; errors?: FieldError[]; timestamp: string; path: string; requestId: string }
```

**Success envelope — decide explicitly, don't leave ambiguous:** either (a) wrap every response as `{ data, timestamp, requestId }` via a global `TransformInterceptor` registered in `main.ts`, or (b) return raw DTOs with no envelope. Pick one in Phase 0 of the execution plan and apply it globally and consistently — an interceptor that exists but isn't wired up is the single most expensive kind of bug to chase later (silent `undefined` reads on the frontend).

---

## 11. Non-Negotiable Engineering Rules

*(Repeat this exact block at the top of every phase prompt in the execution plan.)*

- **Mongoose only.** Never a raw MongoDB driver call unless Mongoose genuinely can't express something — document why inline if you do.
- **Thin controllers.** All business logic lives in `*.service.ts`. Controllers parse the request (via DTOs), call a service, shape the response.
- **JWT lives in the frontend Zustand store, in memory only.** Never `localStorage`, never `sessionStorage`.
- **Analytics must never throw.** Every event-firing call site is wrapped so a failure is logged and swallowed — it must never break a user-facing request.
- **The backend is the source of truth for eligibility and ranking.** Eligibility filtering and trait-match scoring are deterministic code. The LLM never decides what's eligible and never invents candidates — it only ranks, explains, and personalizes a list the backend already produced.
- **Never send the full career catalog to an LLM.** Every recommendation call receives a pre-filtered top-20 candidate list, never the full catalog.
- **Provider-agnostic by design.** No module outside `ai-service/` imports a provider SDK directly. Every AI call goes through `aiService.run(taskType, context)`.
- **Prompts are `.md` template files** under `ai-service/prompts/`. Never hardcode a prompt string in a `.ts` file.
- **`snake_case` on the wire, everywhere**, matching the domain model above.
- **Scope discipline per phase.** Touch only the files a given phase names — don't refactor adjacent code "while you're in there."

---

## 12. Frontend Architecture

- **Routing:** `auth/*`, `onboarding/*` (one route per step, matching backend step order 1:1), `dashboard`, `recommendations`, `careers/*`, `counselor`, `reports`, `history`.
- **State:** Zustand slices for auth (JWT in memory only), onboarding draft state, and UI state. TanStack Query owns all server-derived data, keyed per endpoint.
- **Onboarding wizard:** 8 steps, one screen per step — `personal → academic → interests → skills → goals → work_preferences → constraints → scenarios` — with resume support via `GET /onboarding/resume`.
- **Student DNA visualization:** a radar/spider chart showing the 10 traits, shown once onboarding completes and again on the dashboard/history to show growth over time.
- **Recommendation display:** top 5 careers, ranked, each with explanation, roadmap, suggested colleges/certifications, and a save action.
- **Counselor chat:** must render gracefully even if the AI reply isn't valid structured JSON — fall back to plain markdown rendering rather than showing a broken/empty bubble.
- **Accessibility floor:** reduced-motion support, keyboard navigation, ARIA on step indicators — apply consistently across every wizard step and new screen, not just some.
- **Never invent an endpoint.** If a screen needs data the backend doesn't expose, that's a backend task — don't fabricate a client-side stub that silently returns fake data.

---

## 13. Explicitly Out of Scope (for this spec)

- Scaling the career catalog from ~40 seed careers to 700+ (separate, later effort once the pipeline is proven).
- Google OAuth (or any social login) — build local email/password only; revisit as a product decision later.
- A full admin panel beyond basic `careers/admin/*` CRUD.
- Native mobile apps.

---

## 14. Definition of Done (for the whole build)

- [ ] A fresh student can register, complete all 8 onboarding steps (with resume support), and receive a computed, non-default `StudentDNA`.
- [ ] `POST /recommendations/generate` produces exactly 5 ranked, explained recommendations, traceable through `eligible_count` → `shortlist` → `final_recommendations`.
- [ ] Zero AI calls occur during eligibility filtering or trait matching — verified by log inspection.
- [ ] A forced-provider-fallback test proves resilience: invalidate a primary key, confirm escalation, confirm `fallback_used: true` is logged.
- [ ] Counselor chat degrades gracefully on non-structured AI output.
- [ ] JWT never appears in `localStorage`/`sessionStorage` — verified in devtools.
- [ ] Dashboard, reports, analytics, and history all read from `StudentProfile` / `StudentDNA` / `Recommendation` only — no direct LLM calls from these modules.
- [ ] Full test suite green; Postman/API collection committed covering every endpoint in §10.
