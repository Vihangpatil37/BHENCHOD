# SCPR — json-validator Fix, Test Suite & Data Audit
## Master Execution Prompt for Autonomous Coding Agent

> Feed this to the coding agent one phase at a time. Do not skip Phase 0 — you need
> the actual current behavior confirmed before touching the fix, and you need the
> fix confirmed working before running the audit in Phase 3.

---

## 0. Context

`json-validator.service.ts`'s `checkSchema()` method is broken: it iterates the
*schema's own keys* instead of validating the *data* against the schema's
`{type, properties}` structure. This method sits in the path of every AI call that
goes through `aiService.run()` — which means it has been (theoretically) silently
passing or failing every structured LLM output in the system:

- `career_recommendation` → the Top-5 `final_recommendations` students actually see
- `roadmap_generation` → career roadmap content
- `career_trait_backfill` → the 628 career drafts generated so far (including any
  generated **after** the provider-config fix, which are about to be re-validated
  by whatever this method actually does)
- `counselor_chat` structured responses
- `report_summary`

This is a correctness bug with real blast radius, not an isolated unit. Fix it
carefully, test it properly (this project has no test suite yet — this is a good
place to start one), and then audit what may have already gone wrong before the
fix.

---

## 1. Hard Rules

1. **Scope is narrow.** Touch only: `json-validator.service.ts`, a new
   `ai-service/schemas/json-schemas/` directory, this fix's test files, and a new
   read-only audit script. Do not modify `router.service.ts`, `retry-manager.service.ts`,
   `cache.service.ts`, `prompt-builder.service.ts`, or any provider adapter.
2. **Do not change the public contract.** `aiService.run(taskType, context)`'s
   external return shape (`AIResponse` — `provider`, `model`, `task`, `success`,
   `data`, `usage`, `latency_ms`, `fallback_used`, `cached`) stays the same. Fix
   internal validation correctness only.
3. **Use a real JSON Schema library. Do not hand-roll validation again** — that's
   how this bug happened. Use `ajv` (industry-standard, zero-dependency option,
   draft-07 compatible). Add it as a backend dependency.
4. **Keep the existing repair pre-processing step separate from schema
   validation.** Fence-stripping and prose-trimming (turning `` ```json {...} ``` ``
   or `"Here's your JSON: {...}"` into clean JSON text) is a different concern from
   *"does this parsed JSON match the expected shape."* Preserve that step as-is
   unless Phase 0 diagnosis shows it's also broken — confirm, don't assume.
5. **The audit script (Phase 3) is read-only against production data.** It flags
   anomalies for human review. It must never auto-correct or delete a
   `Recommendation`, `Career`, or `ConversationMessage` document.
6. **Checkpoint after each phase** — report back before proceeding. Phase 1's fix
   must be confirmed working by Phase 2's tests before Phase 3 runs against real data.

---

## 2. Phase 0 — Diagnose (read-only, no code changes)

**Files this phase may touch:** none — this is investigation only.

1. Open `json-validator.service.ts` and document, in plain language, exactly what
   `checkSchema()` currently does line by line. Confirm (or correct) the working
   assumption: it's iterating `Object.keys(schema)` and checking something against
   those keys, rather than recursively validating `data` against `schema.type` /
   `schema.properties` / `schema.required`.
2. Open `ai-service.schemas.ts` and any other location where per-task-type schemas
   might already be defined (TypeScript interfaces, DTOs, or inline objects). For
   each task type below, note whether a real schema definition already exists, or
   only an implicit shape inferred from the `.md` prompt template's instructions
   to the LLM:
   - `career_recommendation`
   - `roadmap_generation`
   - `career_trait_backfill`
   - `counselor_chat` (structured mode)
   - `report_summary`
3. Confirm how the repair step (fence-stripping / prose-trimming) currently
   interacts with `checkSchema()` — does it run before, and is it a separate
   function?
4. Confirm what `token-logger.service.ts` currently logs regarding validation
   outcome (does `AIRequestLog.success` reflect schema validation result today, or
   only "did the HTTP call succeed"?).

**Checkpoint:** report the diagnosis before writing any fix. If `checkSchema()`
turns out to behave differently than described above, adjust Phase 1 accordingly
rather than forcing the assumed fix onto different actual behavior.

---

## 3. Phase 1 — Implement the Fix

**Files this phase may touch:** `json-validator.service.ts`, new
`ai-service/schemas/json-schemas/*.schema.ts` (one per task type), `package.json`.

### 3.1 Define real JSON Schemas per task type

Create `ai-service/schemas/json-schemas/<task-type>.schema.ts`, one file per task
type listed in Phase 0. Derive the schema shape from, in this priority order:
1. Existing TypeScript interfaces/DTOs in `ai-service.schemas.ts`, if they exist
2. The Mongoose fields the output eventually populates (e.g.
   `career_recommendation`'s output must satisfy the shape of
   `Recommendation.final_recommendations[]` — `career_code`, `rank`, `ai_score`,
   `explanation`, `roadmap`, `suggested_colleges[]`, `suggested_certifications[]`)
3. The explicit output-format instructions already written into the corresponding
   `.md` prompt template (these were presumably written to match an intended
   schema, even if that schema was never formalized in code)

Each schema is a draft-07-compatible JSON Schema object (`type`, `properties`,
`required`, `additionalProperties` where it matters — e.g. don't silently accept
extra hallucinated fields on `career_recommendation`).

### 3.2 Rewrite `checkSchema()` / the validator service

- Compile each schema once with `ajv` and **cache the compiled validator function**
  per task type (same caching philosophy already used in `cache.service.ts` —
  don't recompile on every call).
- New signature: `validate(taskType: string, data: unknown): { valid: boolean;
  errors: ErrorObject[] | null }` — return **structured** ajv errors, not just a
  boolean. Right now there's no way to know *why* a validation failed; this fixes
  that and gives `retry-manager.service.ts` something useful to log.
- Keep the existing repair pre-processing step untouched (per Hard Rule 4) unless
  Phase 0 found it broken too.
- Add one bounded, explicit JSON repair pass for common LLM output flaws — trailing
  commas, single-quoted keys/strings, unescaped newlines inside string values — run
  it once if the raw parse fails, re-attempt parse, then validate. If it's still
  invalid after that, return `valid: false` with errors; do not loop indefinitely.

### 3.3 Wire in the logging fix

If Phase 0 found that `AIRequestLog.success` doesn't currently reflect real schema
validation outcome, fix that now — `success` should mean "this response was valid
and usable," not just "the HTTP request didn't error."

### 3.4 Definition of Done — Phase 1
- [ ] `ajv` added as a dependency
- [ ] One schema file per task type, each reviewed against its Mongoose target shape
- [ ] `checkSchema()` replaced with ajv-backed compiled validation, cached per task type
- [ ] Structured error output, not boolean-only
- [ ] `AIResponse` public contract unchanged
- [ ] `AIRequestLog.success` accurately reflects validation outcome

**Checkpoint: report back before writing tests.**

---

## 4. Phase 2 — Regression Test Suite

**Files this phase may touch:** new test files colocated with
`json-validator.service.ts` (and `retry-manager.service.ts` / `cache.service.ts`
tests — see note below).

This is the first real test suite in the project. Build fixtures per task type
covering:

| Case | Expected outcome |
|---|---|
| Fully valid response matching schema | `valid: true` |
| Missing a required field | `valid: false`, error identifies the missing field |
| Wrong type on a field (e.g. `ai_score` as a string) | `valid: false`, error identifies the field |
| Response wrapped in ` ```json ... ``` ` fences | Repaired, then `valid: true` |
| Response with leading/trailing prose ("Here's your JSON: {...}") | Repaired, then `valid: true` |
| Trailing comma in the object | Repaired, then `valid: true` |
| Truncated/malformed JSON (unrepairable) | `valid: false` after one repair attempt, does not loop |
| Completely non-JSON garbage | `valid: false`, fails fast |

Run this matrix against **every** task-type schema from Phase 1, not just one.

**Efficient bundling (optional but recommended):** since you're already in this
corner of the codebase and Phase 8 (Testing & QA) hasn't started yet, this is a
convenient moment to also add:
- `retry-manager.service.ts`: a test for the "all providers in the fallback chain
  exhausted" path (throws the typed error, doesn't hang)
- `cache.service.ts`: a basic hit/miss test on the SHA-256 keyed cache

These are both already on your Phase 8 checklist — doing them now while the
surrounding code is fresh in context is cheaper than a separate pass later. Do not
expand scope beyond these two if it starts pulling in unrelated modules.

### Definition of Done — Phase 2
- [ ] Full fixture matrix passing for every task type
- [ ] Repair-then-valid cases confirmed to actually repair, not just tolerate
- [ ] Unrepairable cases confirmed to fail fast, not loop or hang
- [ ] (If bundled) retry-manager exhaustion test and cache hit/miss test passing

**Checkpoint: report back before running the audit against real data.**

---

## 5. Phase 3 — Audit Existing Production Data (read-only)

**Files this phase may touch:** one new script,
`ai-service/scripts/audit-json-validation.ts`. Nothing else. This script must not
write to any collection other than its own report output file.

### Steps
1. Query every stored `Recommendation.final_recommendations` entry.
2. Query every `Career` where `backfill_status` is `ai_refined` or `published` —
   re-validate `trait_weights_draft`/`eligibility_draft` (or live fields, if
   already published) against the `career_trait_backfill` schema.
3. Query `ConversationMessage` entries where `is_structured: true` — re-validate
   against the `counselor_chat` schema.
4. Query any stored `Report` summary content the same way.
5. For each, re-run it through the **now-correct** validator from Phase 1.
6. Produce `VALIDATION_AUDIT_REPORT.md`: for every failure, log the document's
   `_id`, `task_type`, which schema rule failed, and the specific field(s)
   involved. Group by task type and severity (missing required field vs. wrong
   type vs. unparseable).
7. **Do not fix, mutate, or delete anything found.** This is diagnostic only.

### Special attention
Flag prominently: any of the 628 careers backfilled *before* the AI-provider
config fix, since those drafts were generated during the exact window this bug
was active — they're the highest-risk set for having been accepted despite being
malformed.

### Definition of Done — Phase 3
- [ ] Audit script runs read-only against all four data sources above
- [ ] `VALIDATION_AUDIT_REPORT.md` produced with per-document detail
- [ ] Report clearly separates pre-fix backfill data from anything generated after
- [ ] Zero writes to production collections confirmed

---

## 6. Final Summary Checklist

- [ ] Phase 0: diagnosis documented, assumptions confirmed or corrected
- [ ] Phase 1: `ajv`-backed validator live, structured errors, logging fixed
- [ ] Phase 2: full regression suite passing, retry-exhaustion + cache tests bundled if convenient
- [ ] Phase 3: audit report generated, no data mutated, pre-fix backfill data flagged separately
- [ ] Report final counts: how many existing documents failed re-validation, broken down by task type

---

## 7. What happens after this

Once this is confirmed fixed and the audit report is in hand:
1. Any career drafts flagged as malformed in the audit should be reset to
   `backfill_status: 'rule_based'` and re-queued for the backfill runner — now that
   both the provider configs and the validator are fixed, this run should produce
   trustworthy data end to end.
2. Any `Recommendation` documents flagged should be marked `stale: true` so
   they're regenerated on next request rather than silently served.
3. Only after both of the above are this project is actually ready for the
   broader Phase 8 test suite — testing against known-good infrastructure instead
   of baking today's bugs into the test baseline.

---

*This master prompt should be executed phase by phase, with a checkpoint after
each. Do not let Phase 3 run before Phase 1's fix is confirmed correct by Phase 2's
tests — an audit run against a still-broken validator produces meaningless results.*
