# SCPR — Project Workflow Diagrams

## 1. High-Level Architecture

```mermaid
graph TB
    subgraph Frontend["React 19 Frontend"]
        UI[UI Components]
        ZS[Zustand Store<br/>JWT in memory only]
        TQ[TanStack Query]
    end

    subgraph API["NestJS API Gateway"]
        MAIN[main.ts<br/>TransformInterceptor + HttpExceptionFilter]
        GUARD[JwtAuthGuard<br/>@Public decorator]
    end

    subgraph CoreModules["Core Business Modules"]
        AUTH[auth<br/>Register / Login / Refresh / Logout]
        ONBOARD[onboarding<br/>8-Step Profile Wizard]
        CAREERS[careers<br/>Career Catalog + Trait Weights]
        RECO[recommendation<br/>Eligibility + Trait Matching + AI]
        COUNS[counselor<br/>AI Chat + Rolling Summary]
        DASH[dashboard<br/>Journey State Aggregation]
        REPORTS[reports<br/>PDF Generation]
        ANALYTICS[analytics<br/>Fire-and-Forget Events]
        HISTORY[history<br/>Unified Timeline]
    end

    subgraph AIService["ai-service — Multi-LLM Orchestration"]
        CLIENT[aiService.run]
        ROUTER[router.service<br/>task_type → provider list]
        KEYPOOL[key-pool.service<br/>Key rotation per provider]
        RETRY[retry-manager.service<br/>In-provider → cross-provider fallback]
        PROMPT[prompt-builder.service<br/>.md template loading]
        JSONV[json-validator.service<br/>Validate + repair LLM output]
        CACHE[cache.service<br/>SHA-256 keyed]
        LOGGER[token-logger.service<br/>AIRequestLog]
    end

    subgraph Providers["LLM Providers"]
        GEMINI[Gemini]
        GROQ[Groq]
        MISTRAL[Mistral]
        DEEPSEEK[DeepSeek]
        GLM[GLM]
    end

    subgraph Database["MongoDB Atlas"]
        MONGO[(MongoDB)]
    end

    UI --> MAIN
    ZS -.->|JWT only| UI
    TQ -.->|server data| UI
    MAIN --> GUARD
    GUARD --> AUTH
    GUARD --> ONBOARD
    GUARD --> CAREERS
    GUARD --> RECO
    GUARD --> COUNS
    GUARD --> DASH
    GUARD --> REPORTS
    GUARD --> ANALYTICS
    GUARD --> HISTORY

    AUTH --> MONGO
    ONBOARD --> MONGO
    CAREERS --> MONGO
    RECO --> MONGO
    COUNS --> MONGO
    DASH --> MONGO
    REPORTS --> MONGO
    ANALYTICS --> MONGO
    HISTORY --> MONGO

    RECO --> CLIENT
    COUNS --> CLIENT
    CAREERS --> CLIENT
    REPORTS --> CLIENT

    CLIENT --> ROUTER
    ROUTER --> KEYPOOL
    KEYPOOL --> RETRY
    RETRY --> PROMPT
    PROMPT --> JSONV
    JSONV --> CACHE
    CACHE --> LOGGER

    RETRY --> GEMINI
    RETRY --> GROQ
    RETRY --> MISTRAL
    RETRY --> DEEPSEEK
    RETRY --> GLM

    GEMINI --> MONGO
    GROQ --> MONGO
    MISTRAL --> MONGO
    DEEPSEEK --> MONGO
    GLM --> MONGO
```

---

## 2. Recommendation Pipeline (Core Flow)

```mermaid
flowchart LR
    START([Student completes onboarding]) --> DNA[Compute StudentDNA<br/>10-dimension trait vector]

    DNA --> ELIG{Eligibility Engine<br/>Mongo Query Filter}

    ELIG -->|Pass| ELIG_RESULT["~N Eligible Careers<br/>Hard constraints checked"]
    ELIG -->|Zero matches| ZERO[Graceful Fallback<br/>Relax tightest constraint]

    ELIG_RESULT --> MATCH{Trait Matching Engine<br/>Cosine Similarity}

    MATCH --> TOP20["Top 20 Candidates<br/>Sorted by match_score"]

    TOP20 --> PAYLOAD[Build AI Payload<br/>student_profile + student_dna<br/>+ candidate_careers ≤ 20]

    PAYLOAD --> AI_CALL["Single ai-service Call<br/>career_recommendation task"]

    AI_CALL --> RANK[LLM Ranks + Explains<br/>Never invents candidates]

    RANK --> VALIDATE{JSON Validator<br/>Schema check + repair}

    VALIDATE -->|Pass| TOP5["Top 5 Final Recommendations<br/>rank, ai_score, explanation,<br/>roadmap, colleges, certs"]

    VALIDATE -->|Fail| RETRY_AI[Retry AI Call<br/>or fallback provider]

    TOP5 --> PERSIST[Persist Recommendation<br/>stale: false]
    PERSIST --> DISPLAY[Display to Student<br/>Ranked list with explanations]

    ZERO --> DISPLAY

    style DNA fill:#4a9eff,color:#fff
    style ELIG fill:#ff9f43,color:#fff
    style MATCH fill:#ff9f43,color:#fff
    style AI_CALL fill:#ee5a24,color:#fff
    style TOP5 fill:#2ecc71,color:#fff
    style ZERO fill:#e74c3c,color:#fff
```

---

## 3. Onboarding Flow (8 Steps)

```mermaid
flowchart TD
    START([POST /onboarding/start]) --> STEP1

    subgraph Steps["8-Step Guided Profile Wizard"]
        STEP1["Step 1: Personal<br/>Name, DOB, gender, city, state, board"]
        STEP2["Step 2: Academic<br/>Class 10/12 %, subjects, favorites, stream"]
        STEP3["Step 3: Interests<br/>12 sliders (0-100): tech, business, nature..."]
        STEP4["Step 4: Skills<br/>10 self-ratings (1-5): communication, leadership..."]
        STEP5["Step 5: Goals<br/>Ranked priorities: money, respect, innovation..."]
        STEP6["Step 6: Work Preferences<br/>Office, outdoor, hospital, travel, remote..."]
        STEP7["Step 7: Constraints<br/>Budget, study duration, relocation, abroad..."]
        STEP8["Step 8: Scenarios<br/>Decision-making under pressure questions"]
    end

    STEP1 -->|PUT /step/personal| STEP2
    STEP2 -->|PUT /step/academic| STEP3
    STEP3 -->|PUT /step/interests| STEP4
    STEP4 -->|PUT /step/skills| STEP5
    STEP5 -->|PUT /step/goals| STEP6
    STEP6 -->|PUT /step/work_preferences| STEP7
    STEP7 -->|PUT /step/constraints| STEP8

    STEP8 --> COMPLETE

    subgraph Completion["On Completion"]
        COMPLETE["POST /onboarding/complete"]
        TRAIT["Trait Engine<br/>Pure deterministic computation<br/>No AI calls"]
        DNA["Generate StudentDNA<br/>10 traits × 0-100"]
        HISTORY["Append StudentDNAHistory<br/>trigger: onboarding_complete"]
        TRIGGER["Emit onboardingEvents<br/>→ recommendation pipeline"]
    end

    COMPLETE --> TRAIT --> DNA --> HISTORY --> TRIGGER

    RESUME["GET /onboarding/resume<br/>Returns current step + saved data"] -.->|Interrupt & resume| Steps

    style STEP1 fill:#3498db,color:#fff
    style STEP2 fill:#3498db,color:#fff
    style STEP3 fill:#3498db,color:#fff
    style STEP4 fill:#3498db,color:#fff
    style STEP5 fill:#3498db,color:#fff
    style STEP6 fill:#3498db,color:#fff
    style STEP7 fill:#3498db,color:#fff
    style STEP8 fill:#3498db,color:#fff
    style TRAIT fill:#2ecc71,color:#fff
    style DNA fill:#2ecc71,color:#fff
```

---

## 4. ai-service Orchestration

```mermaid
flowchart TD
    CALL["aiService.run(taskType, context)"] --> CACHE_CHECK{Cache Hit?}

    CACHE_CHECK -->|Hit| RETURN["Return cached response<br/>cached: true"]
    CACHE_CHECK -->|Miss| PROMPT_BUILD

    PROMPT_BUILD["Load .md template<br/>Interpolate context"] --> ROUTE

    ROUTE["Router: task_type →<br/>ordered provider list"] --> PROVIDER_SELECT

    PROVIDER_SELECT["Select current provider<br/>+ next key from pool"] --> ATTEMPT

    ATTEMPT["Call provider REST API"] --> SUCCESS?

    SUCCESS -->|Yes| NORMALIZE["Normalize to standard shape<br/>{provider, model, data, usage}"]
    SUCCESS -->|Rate limit / timeout / error| KEY_CHECK

    KEY_CHECK{"More keys for<br/>this provider?"}
    KEY_CHECK -->|Yes| PROVIDER_SELECT
    KEY_CHECK -->|No| FALLBACK{"More providers<br/>in chain?"}

    FALLBACK -->|Yes| NEXT_PROVIDER["Escalate to next provider<br/>Emit AI_PROVIDER_FALLBACK_TRIGGERED"]
    NEXT_PROVIDER --> PROVIDER_SELECT

    FALLBACK -->|No| ERROR["Throw typed error<br/>All providers exhausted"]

    NORMALIZE --> JSON_VALIDATE{JSON Validator}
    JSON_VALIDATE -->|Valid| LOG["Log AIRequestLog<br/>tokens, latency, provider"]
    JSON_VALIDATE -->|Repairable| REPAIR["Strip fences, trim prose<br/>Retry parse"]
    JSON_VALIDATE -->|Unrecoverable| ERROR

    REPAIR --> JSON_VALIDATE
    LOG --> CACHE_STORE["Store in cache<br/>key = SHA-256 hash"]
    CACHE_STORE --> RETURN

    style CALL fill:#9b59b6,color:#fff
    style FALLBACK fill:#e74c3c,color:#fff
    style RETURN fill:#2ecc71,color:#fff
    style ERROR fill:#e74c3c,color:#fff
```

---

## 5. Module Dependency Graph

```mermaid
graph LR
    subgraph Foundation["Foundation Layer"]
        COMMON[common<br/>vector-math, guards,<br/>interceptors, guards]
        AUTH[auth<br/>JWT, User schema]
        HEALTH[health<br/>GET /health]
    end

    subgraph AIServiceLayer["AI Service Layer"]
        AI[ai-service<br/>Multi-LLM orchestration]
    end

    subgraph DataLayer["Data Layer"]
        CAREERS[careers<br/>Catalog + trait weights]
        ONBOARD[onboarding<br/>Profile + StudentDNA]
    end

    subgraph CoreEngine["Core Engine"]
        RECO[recommendation<br/>Eligibility + Matching + AI]
    end

    subgraph ConsumerModules["Consumer Modules"]
        COUNS[counselor<br/>AI chat]
        DASH[dashboard<br/>Journey aggregation]
        REPORTS[reports<br/>PDF generation]
        ANALYTICS[analytics<br/>Event tracking]
        HISTORY[history<br/>Unified timeline]
    end

    AUTH --> COMMON
    HEALTH --> COMMON
    AI --> COMMON
    CAREERS --> COMMON
    ONBOARD --> COMMON
    RECO --> COMMON
    COUNS --> COMMON
    DASH --> COMMON
    REPORTS --> COMMON
    ANALYTICS --> COMMON
    HISTORY --> COMMON

    AI --> AUTH
    CAREERS --> AI
    ONBOARD --> AUTH
    RECO --> AUTH
    COUNS --> AUTH
    DASH --> AUTH
    REPORTS --> AUTH
    HISTORY --> AUTH

    RECO --> AI
    COUNS --> AI
    CAREERS --> AI
    REPORTS --> AI

    RECO --> CAREERS
    RECO --> ONBOARD
    DASH --> ONBOARD
    DASH --> RECO
    DASH --> CAREERS
    REPORTS --> RECO
    REPORTS --> ONBOARD
    HISTORY --> ONBOARD
    HISTORY --> RECO
    HISTORY --> CAREERS

    ONBOARD -.->|event emitter| RECO

    style AI fill:#ee5a24,color:#fff
    style RECO fill:#e74c3c,color:#fff
    style ONBOARD fill:#3498db,color:#fff
    style CAREERS fill:#3498db,color:#fff
```

---

## 6. Build Phase Sequence

```mermaid
graph TD
    P0["Phase 0<br/>Project Skeleton<br/>Auth + Response Contract"]
    P1["Phase 1<br/>ai-service<br/>Multi-LLM Orchestration"]
    P2["Phase 2<br/>careers<br/>Catalog + Trait Weights"]
    P3["Phase 3<br/>onboarding<br/>8-Step Profile Wizard"]
    P4["Phase 4<br/>recommendation<br/>Eligibility + Matching + AI"]
    P5["Phase 5<br/>counselor<br/>AI Chat"]
    P6["Phase 6<br/>dashboard + reports<br/>analytics + history"]
    P7["Phase 7<br/>Frontend<br/>React 19 End-to-End"]
    P8["Phase 8<br/>Testing & QA<br/>Full Test Suite"]

    P0 --> P1
    P0 --> P2
    P1 --> P3
    P1 --> P4
    P2 --> P4
    P3 --> P4
    P4 --> P5
    P4 --> P6
    P5 --> P7
    P6 --> P7
    P7 --> P8

    style P0 fill:#2ecc71,color:#fff
    style P1 fill:#e74c3c,color:#fff
    style P2 fill:#3498db,color:#fff
    style P3 fill:#3498db,color:#fff
    style P4 fill:#e74c3c,color:#fff
    style P5 fill:#f39c12,color:#fff
    style P6 fill:#9b59b6,color:#fff
    style P7 fill:#1abc9c,color:#fff
    style P8 fill:#34495e,color:#fff
```

---

## Summary

| Diagram | What it Shows |
|---------|---------------|
| **Architecture** | Full system: frontend → API → modules → ai-service → LLM providers → MongoDB |
| **Recommendation Pipeline** | The core algorithm: Eligibility → Trait Matching → AI Personalization → Top 5 |
| **Onboarding Flow** | 8-step profile wizard with resume support and trait computation |
| **ai-service Orchestration** | Routing, key rotation, fallback chains, JSON validation, caching |
| **Module Dependencies** | Which modules import from which (enforces boundary rules) |
| **Build Phases** | Phase 0→8 execution order with dependency graph |

---

*Generated from SCPR_PROJECT_SPEC.md and SCPR_EXECUTION_PLAN.md*
