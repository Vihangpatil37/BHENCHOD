# SCPR — Problems & Root Causes

> Scope: This document lists the problems identified from the provided browser logs, frontend/Nginx logs, backend startup logs, and the inspected project architecture.
>
> **No solutions, fixes, code, or implementation recommendations are included.**

## 1. `504 Gateway Time-out` on `/api/recommendations/regenerate`

**Root Cause:**

The request remains in the NestJS backend while the AI recommendation workflow is still processing, but the Nginx reverse proxy reaches its upstream response timeout before the backend returns the response. The backend also has a bounded global AI execution window, so the proxy and backend timeout boundaries are not aligned.

---

## 2. `504 Gateway Time-out` on `/api/counselor/chat`

**Root Cause:**

The counselor request waits for the multi-provider AI execution/retry workflow, but Nginx stops waiting for the upstream response before the NestJS request completes. The timeout is therefore occurring at the reverse-proxy layer while the backend is still processing the request.

---

## 3. AI timeout attempts consume the retry budget too quickly

**Root Cause:**

The AI retry manager uses a relatively short per-attempt timeout together with a global request deadline and multiple fallback attempts. Multiple sequential provider/model/key attempts can therefore consume most or all of the global execution window before a successful response is obtained.

---

## 4. Timeout failures are treated too broadly in the retry decision

**Root Cause:**

The retry policy associates timeout failures with key/provider rotation even though a timeout does not inherently indicate that the API key is invalid or exhausted. This conflates request latency failures with credential failures.

---

## 5. Key rotation and model/provider fallback are coupled

**Root Cause:**

The retry architecture represents provider, model, and API-key changes inside a largely linear attempt sequence. As a result, failures are not always mapped cleanly to the specific failure domain that caused them.

---

## 6. The AI route is not sufficiently task-specific

**Root Cause:**

The routing abstraction accepts a task type, but the provider/model fallback sequence is largely shared across tasks. This causes different workloads such as counselor chat, recommendations, roadmap generation, and other structured AI tasks to use substantially similar routing behavior despite having different latency and capability requirements.

---

## 7. API-key health is not represented as an independent state

**Root Cause:**

The key pool primarily provides available keys for attempts, but key lifecycle/health states such as rate-limited, temporarily unavailable, invalid, or disabled are not modeled as a durable independent health state. Consequently, the retry layer cannot fully distinguish healthy keys from keys that should be avoided temporarily or permanently.

---

## 8. Provider/model health is not independently tracked

**Root Cause:**

Provider and model failures are primarily handled as individual request failures rather than through persistent health state. Repeated failures therefore do not inherently prevent the same unhealthy provider/model from remaining part of future route selection.

---

## 9. The retry search space is larger than the configured attempt budget

**Root Cause:**

The system has multiple providers, multiple models per provider, and many API keys, creating a large possible combination space, while the retry manager has a finite maximum-attempt limit. The system can therefore stop retrying while valid provider/model/key combinations still remain unused.

---

## 10. Model configuration drift risk

**Root Cause:**

Model identifiers are supplied through environment configuration and provider-specific configuration layers. These can diverge from the model identifiers currently accepted by the corresponding provider APIs, creating model-not-found, unavailable-model, or provider rejection failures when configuration becomes stale.

---

## 11. Structured-output enforcement is split across multiple layers

**Root Cause:**

The provider request can request JSON-formatted output, while the application's actual contract enforcement happens later through parsing and schema validation. JSON formatting and exact schema compliance are therefore separate stages rather than one guaranteed provider-side contract.

---

## 12. `401 Unauthorized` on `/api/onboarding/scenarios`

**Root Cause:**

The protected onboarding endpoint is receiving a request that is not authenticated with a currently accepted access token. The most likely causes are an expired/missing access token or an authentication-state mismatch during the token/2FA flow. This is separate from the 504 AI timeout problem.

---

## 13. Authentication failures and AI failures are occurring in the same user flow

**Root Cause:**

Protected frontend requests can fail with `401` while AI-backed requests can independently fail with `504`. These are separate failure domains, but they appear together during the same application session, making the user-visible failure pattern look like one combined backend problem.

---

## 14. Recommendation generation is synchronous with the request lifecycle

**Root Cause:**

Recommendation generation can remain inside the request/event execution path while it performs AI work. Slow AI execution therefore directly extends the lifetime of the HTTP request instead of being isolated from the request-response lifecycle.

---

## 15. In-process event-driven recommendation execution is not durable

**Root Cause:**

Recommendation generation is triggered through an in-process event mechanism. The event lifecycle is therefore tied to the running NestJS process and does not provide durable delivery semantics across process restarts or multiple backend instances.

---

## 16. AI retry behavior can create unnecessary fallback traffic

**Root Cause:**

Because timeout and other transient failures can trigger additional keys, models, and providers without persistent health-aware suppression, a single slow request can fan out into many sequential upstream AI attempts.

---

## 17. Browser `startTime` TypeError

**Root Cause:**

The error originates from browser-side/DevTools performance instrumentation code (`reportAllChanges`) rather than the SCPR NestJS API or Nginx request path. It is a separate client-side instrumentation error.

---

## 18. `.env` log reports `injected env (0)` despite keys being loaded

**Root Cause:**

The dotenv loader reports that it injected zero variables from the local `.env` file, while the application still receives environment variables through the container/runtime environment. This is therefore an environment-source/configuration ambiguity rather than evidence that the provider keys are absent.

---

## 19. Reverse-proxy timeout boundary and backend AI timeout boundary are inconsistent

**Root Cause:**

The frontend request passes through Nginx before reaching NestJS, so the effective request lifetime is determined by multiple timeout layers. The observed Nginx `upstream timed out while reading response header` confirms that these layers are not using a single consistent timeout boundary.

---

## 20. The application lacks a single observable failure reason at the user request level

**Root Cause:**

A single user action can involve frontend authentication, Nginx proxying, NestJS processing, AI routing, provider/model selection, key selection, and retry behavior. Without a unified request-level failure state tying these layers together, the browser can show only a generic `401` or `504` even though the underlying failure occurred deeper in the stack.

---

# Problem Classification

| # | Problem | Primary Failure Layer | Root Cause Type |
|---:|---|---|---|
| 1 | Recommendation `504` | Nginx ↔ Backend | Timeout boundary mismatch |
| 2 | Counselor `504` | Nginx ↔ Backend | Timeout boundary mismatch |
| 3 | Retry budget exhaustion | AI orchestration | Timeout budget design |
| 4 | Timeout mapped to key rotation | AI orchestration | Failure classification |
| 5 | Key/model/provider coupling | AI orchestration | Routing state design |
| 6 | Non-task-specific routing | AI orchestration | Routing policy design |
| 7 | No independent key health state | AI orchestration | State/health tracking |
| 8 | No independent provider/model health | AI orchestration | State/health tracking |
| 9 | Large route space vs finite attempts | AI orchestration | Retry budget mismatch |
| 10 | Model configuration drift | AI configuration | Configuration consistency |
| 11 | Split structured-output enforcement | AI integration | Contract enforcement boundary |
| 12 | Onboarding `401` | Authentication | Invalid/expired/missing auth state |
| 13 | 401 + 504 in same flow | Full stack | Independent failure domains |
| 14 | Synchronous recommendation generation | Backend architecture | Request lifecycle coupling |
| 15 | In-process event execution | Backend architecture | Non-durable event delivery |
| 16 | Excess fallback traffic | AI orchestration | Health-unaware retries |
| 17 | Browser `startTime` TypeError | Browser/DevTools | Client instrumentation |
| 18 | `injected env (0)` ambiguity | Runtime configuration | Environment-source ambiguity |
| 19 | Multiple timeout boundaries | Infrastructure | Timeout configuration mismatch |
| 20 | No unified request-level failure reason | Observability | Cross-layer correlation gap |
