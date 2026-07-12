# SCPR — Execution Plan (Build From Scratch)

**Companion to:** `SCPR_PROJECT_SPEC.md` — read that first; this file is what you actually hand to an agent (Claude Code / Gemini / OpenCode), one phase at a time.
**Stack:** NestJS 11 + Mongoose 9 + MongoDB Atlas · React 19 + TypeScript + Vite frontend
**Scope:** Greenfield build — no legacy code, no migration, no ML pipeline to retire.

---

## How To Use This File

1. Work through phases **in order**, Phase 0 → Phase 9. Every later phase assumes the previous ones already exist in the repo.
2. Each phase is a **standalone, self-contained prompt** — select from its `## PHASE` heading to the next `---`, paste as-is into a fresh agent session.
3. Every phase repeats the non-negotiable rules on purpose — agent sessions don't carry memory between them.
4. After each phase, manually verify its **Exit Criteria** before opening the next phase's session.
5. Phase 0 sets the contract every later phase depends on (project skeleton, auth, response envelope) — don't skip or reorder it.

---

## Non-Negotiable Engineering Rules

*(This exact block appears in every phase prompt below on purpose — copy it every time.)*

- **Mongoose only.** Never a raw MongoDB driver call unless Mongoose genuinely can't express something.
- **Thin controllers.** All business logic lives in `*.service.ts`. Controllers parse the request (DTOs), call a service, shape the response.
- **JWT lives in the frontend Zustand store, in memory only.** Never `localStorage`, never `sessionStorage`.
- **Analytics must never throw.** Every event-firing call site is wrapped in try/catch that logs and swallows failures — it must never break a user-facing request.
- **The backend is the source of truth for eligibility and ranking.** Eligibility filtering and trait-match scoring are deterministic TypeScript/Mongo logic. The LLM never decides eligibility and never invents candidates — it only ranks, explains, and personalizes a list the backend already produced.
- **Never send the full career catalog to an LLM.** Every recommendation call receives a pre-filtered top-20 candidate list, never the full catalog.
- **Provider-agnostic by design.** No module outside `ai-service/` imports a provider SDK directly. Every AI call goes through `aiService.run(taskType, context)`.
- **Prompts are `.md` template files** under `ai-service/prompts/`. Never hardcode a prompt string in a `.ts` file.
- **`snake_case` on the wire, everywhere** — request bodies, response bodies, query params.
- **Scope discipline.** Touch only the files this phase names. Don't refactor, rename, or "improve" adjacent code you weren't asked to touch.

---

## PHASE 0 — Project Skeleton, Auth, Response Contract

### Context
This is the first commit of SCPR. Nothing exists yet. This phase stands up both repos, decides and locks the response envelope, and builds the only module every other module depends on: auth.

### Non-Negotiable Engineering Rules
(block above)

### Your Task
1. Scaffold `backend/` as a NestJS 11 project (TypeScript, Mongoose connected to MongoDB Atlas via `.env`). Scaffold `frontend/` as a React 19 + TypeScript + Vite project with Tailwind, Zustand, TanStack Query, and React Router installed.
2. Decide and implement the **response envelope** once, globally: build a `TransformInterceptor` that wraps every success response as `{ data, timestamp, requestId }`, register it globally in `main.ts`. Build a global `HttpExceptionFilter` producing the stable error shape:
   ```ts
   { statusCode: number; message: string; detail?: string; errors?: FieldError[]; timestamp: string; path: string; requestId: string }
   ```
3. Build `auth/` module: `User` Mongoose schema (per spec §6), register/login/refresh/logout/me endpoints, `passport-jwt` + `passport-local` strategies, a global `JwtAuthGuard` with an explicit `@Public()` decorator for routes that opt out. Passwords hashed with bcrypt/argon2. `failed_login_attempts` / `locked_until` implemented but never serialized in any response DTO.
4. Build `health/` module: `GET /health`, public.
5. Frontend: build the Axios/fetch service layer with the envelope-unwrap baked in at one place (not assumed ad hoc per call), a Zustand auth slice holding the JWT **in memory only**, and basic Login/Register pages wired end-to-end against the real backend.
6. Add root `PROGRESS.md` — after every phase from here on, append a short entry: phase, files touched, decisions made, open questions.

### Do Not
- Build any module beyond `auth` and `health` yet.
- Let the JWT touch `localStorage` or `sessionStorage` anywhere in the frontend.
- Leave the response envelope ambiguous — every response, success or error, must match one of the two shapes above, with no exceptions "for now."

### Exit Criteria (verify before starting Phase 1)
- [ ] A user can register, log in, refresh a token, hit `GET /auth/me`, and log out — full round trip, frontend to backend.
- [ ] Every response (success and error) matches the locked envelope shape.
- [ ] JWT confirmed in memory only — inspect Application storage in devtools, nothing present.
- [ ] `GET /health` returns 200 with no auth required.

---

## PHASE 1 — Build `ai-service` (Multi-LLM Orchestration Layer)

### Context
Phase 0 is done. This phase builds `ai-service`, the module every AI-consuming feature will eventually call through. It has no dependency on any other business module — build and test it in isolation with a synthetic `task_type`.

### Non-Negotiable Engineering Rules
(block above)

### Your Task
Build `backend/src/ai-service/` per spec §9:
```
ai-service/
├── ai-request-log.schema.ts
├── providers/
│   ├── provider.interface.ts     # AbstractLLMProvider
│   ├── gemini.provider.ts
│   ├── groq.provider.ts
│   ├── mistral.provider.ts
│   ├── deepseek.provider.ts
│   └── glm.provider.ts
├── key-pool.service.ts
├── router.service.ts
├── retry-manager.service.ts
├── prompt-builder.service.ts
├── prompts/
│   ├── career-recommendation.md
│   ├── roadmap-generation.md
│   ├── counselor-chat.md
│   ├── career-trait-backfill.md
│   └── report-summary.md
├── json-validator.service.ts
├── cache.service.ts
├── token-logger.service.ts
├── ai-service.schemas.ts
├── ai-service.controller.ts        # GET /ai-service/health
└── ai-service.client.ts            # aiService.run(taskType, context)
```

Implement:
- Each provider adapter normalizes its raw response into the standard shape (spec §9). This is what keeps every downstream module unaware of which provider actually answered.
- `router.service.ts` implements the routing table from spec §9 as plain config data (one-line edits, no code change to alter routing).
- `key-pool.service.ts` + `retry-manager.service.ts`: rotate keys within a provider first; escalate to the next provider only once every key for the current provider is exhausted, rate-limited, or times out.
- `prompt-builder.service.ts` loads and interpolates the `.md` templates at call time.
- `json-validator.service.ts` validates against the task's expected schema, attempts repair (strip markdown fences, trim stray prose), raises a typed error if unrecoverable.
- `cache.service.ts`: key = `hash(task_type + relevant input fields)`.
- `token-logger.service.ts` writes one `AIRequestLog` per call.
- `ai-service.client.ts`: `aiService.run(taskType: string, context: object): Promise<AIResponse>` — the single public entrypoint.
- `GET /ai-service/health` (public): pings/validates each configured provider's keys, returns a per-provider status map.

Add to `backend/.env`:
```
GROQ_API_KEYS=...,...,...
GEMINI_API_KEYS=...,...,...
MISTRAL_API_KEYS=...,...
DEEPSEEK_API_KEYS=...,...
GLM_API_KEYS=...,...
AI_SERVICE_CACHE_TTL_SECONDS=3600
AI_SERVICE_DEFAULT_TIMEOUT_MS=15000
AI_SERVICE_MAX_RETRIES_PER_PROVIDER=2
```

### Do Not
- Wire this into any business module yet — that happens starting Phase 3.
- Let any provider SDK leak outside `providers/`.
- Hardcode any prompt string in a `.ts` file.

### Exit Criteria (verify before starting Phase 2)
- [ ] `aiService.run('test_task', {...})` works end-to-end against at least 2 real providers.
- [ ] Forced-fallback test: invalidate the primary provider's key, confirm the call still succeeds via fallback, confirm `fallback_used: true` on the logged `AIRequestLog`.
- [ ] `GET /ai-service/health` correctly reports live vs. dead keys per provider.
- [ ] No module outside `ai-service/` imports a provider SDK.

---

## PHASE 2 — Build `careers` (Catalog + Trait Weights + Eligibility)

### Context
`ai-service` (Phase 1) exists and works standalone. This phase builds the static metadata every downstream engine needs. Seed catalog target: ~40 careers (the 700+ scale-up is a later, separate effort).

### Non-Negotiable Engineering Rules
(block above)

### Your Task
1. Build `careers/` module: `Career` Mongoose schema per spec §6 (`trait_weights`, `eligibility`, plus `trait_weights_draft` / `eligibility_draft` staging fields).
2. Seed ~40 careers with name, description, category, required/technical/soft skills, market demand, future scope — no trait weights or eligibility yet.
3. Add `career_trait_backfill` task type to `ai-service`'s router (reuse the "JSON extraction / re-ranking" provider chain: GLM → Gemini → Groq).
4. `careers.service.ts`: `backfillTraitWeightsForAllCareers()` — for each career, build a prompt from its existing description/skills, call `aiService.run('career_trait_backfill', {...})`, write the result into the **staging fields**, never directly into live fields. Add an admin CLI command or endpoint to review and promote a draft into live `trait_weights` / `eligibility`.
5. Public endpoints: list, categories, search, suggest, filter, `:careerCode`, `related/:careerCode`, `roadmap/:careerCode`, `by-codes`. Auth endpoints: save, saved, `saved/status/:careerId`. Admin endpoints: CRUD + backfill trigger + draft review/promote.

### Do Not
- Bulk-write ungoverned LLM output directly into live `trait_weights` / `eligibility` — always stage and review first.
- Touch `auth/` or `ai-service/` internals.
- Attempt the 700-career scale-up in this phase.

### Exit Criteria (verify before starting Phase 3)
- [ ] Every seeded `Career` has both `trait_weights` and `eligibility` populated via reviewed, promoted backfill (not left as drafts).
- [ ] Trait weights validated 0–100; numeric constraints non-negative.
- [ ] `career_trait_backfill` is routed and logs to `AIRequestLog` like any other `ai-service` call.
- [ ] Public list/search/filter endpoints work and are unauthenticated.

---

## PHASE 3 — Build `onboarding`

### Context
This phase builds the 8-step guided flow that produces `StudentProfile` and its embedded, recomputable `StudentDNA`. The student should feel like they're setting up a profile, one continuous flow — never "taking a test."

### Non-Negotiable Engineering Rules
(block above)

### Your Task
1. Build `onboarding/` module: schema, DTOs, service, controller, `onboarding-flow.service.ts` (step ordering + resume validation), `trait-engine.service.ts` (StudentDNA computation).
2. `StudentProfile` + `StudentDNA` + `StudentDNAHistory` schemas exactly per spec §6.
3. `onboarding-flow.service.ts`: step order `personal → academic → interests → skills → goals → work_preferences → constraints → scenarios`, with per-step validation and resume logic.
4. `trait-engine.service.ts`: a **pure, deterministic** function mapping `StudentProfile` fields to the 10 `StudentDNA` trait scores via a `TRAIT_SCORING_KEY: { trait_name: { source_field: weight } }` table. Every computed snapshot appends to `StudentDNAHistory` with the correct `trigger`.
5. `completion.service.ts`: on onboarding completion, trigger trait-engine computation and stub a call into `recommendation` (full wiring happens in Phase 4).
6. Endpoints: `POST /onboarding/start`, `PUT /onboarding/step/:stepKey` (one per section), `GET /onboarding/resume`, `POST /onboarding/complete` (triggers Trait Engine → StudentDNA → stub recommendation trigger), `GET /onboarding/student-dna`.

### Do Not
- Touch `recommendation/`, `careers/`, `ai-service/`, `dashboard/`, `reports/`, `analytics/`, `history/`.
- Fully wire the recommendation trigger — a stub call is enough.
- Call any LLM from this module — trait computation is pure code.

### Exit Criteria (verify before starting Phase 4)
- [ ] A fresh user completes every onboarding step in sequence via the API and receives a computed, non-default `StudentDNA` on completion.
- [ ] Interrupting mid-flow and calling `GET /onboarding/resume` correctly returns the current step and previously saved data.
- [ ] Every completed onboarding appends one `StudentDNAHistory` entry with `trigger: "onboarding_complete"`.
- [ ] Zero AI calls occur anywhere in this module — verified by log inspection.

---

## PHASE 4 — Build `recommendation`

### Context
`ai-service` (Phase 1) and `onboarding` (Phase 3) both exist. This is the phase that actually implements the deterministic Eligibility Engine and Trait Matching Engine, then makes exactly one `ai-service` call to turn the top 20 into a ranked, explained top 5.

### Non-Negotiable Engineering Rules
(block above)

### Your Task
1. Build `recommendation/` module: `Recommendation` + `RecommendationFeedback` schemas per spec §6.
2. `eligibility-engine.service.ts` — pure rule-based filtering, pushed into the **Mongo query itself** (never loaded into memory first and filtered in JS):
   ```ts
   this.careerModel.find({
     'eligibility.min_maths': { $lte: student.academic.subjects.maths },
     'eligibility.min_science': { $lte: student.academic.subjects.science },
     'eligibility.max_budget_tier': { $gte: student.constraints.budget_tier },
     'eligibility.min_study_duration_years': { $lte: student.constraints.study_duration_max },
   });
   ```
3. `trait-matching-engine.service.ts` — weighted cosine similarity between `StudentDNA` and each eligible `Career.trait_weights`, sorted descending, top 20 kept. Put shared vector math in `common/vector-math.ts` (no ML library — plain TS).
4. `recommendation.service.ts` — orchestration, triggered on onboarding completion or `POST /recommendations/regenerate`:
   - Eligibility Engine → Trait Matching Engine.
   - Build the payload (never more than top 20) per spec §8.
   - Call `aiService.run('career_recommendation', payload)`.
   - Validate via `json-validator.service.ts` before trusting it.
   - Persist top 5 into `final_recommendations`, plus `ai_provider_used`, `ai_model_used`, `fallback_used`, `generated_at`, `stale: false`.
5. `ai-service/prompts/career-recommendation.md`: instruct the model to rank only from provided candidates, never invent a career outside the list, return strict JSON, explain each pick using the student's actual profile signals.
6. Staleness: any profile-relevant field change (hook from `onboarding` update paths) marks the latest `Recommendation.stale = true`. `POST /recommendations/regenerate` re-runs the full pipeline and clears it.
7. Endpoints: `POST /recommendations/generate`, `GET /recommendations/latest`, `POST /recommendations/regenerate`, `POST /recommendations/feedback`.

### Do Not
- Load the full career catalog into memory before filtering — the Eligibility Engine's filter must run as a Mongo query.
- Send more than the top 20 candidates to the LLM.
- Call any AI provider directly — only through `aiService.run(...)`.

### Exit Criteria (verify before starting Phase 5)
- [ ] End-to-end run: onboarding complete → eligibility filter → trait matching → one `ai-service` call → 5 stored, ranked, explained recommendations.
- [ ] The full run is timed and logged into `AIRequestLog`.
- [ ] `stale: true` correctly triggers after a profile-relevant change, and `regenerate` clears it.
- [ ] Confirmed by log inspection: exactly one AI call per recommendation generation, receiving ≤20 candidates.

---

## PHASE 5 — Build `counselor`

### Context
`ai-service` exists and is proven (Phases 1 and 4). This phase builds open-ended AI chat, routed entirely through the shared orchestration layer.

### Non-Negotiable Engineering Rules
(block above)

### Your Task
1. Build `counselor/` module: `Conversation` + `ConversationMessage` schemas per spec §6.
2. `context-builder.service.ts`: assembles chat context from recent messages + a rolling summary (summarize and compress once history grows past a threshold, rather than sending unbounded history every call).
3. `counselor.service.ts`: calls `aiService.run('counselor_chat', context)` — no direct provider SDK usage anywhere in this module.
4. Add a basic intent classification step (e.g., "career question" vs "general chat" vs "roadmap question") to help shape the prompt, kept simple in this first build.
5. Post-process every AI response with a safety filter before returning it to the client, regardless of which provider answered.
6. Endpoints: `POST /counselor/chat`, `GET /counselor/conversations`, `GET /counselor/conversations/:id`, `POST /counselor/feedback`, `POST /counselor/regenerate`.

### Do Not
- Import a provider SDK directly in `counselor/`.
- Send unbounded conversation history to the LLM on every call — use the rolling summary.

### Exit Criteria (verify before starting Phase 6)
- [ ] A multi-turn conversation persists correctly and the rolling summary keeps context bounded as history grows.
- [ ] `AIRequestLog` shows entries with `task_type: "counselor_chat"`.
- [ ] Forced-fallback test (invalidate the primary Groq key) proves resilience per the routing table.

---

## PHASE 6 — Build `dashboard`, `reports`, `analytics`, `history`

### Context
`onboarding` and `recommendation` (Phases 3–4) are live. This phase builds the remaining consumer modules — no new engines, just aggregation and read paths over data that already exists.

### Non-Negotiable Engineering Rules
(block above)

### Your Task
1. `dashboard/`: `GET /dashboard` — aggregates user info, journey state (`Login → Onboarding → Recommendation → Career Explorer`), onboarding %, recommendation availability/staleness, saved careers count/recent. Decide explicitly (and document in `PROGRESS.md`) whether `next_action`/`ai_insight` are computed server-side or left as a client-side heuristic — don't leave it ambiguous.
2. `reports/`: `Report` schema, PDF generation (Puppeteer or `pdfmake`) pulling from `StudentDNA` + `Recommendation.final_recommendations`. Endpoints: generate, `status/:reportId`, `download/:reportId`, history. Status enum: `QUEUED | GENERATING | READY | DOWNLOADED | FAILED`.
3. `analytics/`: `AnalyticsEvent` schema, an `event()` firing function wrapped in try/catch everywhere it's called (log and swallow on failure — never break the calling request). Event types include `ONBOARDING_STARTED`, `ONBOARDING_STEP_COMPLETED`, `ONBOARDING_COMPLETED`, `AI_PROVIDER_FALLBACK_TRIGGERED` (fired whenever `retry-manager` escalates across providers). Endpoints: `me`, `platform` (admin), `careers` (admin), `ai` (admin), `event`.
4. `history/`: `GET /history?type=all|careers|recommendations|onboarding`, paginated, sourced from onboarding milestones, recommendation generations, and saved careers.

### Do Not
- Modify `onboarding/`, `recommendation/`, `ai-service/`, or `counselor/` internals — this phase only consumes their outputs.
- Let an analytics failure ever propagate into a user-facing error response.

### Exit Criteria (verify before starting Phase 7)
- [ ] Dashboard renders correctly for a fresh user with zero onboarding progress and for a user with full data.
- [ ] Report PDF generates successfully end-to-end from real `StudentDNA` + `Recommendation` data.
- [ ] `AI_PROVIDER_FALLBACK_TRIGGERED` and all onboarding events appear correctly in analytics.
- [ ] History returns correct, paginated results for all 4 `type` filters.

---

## PHASE 7 — Build the Frontend

### Context
The backend (Phases 0–6) is fully built and verified. This phase builds the React 19 frontend end-to-end against the real API — no mock data, no invented endpoints.

### Non-Negotiable Engineering Rules
(block above — JWT-in-memory-only is especially load-bearing here)

### Your Task
1. Auth pages: register, login, forgot/reset password, `me`-gated route protection.
2. Onboarding wizard: one page per step, matching `onboarding-flow.service.ts`'s order exactly — personal, academic, interests (sliders), skills (1–5 ratings), goals (ranking), work preferences, constraints, scenarios. Resume support via `GET /onboarding/resume`.
3. Student DNA visualization: radar/spider chart of the 10 traits, shown post-onboarding and reusable on the dashboard.
4. Recommendation display: top 5 careers ranked, each with explanation, roadmap, suggested colleges/certifications, save action, and a visible "stale — regenerate" state when `Recommendation.stale === true`.
5. Career explorer: list/search/filter against `/careers`, detail pages, related careers, saved careers.
6. Counselor chat UI: renders structured replies when present, falls back to plain markdown rendering when the AI reply isn't valid structured JSON — never a broken or empty bubble.
7. Dashboard, reports (generate/download/history), and history (4 filter tabs) screens.
8. Zustand store slices per domain (auth in memory only; onboarding draft state; UI state). TanStack Query cache keys per endpoint, matching the backend's response shapes exactly (`snake_case` field names preserved, `career_code` as the stable identifier everywhere — no parallel `id` usage).
9. Apply the accessibility floor consistently: reduced-motion handling, keyboard navigation, ARIA on step indicators — across every wizard step and every new screen.

### Do Not
- Introduce any browser storage for the JWT.
- Invent a client-side stub for data the backend doesn't actually expose — if a screen needs something missing, note it in `PROGRESS.md` under open questions rather than fabricating it.

### Exit Criteria (verify before starting Phase 8)
- [ ] Full journey — register → onboard (all 8 steps, with a mid-flow interrupt-and-resume) → recommendations → counselor → report → history — works end-to-end against the real backend.
- [ ] No console errors from missing/mismatched fields.
- [ ] JWT confirmed in memory only (devtools Application storage — nothing present).
- [ ] Counselor chat renders gracefully on a forced non-structured AI reply (test by temporarily breaking the schema).

---

## PHASE 8 — Testing & QA

### Context
This phase locks in confidence with an explicit, committed test suite and API collection covering the whole system end-to-end.

### Non-Negotiable Engineering Rules
(block above)

### Your Task
Add `project-testing/` covering:
1. **Full onboarding sequence + resume** — complete every step in order; interrupt and resume mid-flow; confirm `StudentDNA` computes correctly on completion.
2. **Eligibility edge case — zero eligible careers.** Decide and implement one explicit graceful fallback (relax the tightest constraint one notch and retry, or return a clear "no matches, here's why" response) — pick one, document the choice in code comments, and test it.
3. **Forced provider fallback** — invalidate a primary provider's key in a test `.env`, confirm the router escalates correctly, confirm `AI_PROVIDER_FALLBACK_TRIGGERED` fires, confirm `fallback_used: true` is logged.
4. **Cache hit/miss** — a `regenerate` call with an unchanged profile returns `cached: true`; a genuinely new input produces a cache miss.
5. **JSON validator** — unit tests against malformed LLM output: missing fields, prose wrapped around JSON, markdown-fence conventions that differ per provider.
6. **Response envelope contract test** — every endpoint's success and error responses conform to the shapes locked in Phase 0.

Also commit a Postman (or equivalent) collection covering every endpoint from the module table in spec §10.

### Do Not
- Modify application code to make tests pass artificially — if a test reveals a real bug, fix the underlying module, not the test.

### Exit Criteria
- [ ] Full test suite green.
- [ ] Postman/API collection committed, covering every endpoint.
- [ ] The zero-eligible-careers fallback is documented in code comments and covered by a test.
- [ ] `PROGRESS.md` has one entry per phase, 0 through 8, each with files touched and decisions made.

---

## Appendix — Quick Reference

**Env vars** (`backend/.env`):
```
MONGODB_URI=...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
GROQ_API_KEYS=gsk_key1,gsk_key2,gsk_key3
GEMINI_API_KEYS=...,...,...
MISTRAL_API_KEYS=...,...
DEEPSEEK_API_KEYS=...,...
GLM_API_KEYS=...,...
AI_SERVICE_CACHE_TTL_SECONDS=3600
AI_SERVICE_DEFAULT_TIMEOUT_MS=15000
AI_SERVICE_MAX_RETRIES_PER_PROVIDER=2
```

**Module build order and why:** `auth` → `ai-service` → `careers` → `onboarding` → `recommendation` → `counselor` → `dashboard/reports/analytics/history` → `frontend` → `testing`. Each module in this order only depends on modules already built — no forward references, no circular waiting.
