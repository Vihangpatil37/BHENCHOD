# SCPR — Progress Log

## Phase 0 — Project Skeleton, Auth, Response Contract
### Date
2026-07-11

### Files Touched
- `backend/src/main.ts`
- `backend/src/app.module.ts`
- `backend/src/common/interceptors/transform.interceptor.ts`
- `backend/src/common/filters/http-exception.filter.ts`
- `backend/src/health/health.controller.ts`
- `backend/src/health/health.module.ts`
- `backend/src/auth/schemas/user.schema.ts`
- `backend/src/auth/dto/register.dto.ts`
- `backend/src/auth/dto/login.dto.ts`
- `backend/src/auth/decorators/public.decorator.ts`
- `backend/src/auth/guards/jwt-auth.guard.ts`
- `backend/src/auth/strategies/jwt.strategy.ts`
- `backend/src/auth/auth.service.ts`
- `backend/src/auth/auth.controller.ts`
- `backend/.env`
- `frontend/vite.config.ts`
- `frontend/src/index.css`
- `frontend/src/App.css`
- `frontend/src/store/authStore.ts`
- `frontend/src/api/client.ts`
- `frontend/src/pages/Login.tsx`
- `frontend/src/pages/Register.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/App.tsx`

### Decisions Made
1. **Scaffolding:** Scaffolded backend as NestJS 11 and frontend as React 19 + TypeScript + Vite.
2. **Response Envelope:** Built global `TransformInterceptor` wrapping success as `{ data, timestamp, requestId }` and `HttpExceptionFilter` wrapping error as `{ statusCode, status_code, message, detail, errors, timestamp, path, requestId, request_id }` supporting both casing conventions to satisfy multiple spec instructions and prevent client breakage.
3. **In-Memory JWT Store:** Used Zustand to store both `accessToken` and `refreshToken` in memory only on the frontend. Standard browser storages (localStorage, sessionStorage) are completely bypassed.
4. **Silent Access Token Refresh:** Configured frontend axios client interceptor to catch 401s, request a new access token using the stored refresh token, and retry the failed request dynamically.
5. **Global Auth Guard:** Registered `JwtAuthGuard` globally in `AppModule` with an explicit `@Public()` decorator to bypass auth checks for health and public endpoints.
6. **Failed Attempt Lockout:** Implemented login failed attempts counter and a 15-minute lock when consecutive errors exceed 5.

### Open Questions
None. Exit criteria for Phase 0 are fully satisfied.

## Phase 1 — Build `ai-service` (Multi-LLM Orchestration Layer)
### Date
2026-07-11

### Files Touched
- `backend/nest-cli.json`
- `backend/src/app.module.ts`
- `backend/src/ai-service/ai-request-log.schema.ts`
- `backend/src/ai-service/providers/provider.interface.ts`
- `backend/src/ai-service/providers/gemini.provider.ts`
- `backend/src/ai-service/providers/groq.provider.ts`
- `backend/src/ai-service/providers/mistral.provider.ts`
- `backend/src/ai-service/providers/deepseek.provider.ts`
- `backend/src/ai-service/providers/glm.provider.ts`
- `backend/src/ai-service/key-pool.service.ts`
- `backend/src/ai-service/router.service.ts`
- `backend/src/ai-service/retry-manager.service.ts`
- `backend/src/ai-service/prompt-builder.service.ts`
- `backend/src/ai-service/prompts/career-recommendation.md`
- `backend/src/ai-service/prompts/roadmap-generation.md`
- `backend/src/ai-service/prompts/counselor-chat.md`
- `backend/src/ai-service/prompts/career-trait-backfill.md`
- `backend/src/ai-service/prompts/report-summary.md`
- `backend/src/ai-service/prompts/test-task.md`
- `backend/src/ai-service/json-validator.service.ts`
- `backend/src/ai-service/cache.service.ts`
- `backend/src/ai-service/token-logger.service.ts`
- `backend/src/ai-service/ai-service.schemas.ts`
- `backend/src/ai-service/ai-service.controller.ts`
- `backend/src/ai-service/ai-service.client.ts`
- `backend/src/ai-service/ai-service.module.ts`

### Decisions Made
1. **REST-based Providers:** Created lightweight, SDK-free provider adapters (`gemini`, `groq`, `mistral`, `deepseek`, `glm`) using `axios` requests to REST endpoints, keeping the project light and eliminating dependency conflicts.
2. **Provider Key Rotation:** Programmed `KeyPoolService` to load comma-separated strings of keys from the environment variables, rotating them index-by-index before escalating.
3. **Escalation & Fallback:** Built `RetryManagerService` to exhaust keys per provider before moving to fallback providers sequentially based on the routing table.
4. **Local Event Emission:** Integrated local event bus emission (`AI_PROVIDER_FALLBACK_TRIGGERED`) when provider escalation is fired, allowing Phase 6 analytics to intercept it without modifying the core AI layer.
5. **Prompt Templates:** Added prompt template loading using `.md` files under `ai-service/prompts/` and configured Nest CLI compiler assets in `nest-cli.json` to bundle markdown files automatically during production builds.
6. **Robust JSON Parsing/Repair:** Created `JsonValidatorService` to isolate JSON structures from mixed prose, clean markdown fences, parse the JSON, and validate against custom schemas.
7. **Cache & Log persistency:** Developed cache service keyed with SHA-256 context hashes and token logging mapped to `AIRequestLog` collection in MongoDB.

### Open Questions
None. Exit criteria for Phase 1 are fully satisfied.

## Phase 2 — Build `careers` (Catalog + Trait Weights + Eligibility)
### Date
2026-07-11

### Files Touched
- `backend/src/app.module.ts`
- `backend/src/careers/schemas/career.schema.ts`
- `backend/src/careers/schemas/saved-career.schema.ts`
- `backend/src/careers/dto/career.dto.ts`
- `backend/src/careers/careers.service.ts`
- `backend/src/careers/careers.controller.ts`
- `backend/src/careers/careers.module.ts`

### Decisions Made
1. **Catalog Model:** Built the Mongoose `Career` schema containing active `trait_weights` and `eligibility` gates alongside their corresponding staging `_draft` fields for admin reviews.
2. **Deterministic Seed Catalog:** Populated exactly 40 seed careers across 8 sectors (technology, finance, healthcare, design, social, engineering, research, media) with realistic, non-zero trait weights and constraints. If the database detects old placeholders (trait weights equal to 0), it wipes and updates with realistic weights to support subsequent matching tasks.
3. **Draft Promotion Workflow:** Implemented draft backing mechanisms where the LLM backfills into staging fields, requiring an explicit admin `promoteDraft` call to push them to live.
4. **Saved Career Bookmarks:** Built a separate `saved_careers` collection to manage student bookmarks dynamically, returning save status and lists without bloating the core profiles schema.
5. **Backfill Routing Integration:** Integrated `career_trait_backfill` task routing into the AI service client with primary GLM and fallbacks to Gemini and Groq.

### Open Questions
None. Exit criteria for Phase 2 are fully satisfied.

## Phase 3 — Build `onboarding`
### Date
2026-07-11

### Files Touched
- `backend/src/app.module.ts`
- `backend/src/onboarding/schemas/student-profile.schema.ts`
- `backend/src/onboarding/schemas/student-dna-history.schema.ts`
- `backend/src/onboarding/dto/onboarding-step.dto.ts`
- `backend/src/onboarding/trait-engine.service.ts`
- `backend/src/onboarding/onboarding-flow.service.ts`
- `backend/src/onboarding/onboarding.service.ts`
- `backend/src/onboarding/onboarding.controller.ts`
- `backend/src/onboarding/onboarding.module.ts`

### Decisions Made
1. **Dynamic Step Validation:** Implemented programmatic step-by-step validator check in `OnboardingController` using class-validator and class-transformer dynamically inside a single `PUT /onboarding/step/:stepKey` endpoint, resolving key schemas cleanly.
2. **Resumable Profile State:** Coded sequence validation in `OnboardingFlowService` mapping transition gates (personal -> academic -> interests -> skills -> goals -> work_preferences -> constraints -> scenarios) with mid-flow resume capability.
3. **Pure Deterministic Trait Engine:** Developed a 10-dimensional vector trait engine mapping subjects, interests, and skills, combined with heavy scenario impact mappings to produce the finalized `StudentDNA` scores.
4. **Append-Only DNA Logs:** Built `student_dna_histories` schema to log DNA snapshots on completion with trigger markers, preserving history for future dashboard metrics.
5. **Phase 4 Integration Hooks:** Established standard event listeners (`onboardingEvents.emit`) upon onboarding completion, allowing the recommendation pipeline to trigger smoothly.

### Open Questions
None. Exit criteria for Phase 3 are fully satisfied.

## Phase 4 — Build `recommendation`
### Date
2026-07-11

### Files Touched
- `backend/src/app.module.ts`
- `backend/src/common/vector-math.ts`
- `backend/src/recommendation/schemas/recommendation.schema.ts`
- `backend/src/recommendation/schemas/recommendation-feedback.schema.ts`
- `backend/src/recommendation/dto/recommendation.dto.ts`
- `backend/src/recommendation/eligibility-engine.service.ts`
- `backend/src/recommendation/trait-matching-engine.service.ts`
- `backend/src/recommendation/recommendation.service.ts`
- `backend/src/recommendation/recommendation.controller.ts`
- `backend/src/recommendation/recommendation.module.ts`
- `backend/src/onboarding/onboarding-flow.service.ts`
- `backend/src/onboarding/onboarding.service.ts`

### Decisions Made
1. **DB-driven Filtering:** Implemented pure rule-based hard gates directly within the MongoDB database layer in `EligibilityEngineService` rather than pulling datasets into memory.
2. **Plain TS Vector Math:** Created custom multi-dimensional weighted cosine similarity calculations in `vector-math.ts` without relying on bulky external dependencies.
3. **Decoupled Event Orchestration:** Decoupled `Onboarding` and `Recommendation` using Node event emitters. Onboarding completion triggers automatic recommendation generation, and onboarding edit events trigger staleness toggles.
4. **Editable Completed Profiles:** Modified state validations to allow completed profile editing on any step without forcing sequence lockouts, correctly managing step progression indicators.
5. **AI Personalization Interface:** Configured single routed AI pipeline using candidate constraints and user signals, validating schema alignment before final persistence.

### Open Questions
None. Exit criteria for Phase 4 are fully satisfied.

## Phase 5 — Build `counselor`
### Date
2026-07-11

### Files Touched
- `backend/src/app.module.ts`
- `backend/src/counselor/schemas/conversation.schema.ts`
- `backend/src/counselor/schemas/conversation-message.schema.ts`
- `backend/src/counselor/dto/chat.dto.ts`
- `backend/src/counselor/context-builder.service.ts`
- `backend/src/counselor/counselor.service.ts`
- `backend/src/counselor/counselor.controller.ts`
- `backend/src/counselor/counselor.module.ts`
- `backend/src/ai-service/prompts/counselor-chat.md`

### Decisions Made
1. **Conversation History Summarization:** Built the `ContextBuilderService` to compress history and store it as a rolling summary on the `Conversation` collection whenever a dialogue thread exceeds 10 messages, reducing token payload.
2. **Strict Career Boundaries:** Modified `counselor-chat.md` to prevent the model from suggesting careers outside the matched top 20 list.
3. **Intent Classification & Post-Processing:** Coded a basic text-based intent classifier mapping questions to routes (roadmap vs career vs general) and wired a post-processing safety filter to block/moderate flagged vocabulary.
4. **Thin Controller Chat Orchestration:** Designed thin controller routes supporting single-point chat (creating conversations on the fly if needed), list retrieval, message history, feedback captures, and last message regenerations.

### Open Questions
None. Exit criteria for Phase 5 are fully satisfied.

## Phase 6 — Build `dashboard`, `reports`, `analytics`, `history`
### Date
2026-07-11

### Files Touched
- `backend/src/app.module.ts`
- `backend/src/dashboard/dashboard.service.ts`
- `backend/src/dashboard/dashboard.controller.ts`
- `backend/src/dashboard/dashboard.module.ts`
- `backend/src/reports/schemas/report.schema.ts`
- `backend/src/reports/reports.service.ts`
- `backend/src/reports/reports.controller.ts`
- `backend/src/reports/reports.module.ts`
- `backend/src/analytics/schemas/analytics-event.schema.ts`
- `backend/src/analytics/analytics.service.ts`
- `backend/src/analytics/analytics.controller.ts`
- `backend/src/analytics/analytics.module.ts`
- `backend/src/history/history.service.ts`
- `backend/src/history/history.controller.ts`
- `backend/src/history/history.module.ts`
- `backend/src/onboarding/onboarding.service.ts`

### Decisions Made
1. **Server-side Insights:** Explicitly chose to compute the dashboard `next_action` state machine and `ai_insight` trait mappings server-side for simplified client layouts.
2. **Lightweight PDF Generation:** Installed and configured `pdfmake` inside `ReportsService` with standard PostScript Helvetica fonts, guaranteeing 100% network-independent PDF generation without requiring Puppeteer/Chrome environments.
3. **Decoupled Analytics via Emitters:** Hooked `AnalyticsService` event capturing to standard onboarding completion and AI fallback triggers. Wrapped analytic event writes inside fail-safe try/catch statements so analytics logging failures are swallowed and never throw to the user.
4. **Unified Chronological History Feed:** Developed paginated MongoDB aggregations in `HistoryService` that merge onboarding milestones, recommendations, and saved bookmarks into a single timestamp-sorted stream.

### Open Questions
None. Exit criteria for Phase 6 are fully satisfied.
