# SCPR Project — Issues & Failures Log

> **Purpose:** This file logs every error, bug, provider failure, schema mismatch, rate-limit issue, and edge-case encountered during all phases of the career catalog import and admin panel project. Use this as a reference for debugging, retries, and future improvements.

---

## Phase 0 — Import Infrastructure & Schema Extensions

**Status:** ✅ No blocking issues

| # | Issue | Detail | Fix / Mitigation | Status |
|---|-------|--------|-----------------|--------|
| — | None | No failures during infrastructure setup. | — | ✅ |

---

## Phase 1 — Science Catalog Import

**Status:** ✅ Completed with known edge-cases

| # | Issue | Detail | Fix / Mitigation | Status |
|---|-------|--------|-----------------|--------|
| 1.1 | **Broad-degree enrichment flagging** | Leaves like "B.Des", "B.Arch", "Aerospace Engineering" are broad degree names, not specific job titles. These need manual splitting into sub-careers. | Flagged with `needs_enrichment: true` (11 careers). Manual admin review required. | ⚠️ Open |
| 1.2 | **Slugify dot-stripping for degree names** | `slugify("B.Des")` produced `"bdes"` (dot stripped). Later phases with Commerce catalog expected `"b_com"` pattern for "B.Com". | Dot-underscore conversion was added to `computeSubDomainCode()` (localized fix, not global slugify). Existing Science careers kept their old codes. | ✅ Fixed |
| 1.3 | **Overview subtree skipping** | Catalog files have an "Overview" section at root that is not a career leaf. The parser needed to skip this whole subtree. | Tree parser checks for "Overview" node name at depth 1 and skips it and all children. 7 Overview nodes skipped. | ✅ Fixed |

---

## Phase 2 — Commerce Catalog Import

**Status:** ✅ Completed with minor fixes

| # | Issue | Detail | Fix / Mitigation | Status |
|---|-------|--------|-----------------|--------|
| 2.1 | **Sub-domain code resolution for parenthetical names** | Careers under "B.Com (Bachelor of Commerce)" needed sub_domain_code = `"b_com"` but the taxonomy key was in parentheses. | Added three-tier resolution: (1) raw slug of full name, (2) parenthetical inner-code, (3) lowercase match. Handles "B.Com", "CS", "CA", etc. | ✅ Fixed |
| 2.2 | **Inner code extraction ordering bug** | `slugify(parenContent).replace(/\./g, '_')` was the wrong order — slugify stripped dots before `replace` could convert them. | Fixed to `slugify(parenContent.replace(/\./g, '_'))` — dots converted to underscores before slugify runs. | ✅ Fixed |

---

## Phase 3 — Arts & Humanities Catalog Import

**Status:** ✅ No blocking issues

| # | Issue | Detail | Fix / Mitigation | Status |
|---|-------|--------|-----------------|--------|
| — | None | Standard ASCII tree, no special cases. 98 new careers inserted, 10 merged duplicates. | — | ✅ |

---

## Phase 4 — Diploma Catalog Import

**Status:** ✅ No blocking issues

| # | Issue | Detail | Fix / Mitigation | Status |
|---|-------|--------|-----------------|--------|
| — | None | Standard ASCII tree. 87 new careers, 42 merged duplicates (significant overlap with Science/Commerce). | — | ✅ |

---

## Phase 5 — ITI & Polytechnic Catalog Import

**Status:** ✅ Completed with cross-linking concerns

| # | Issue | Detail | Fix / Mitigation | Status |
|---|-------|--------|-----------------|--------|
| 5.1 | **Polytechnic cross-link query precision** | Initial `$regex` query for matching Polytechnic branch names to Diploma careers was imprecise — could match substring collisions. | Changed to exact `$eq` match on `sub_domain_code`. Added `category_code: 'diploma'` filter for precision. | ✅ Fixed |
| 5.2 | **Polytechnic cross-link missing `await`** | The `updateMany` call lacked `.exec()` and proper `await` on the promise. | Added `.exec()` and verified `await` is present before the update. | ✅ Fixed |
| 5.3 | **Best-effort mapping concern** | 25 Polytechnic branches were cross-linked to Diploma careers via slug-matched sub-domain names. Some mappings may be imperfect (e.g., "AI & Machine Learning" → "ai_ml" slug mismatch). | Current approach is best-effort. Manual verification recommended. | ⚠️ Open |

---

## Phase 6 — Vocational & Skill Development Catalog Import

**Status:** ✅ No blocking issues

| # | Issue | Detail | Fix / Mitigation | Status |
|---|-------|--------|-----------------|--------|
| — | None | Standard ASCII tree. 69 new careers, 14 merged duplicates. | — | ✅ |

---

## Phase 7 — Government & Defence Catalog Import

**Status:** ✅ Completed with enrichment flagging

| # | Issue | Detail | Fix / Mitigation | Status |
|---|-------|--------|-----------------|--------|
| 7.1 | **Graduate-required roles flagged for enrichment** | 22 roles (UPSC IAS/IPS, Judiciary, Research Scientists, etc.) are graduate-level roles that need additional context or splitting. | Flagged with `needs_enrichment: true`. | ⚠️ Open |

---

## Phase 8 — Emerging & Future Careers Catalog Import

**Status:** ✅ No blocking issues

| # | Issue | Detail | Fix / Mitigation | Status |
|---|-------|--------|-----------------|--------|
| — | None | 83 new careers, 31 merged duplicates. Final dedup pass found no collisions. | — | ✅ |

---

## Phase 9 — AI Backfill Refinement ❌ (Most Critical Section)

**Status:** ⚠️ PARTIALLY COMPLETE — 628/702 careers backfilled (89.5%), 74 remain due to rate limits.

### Provider & Model Failures

| # | Issue | Detail | Fix / Mitigation | Status |
|---|-------|--------|-----------------|--------|
| 9.1 | **GLM model `glm-4` not found** | All GLM API calls returned: `模型不存在，请检查模型代码` (Model does not exist, please check model code). The `glm-4` model name may be deprecated, case-sensitive differently, or the API key may lack access. | Removed GLM from `career_trait_backfill` route entirely. Investigate correct model name at `open.bigmodel.cn`. | ❌ Unresolved |
| 9.2 | **Gemini 1.5 Flash not found for v1beta API** | The model `gemini-1.5-flash` returned: `models/gemini-1.5-flash is not found for API version v1beta, or is not supported for generateContent.` This may be a model version naming issue or API endpoint version mismatch. | Reverted to `gemini-2.5-flash` which works correctly. Check if model name needs a version suffix (e.g., `gemini-1.5-flash-002`). | ❌ Unresolved |
| 9.3 | **Groq `mixtral-8x7b-32768` decommissioned** | This model has been retired by Groq. All calls returned decommissioned error. | Replaced with `llama-3.3-70b-versatile` as primary Groq fallback, `llama-3.1-8b-instant` as secondary. | ✅ Fixed |
| 9.4 | **DeepSeek insufficient balance** | DeepSeek API key has run out of credits or has insufficient balance. | Replaced with Groq `llama-3.1-8b-instant` fallback. Top up DeepSeek account or add new API key. | ❌ Unresolved |

### AI Service Infrastructure Bugs

| # | Issue | Detail | Fix / Mitigation | Status |
|---|-------|--------|-----------------|--------|
| 9.5 | **`json-validator.service.ts` `checkSchema()` incompatible with JSON Schema format** | The `checkSchema()` function iterates over the schema object's own keys (e.g., `type`, `properties`) and checks if they exist on the data. But the data has `trait_weights`, `eligibility` — not `type`, `properties`. So JSON Schema `{type: 'object', properties: {...}}` ALWAYS fails validation because `data.type` is undefined. | **Critical bug.** Workaround: Removed schema param from backfill runner entirely. Field validation is handled inline with defaults. To fix properly: rewrite `checkSchema()` to understand JSON Schema `{type, properties}` format, or use a library like `ajv` for validation. | ❌ Unresolved |
| 9.6 | **Missing `await` on `updateMany` in Polytechnic cross-link** | (See 5.2) — Fixed. | Fixed. | ✅ Fixed |

### Rate Limiting Issues

| # | Issue | Detail | Fix / Mitigation | Status |
|---|-------|--------|-----------------|--------|
| 9.7 | **Gemini 2.5 Flash Free Tier 20 RPM limit** | The free tier for `gemini-2.5-flash` has a **20 req/min** rate limit (not 30 as assumed). With 2 concurrent calls and 2s delay (~24 req/min), we consistently hit 429 quota errors. | Reduced to 1 sequential career processing + 3s inter-career delay (~12 req/min, well within 20 RPM). Added 429 exponential backoff retry (max 3 attempts, doubling delay up to 15s). | ✅ Fixed |
| 9.8 | **Gemini daily quota (1500 req/day) exhaustion** | The free tier allows ~1500 requests per day. With 702 careers + retries, this limit was hit. | Runner is resumable — remaining careers picked up on next run once quota resets. Consider upgrading to paid tier for larger batches. | ⚠️ Mitigated |
| 9.9 | **Groq `llama-3.3-70b-versatile` TPD limit (100k tokens/day)** | The free tier on Groq's `on_demand` service has a 100k token-per-day limit. Each backfill response is ~200-500 output tokens, so ~200-500 careers could be processed before exhausting the daily limit. | 74 careers remain unprocessed due to this limit. Run again the next day when quota resets. Consider adding more Groq API keys to distribute load. | ❌ Unresolved |
| 9.10 | **Groq `llama-3.1-8b-instant` TPM limit** | Occasionally hit tokens-per-minute limits on this model when Gemini primary and Groq 70B fallback both failed. | Less impactful than 9.9. The 3s delay keeps TPM usage manageable. | ⚠️ Mitigated |

### Remaining Backfill Gap

| # | Issue | Detail | Fix / Mitigation | Status |
|---|-------|--------|-----------------|--------|
| 9.11 | **74 careers still `rule_based`** | After two runs, 74 careers could not be backfilled because all provider quotas were exhausted (Daily: Groq TPD, potentially Gemini daily). | Run `npx ts-node src/careers/import/ai-backfill-runner.ts` again when quotas reset (typically next calendar day). The runner is resumable. | ⚠️ Open |

---

## Phase 10 — Admin Panel

**Status:** ✅ Completed with minor issues

| # | Issue | Detail | Fix / Mitigation | Status |
|---|-------|--------|-----------------|--------|
| 10.1 | **ProtectedRoute role check timing** | On page refresh, `useAuthStore` has `user: null` until hydration. The admin role check (`user?.role !== 'admin'`) could briefly redirect before auth state loads. | Currently mitigated by the `accessToken` check (redirects to `/login` first if no token). If persistent auth is added, this needs a loading state. | ⚠️ Mitigated |
| 10.2 | **`needsEnrichment` query param case sensitivity** | Original implementation used strict `=== 'true'` check that didn't handle `"TRUE"` or `"True"`. | Fixed with `.toLowerCase()` normalization. | ✅ Fixed |
| 10.3 | **Missing loading states for Publish/Reject buttons** | The Detail Drawer's Publish and Reject buttons had no loading/disabled state, allowing double-clicks. | Added `publishing` and `rejecting` state booleans with guard clauses, spinner icons, and `disabled` attribute. | ✅ Fixed |
| 10.4 | **Admin route protection** | Initial implementation only checked `accessToken` (any authenticated user), not admin role, allowing non-admin users to briefly see the admin UI before redirect. | Added `isAdminRoute` check in `ProtectedRoute` that verifies `user?.role === 'admin'`. | ✅ Fixed |
| 10.5 | **Unused icon imports in AdminCareers.tsx** | Multiple icon imports (Filter, BookOpen, MessageSquare, History, TrendingUp, Award, Users, Download, Share2) were unused. | Cleaned up unused imports. | ✅ Fixed |

---

## Cross-Cutting Infrastructure Issues

| # | Issue | Detail | Fix / Mitigation | Status |
|---|-------|--------|-----------------|--------|
| C.1 | **MongoDB connection on Windows** | MongoDB must be running locally at `mongodb://localhost:27017/scpr`. Not auto-started. | Ensure MongoDB service is running before any import or backfill. Add `mongod` startup to deployment scripts. | ⚠️ Operational |
| C.2 | **Catalog file format consistency** | All catalog files use ASCII tree format with 2-space indentation per depth level. Minor inconsistencies exist (extra blank lines, mixed dash/asterisk bullets). Tree parser handles these but may miss edge cases. | Best-effort parsing. Validate new catalog files against the parser before bulk import. | ⚠️ Maintenance |
| C.3 | **Dedup strategy semantics** | Duplicate detection uses `career_code` (slug of career name). Two careers with the same name from different catalogs are merged into one record with merged `source_catalog_parts`. This loses catalog-specific context. | Current design is intentional for dedup. If catalog-specific context is needed, consider a separate `career_catalog_entries` collection. | ⚠️ Design decision |

---

## Summary of Open Issues (Action Required)

| Priority | Issue | Phase | Action Needed |
|----------|-------|-------|--------------|
| 🔴 High | 9.5 — `json-validator.service.ts` `checkSchema()` broken for JSON Schema format | 9 | Rewrite to support `{type, properties}` format or replace with `ajv` library |
| 🔴 High | 9.11 — 74 careers not backfilled (rate limits exhausted) | 9 | Re-run backfill runner next day when quotas reset |
| 🟡 Medium | 9.1 — GLM model `glm-4` not found | 9 | Investigate correct model name at open.bigmodel.cn |
| 🟡 Medium | 9.2 — Gemini 1.5 Flash not found for v1beta | 9 | Check correct model version suffix |
| 🟡 Medium | 9.4 — DeepSeek insufficient balance | 9 | Top up API credits or add new key |
| 🟡 Medium | 9.9 — Groq TPD limit (100k tokens/day) | 9 | Add more Groq API keys or upgrade tier |
| 🟢 Low | 1.1 — 11 broad-degree careers need enrichment | 1 | Manual admin review in Phase 10 panel |
| 🟢 Low | 5.3 — 25 Polytechnic cross-links best-effort | 5 | Manual verification recommended |
| 🟢 Low | 7.1 — 22 government roles need enrichment | 7 | Manual admin review in Phase 10 panel |
| 🟢 Low | C.2 — Catalog file format consistency | All | Validate before future imports |

---

## How to Retry Phase 9 Backfill (Remaining 74 Careers)

```bash
cd backend
npx ts-node src/careers/import/ai-backfill-runner.ts
```

The runner is resumable — it queries only `backfill_status: 'rule_based'` careers. The 74 remaining will be picked up automatically.

**Tip:** Run after midnight UTC (when Groq daily quota resets) for best results.

---

*Last updated: 2026-07-12*
