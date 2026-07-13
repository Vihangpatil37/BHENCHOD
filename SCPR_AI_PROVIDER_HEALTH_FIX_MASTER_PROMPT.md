# SCPR — AI Provider Configuration Audit & Fix
## Master Execution Prompt for Autonomous Coding Agent

> Feed this to the coding agent one phase at a time. Phase 0 is diagnosis only —
> confirm the actual failure mode for each provider before touching config, since
> "model not found" and "wrong API version" and "out of balance" all look similar
> in logs but need different fixes.

---

## 0. Context

Current provider health, per the last status check:

| Provider | Status | Symptom |
|---|---|---|
| GLM | Broken | Model not found |
| Gemini | Partially broken | "Gemini 1.5 Flash not found for v1beta API" — but the tech stack docs say `gemini-2.5-pro` / `gemini-2.5-flash`. Those are different model strings. |
| DeepSeek | Broken | Insufficient balance |
| Groq | Degraded | TPD (tokens-per-day) limit hit, "mitigated" |
| Mistral | Apparently healthy | No reported issue |

That's roughly **2 of 5 providers actually healthy**. The project's design assumes
provider-agnostic resilience ("swap one module, not the whole system"), but the
routing table means specific task types are exposed:

- `career_trait_backfill`: GLM → Gemini → Groq — **2 of 3 links currently broken**,
  which is the confirmed root cause of the backfill run stalling on Groq's TPD cap
- `career_recommendation` / `roadmap_generation`: Gemini → DeepSeek → Groq —
  **2 of 3 links currently broken**, meaning the actual student-facing
  recommendation pipeline is one Groq outage away from failing outright, silently

This master prompt fixes the specific broken configs, but more importantly, makes
this class of failure **loud and immediately visible** next time, instead of
something that's only discovered when a batch job stalls at 89%.

---

## 1. Hard Rules

1. **Scope:** `ai-service/providers/*.provider.ts`, provider config/env handling,
   a new centralized model-config file, `ai-service.controller.ts`'s health
   endpoint, and a startup validation check. Do not touch
   `json-validator.service.ts` (separate, already-scoped fix), `prompt-builder.service.ts`,
   or `cache.service.ts`.
2. **Never guess a model identifier.** For each provider, verify the current valid
   model name against that provider's official docs or a live list-models API call
   before writing it into config. If you cannot verify (no network access, docs
   ambiguous), **flag it explicitly as unverified** in your report rather than
   guessing a plausible-looking string — that's exactly how the current bug likely
   happened.
3. **No secrets in code.** API keys stay in env vars — this should already be true;
   confirm it, don't assume it.
4. **DeepSeek's balance is a human action item, not a code bug.** You cannot top up
   an account. Your job is to (a) confirm it's genuinely a billing issue and not a
   misconfigured key/endpoint masquerading as one, and (b) make the failure detected
   and handled gracefully — not to "fix" the balance.
5. **Model identifiers live in one place.** No provider adapter should have a model
   string hardcoded inline after this fix — all of them read from a single config
   file. This is the actual fix for "this keeps happening quietly": one file to
   check, not five files to grep.
6. **Checkpoint after each phase.**

---

## 2. Phase 0 — Diagnose Each Provider (read-only, no code changes)

**Files this phase may touch:** none.

1. `grep -rn "1.5\|glm-4\|gemini-\|deepseek-\|mixtral\|llama" ai-service/providers/`
   — find every hardcoded model string across all five provider files. List them
   verbatim against what the tech stack docs claim is configured.
2. **GLM**: reproduce the "model not found" error. Capture the exact model
   identifier currently being sent and the exact error response. Check whether
   the SDK/API version in use matches the model naming convention it expects
   (provider APIs sometimes rename models between API versions).
3. **Gemini**: capture the exact model string being sent *and* the API base
   path/version (`v1beta` vs `v1`) in the actual outgoing request — not just what's
   in a config comment. Check the installed Gemini client library version against
   what the `gemini-2.5-*` model family requires; an outdated SDK is a common
   cause of "model not found" even when the model name itself is typed correctly.
4. **DeepSeek**: capture the exact error response body/code. Confirm it says
   something like `insufficient_quota` / `insufficient_balance` / HTTP 402 —
   distinguishing this from a misconfigured API key or wrong endpoint (which would
   show a different error, e.g. 401/404).
5. **Groq**: document current TPD limit, current usage pattern that hit it, and
   how many API keys are currently in the Groq key pool (check `key-pool.service.ts`
   config). A single-key pool hitting TPD is a different problem than a five-key
   pool hitting it.
6. **Mistral**: run one live low-cost test call end to end. Confirm it's actually
   fine — don't just trust the absence of a reported issue.

**Checkpoint — report a diagnosis table (provider, exact error, root cause
category: wrong model string / wrong API version / outdated SDK / billing /
rate limit / key pool size) before proceeding to Phase 1.**

---

## 3. Phase 1 — Centralize Model Configuration

**Files this phase may touch:** new `ai-service/config/provider-models.config.ts`,
each `ai-service/providers/*.provider.ts` (to consume the new config instead of
inline strings).

Create one config object, keyed by provider, listing:

```typescript
{
  gemini: {
    model: string;           // verified per Phase 0
    api_version: string;     // e.g. "v1" — verified, not assumed
    sdk_min_version: string; // documented minimum client library version
  },
  glm: { model: string; api_base: string; },
  deepseek: { model: string; },
  groq: { model: string; },
  mistral: { model: string; },
}
```

Refactor every provider adapter to import from this file. No provider file should
contain a literal model-name string after this phase.

### Definition of Done — Phase 1
- [ ] Single config file is the only source of model identifiers
- [ ] All five provider adapters refactored to consume it
- [ ] `grep` for model strings outside this config file returns nothing

**Checkpoint.**

---

## 4. Phase 2 — Fix Each Broken Provider

**Files this phase may touch:** `provider-models.config.ts`, individual provider
adapter files, `package.json` (if an SDK version bump is needed).

- **GLM**: correct the model identifier and/or endpoint per Phase 0 findings.
- **Gemini**: correct the model identifier *and* API version path. If the SDK is
  outdated, bump it and confirm the upgrade doesn't break the existing
  `gemini.provider.ts` call shape (test against a live call, not just a version
  bump and hope).
- **DeepSeek**: if Phase 0 confirmed this is genuinely a billing issue, do not
  attempt a code fix — see Phase 3 for making this fail gracefully instead. If
  Phase 0 found it's actually a misconfigured key/endpoint disguised as a billing
  error, fix that.
- **Groq**: no functional bug to fix, but if the key pool is thin (1–2 keys),
  report this as a durability recommendation — a wider key pool is the actual
  long-term fix for TPD limits, not something this phase can fabricate on its own
  (needs human-provided keys).
- **Mistral**: no change expected; confirm and move on.

### Definition of Done — Phase 2
- [ ] GLM live test call succeeds
- [ ] Gemini live test call succeeds on the corrected model + API version
- [ ] DeepSeek confirmed as billing-only (or fixed, if it was config)
- [ ] Groq key pool size documented with a recommendation if thin
- [ ] Mistral confirmed healthy

**Checkpoint.**

---

## 5. Phase 3 — Fail-Fast Detection & Real Health Checks

This is the part that prevents this whole situation from recurring silently.

**Files this phase may touch:** `ai-service.controller.ts` (health endpoint),
`retry-manager.service.ts` or `key-pool.service.ts` (whichever cleanly owns
per-provider state — inspect both before choosing).

1. **Billing/quota fail-fast.** Add detection for quota-exhausted error signatures
   (HTTP 402, `insufficient_quota`, `insufficient_balance`, or provider-specific
   equivalents found in Phase 0). On this signal, mark that provider's keys as
   exhausted **immediately** and skip further retry attempts against it for the
   remainder of that request — escalate to the next fallback provider right away
   instead of burning retry budget against something that will not recover until
   a human intervenes.
2. **Real health checks, not just "is the API key present."** Enhance
   `GET /api/ai-service/health` to perform a lightweight live check per provider —
   a minimal test call or the provider's own models/health endpoint where one
   exists — cached with a short TTL (e.g. 5 minutes) so this doesn't fire a live
   call on every health-check request. Return per-provider status, not just an
   overall boolean.
3. **New analytics event.** Emit `AI_PROVIDER_UNHEALTHY_DETECTED` (distinct from
   the existing `AI_PROVIDER_FALLBACK_TRIGGERED`) the first time a provider is
   detected unhealthy, so `/analytics/ai` can surface "provider X has been down
   since Y" instead of this being invisible until someone notices a stalled batch
   job.

### Definition of Done — Phase 3
- [ ] Quota-exhausted errors short-circuit retries within that provider
- [ ] `/api/ai-service/health` reports real per-provider live status, cached
- [ ] `AI_PROVIDER_UNHEALTHY_DETECTED` event wired and visible in `/analytics/ai`

**Checkpoint.**

---

## 6. Phase 4 — Startup Validation

**Files this phase may touch:** `ai-service.module.ts` or `main.ts` (wherever
app bootstrap logic lives).

On app boot, validate every provider+model combination in
`provider-models.config.ts`: confirm the required env var is present and
plausibly formed. If a provider that's configured as **Primary** for any task
type in the routing table is missing its API key, **log a clear, loud warning at
startup** — don't wait for the first real request to discover it silently three
weeks later.

### Definition of Done — Phase 4
- [ ] Startup check runs on boot, logs clearly for any missing Primary-provider key
- [ ] Does not block app startup (log and continue — this is a warning, not a crash)

---

## 7. Final Summary Checklist

- [ ] Phase 0: diagnosis table complete, root cause confirmed per provider
- [ ] Phase 1: model config centralized, no inline strings remain
- [ ] Phase 2: GLM + Gemini fixed and live-tested; DeepSeek confirmed billing-only; Groq pool documented
- [ ] Phase 3: fail-fast quota detection + real health endpoint + new analytics event
- [ ] Phase 4: startup validation logs missing Primary-provider keys loudly

---

## 8. Human Action Items (agent cannot resolve these — report clearly, do not attempt)

- **Top up the DeepSeek account balance**, or make a deliberate decision to drop
  DeepSeek from the routing table if it's not worth maintaining as a fallback.
- **Review Groq key pool size** — if Phase 0/2 found it thin, decide whether to
  provision additional keys.

---

## 9. What happens after this

Once this and the `json-validator` fix are both done (either order, but both
before the next step):
1. Re-run the `career_trait_backfill` runner to actually complete — it should now
   have all three chain links (GLM, Gemini, Groq) functional instead of funneling
   everything onto Groq alone.
2. Re-check `/api/ai-service/health` to confirm all providers report healthy
   before trusting any newly-generated data.
3. Only then move to the broader Phase 8 test suite — testing against
   infrastructure that's actually healthy, not infrastructure with two silently
   broken fallback links baked into the baseline.

---

*Execute phase by phase with a checkpoint after each. Phase 0's diagnosis
determines the actual fix in Phase 2 — don't skip straight to "correct the model
string" without confirming which of the five root-cause categories each provider
actually falls into.*
