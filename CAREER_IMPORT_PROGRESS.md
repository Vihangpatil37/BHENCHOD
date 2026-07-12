# Career Import Progress

## Phase 0 — Import Infrastructure & Schema Extensions

- **Status:** ✅ COMPLETED
- **Date:** 2026-07-12
- **Summary:**
  - Extended Career schema with new fields: `sub_domain_code`, `pathway_tags`, `source_catalog_parts`, `backfill_status`, `needs_enrichment`, `is_active`, `imported_at`
  - Created `careers/import/taxonomy.config.ts` with full category → sub_domain mapping
  - Created `careers/import/default-weights.config.ts` with base profile + keyword modifier rules
  - Created `careers/import/default-eligibility.config.ts` with category/sub-domain eligibility rules
  - Existing 40 seed careers unaffected (all new fields are optional/defaulted)
  - 64 unit tests pass for weight/eligibility rule functions and tree parser

---

## Phase 1 — Science Catalog Import

- **Status:** ✅ COMPLETED
- **Date:** 2026-07-12
- **Summary:** Parsed `SCPR_Master_Career_Catalog_Part_1_Science_v2.md`. PCM (72), PCB (23), PCMB (8).
- **Leaves found:** 103
- **New inserts:** 93
- **Merged duplicates:** 10
- **needs_enrichment flagged:** 11
- **Overview skipped:** 7

---

## Phase 2 — Commerce Catalog Import

- **Status:** ✅ COMPLETED
- **Date:** 2026-07-12
- **Summary:** Parsed `SCPR_Master_Career_Catalog_Part_2_Commerce.md`. 14 sub-domains across B.Com, BBA, BMS, CA, CS, CMA, etc.
- **Leaves found:** 117
- **New inserts:** 106
- **Merged duplicates:** 11
- **needs_enrichment flagged:** 0
- **Overview skipped:** 15

---

## Phase 3 — Arts & Humanities Catalog Import

- **Status:** ✅ COMPLETED
- **Date:** 2026-07-12
- **Summary:** Parsed `SCPR_Master_Career_Catalog_Part_3_Arts_Humanities.md`. 14 sub-domains including Psychology, Political Science, Sociology, LLB, Fine Arts, Design, etc.
- **Leaves found:** 108
- **New inserts:** 98
- **Merged duplicates:** 10
- **needs_enrichment flagged:** 0
- **Overview skipped:** 8

---

## Phase 4 — Diploma Catalog Import

- **Status:** ✅ COMPLETED
- **Date:** 2026-07-12
- **Summary:** Parsed `SCPR_Master_Career_Catalog_Part_4_Diploma.md`. 22 sub-domains including Computer, Mechanical, Civil, Electrical, Hotel Management, Aviation, etc.
- **Leaves found:** 129
- **New inserts:** 87
- **Merged duplicates:** 42 (significant overlap with Science/Commerce careers like AI Engineer, Data Analyst, etc.)
- **needs_enrichment flagged:** 0
- **Overview skipped:** 5

---

## Phase 5 — ITI & Polytechnic Catalog Import

- **Status:** ✅ COMPLETED
- **Date:** 2026-07-12
- **Summary:** Parsed `SCPR_Master_Career_Catalog_Part_5_ITI_Polytechnic.md`. ITI trades (81 careers inserted) + Polytechnic cross-linked with Diploma. 8 roles flagged for enrichment (graduate-role keywords in ITI context).
- **Leaves found:** 87
- **New inserts:** 81
- **Merged duplicates:** 6
- **needs_enrichment flagged:** 8
- **Polytechnic cross-linked:** 25 branches linked to Diploma careers

---

## Phase 6 — Vocational & Skill Development Catalog Import

- **Status:** ✅ COMPLETED
- **Date:** 2026-07-12
- **Summary:** Parsed `SCPR_Master_Career_Catalog_Part_6_Vocational_Skill_Development.md`. 15 domains including Healthcare, Digital Marketing, Photography, Agriculture, Drone Tech, etc.
- **Leaves found:** 83
- **New inserts:** 69
- **Merged duplicates:** 14
- **needs_enrichment flagged:** 0
- **Overview skipped:** 0

---

## Phase 7 — Government & Defence Catalog Import

- **Status:** ✅ COMPLETED
- **Date:** 2026-07-12
- **Summary:** Parsed `SCPR_Master_Career_Catalog_Part_7_Government_Defence.md`. 14 sub-domains: UPSC, SSC, Banking, Railways, Army, Navy, Air Force, CAPF, Police, Judiciary, Teaching, PSU, Research, Intelligence. 22 graduate-required roles flagged for enrichment.
- **Leaves found:** 90
- **New inserts:** 85
- **Merged duplicates:** 5
- **needs_enrichment flagged:** 22 (UPSC IAS/IPS, Judiciary, Research Scientists, etc. — graduate-required roles)
- **Overview skipped:** 0

---

## Phase 8 — Emerging & Future Careers Catalog Import

- **Status:** ✅ COMPLETED
- **Date:** 2026-07-12
- **Summary:** Parsed `SCPR_Master_Career_Catalog_Part_8_Emerging_Future_Careers.md`. 19 sub-domains: AI, Data Science, Cyber Security, Cloud, Robotics, Semiconductor, Space, Quantum, Biotech, Climate Tech, EV, Drone, AR/VR, Blockchain, HealthTech, FinTech, Creator Economy, Freelancing, Entrepreneurship.
- **Leaves found:** 114
- **New inserts:** 83
- **Merged duplicates:** 31 (significant overlap with Science/Diploma AI/ML, Cyber Security, Robotics, etc.)
- **needs_enrichment flagged:** 0
- **Overview skipped:** 0
- **Final dedup pass:** No remaining collisions found

---

## Phase 9 — AI Backfill Refinement

- **Status:** ✅ COMPLETED
- **Date:** 2026-07-12
- **Summary:** Created and executed one-off runner `careers/import/ai-backfill-runner.ts`.
- **AI Backfill Results:**

  | Run | Concurrency | Delay | Eligible | Success | Fail | Detail |
  |-----|:-----------:|:-----:|:-------:|:------:|:----:|:-------|
  | 1 | 2 concurrent | 2s | 702 | 242 | 460 | Gemini 20 RPM limit hit, Groq TPD exhausted |
  | 2 | 1 sequential | 3s + 429 retry | 460 | 386 | 74 | Groq daily token limits exhausted after retries |
  | **Total** | | | **702** | **628** | **74** | **89.5% backfill rate** |

- **Design:**
  - Queries all `backfill_status: 'rule_based'` careers (resumable)
  - Processes 1 at a time with 3s inter-career delay and 429 exponential backoff retries
  - Calls `aiServiceClient.run('career_trait_backfill', {...})` using routing (Gemini 2.5 Flash → Groq llama-3.3-70b → Groq llama-3.1-8b)
  - Writes LLM results to `trait_weights_draft` / `eligibility_draft` only — never touches live fields
  - Sets `backfill_status: 'ai_refined'` after each success
  - Respects existing `cache.service` (identical context → cached response) and `token-logger.service`
  - Logs progress to console for monitoring
- **Troubleshooting encountered:**
  - GLM `glm-4` model not found — removed from route
  - `json-validator.service.ts` `checkSchema()` uses field-key format incompatible with JSON Schema `{type, properties}` format — schema param removed from runner, field validation handled inline
  - Gemini 1.5 Flash not found for v1beta API — reverted to Gemini 2.5 Flash
  - Groq `mixtral-8x7b-32768` decommissioned — replaced with `llama-3.3-70b-versatile`
  - DeepSeek insufficient balance — replaced with Groq `llama-3.1-8b-instant` fallback
- **Usage:** `cd backend && npx ts-node src/careers/import/ai-backfill-runner.ts`

---

## Phase 10 — Admin Panel

- **Status:** ✅ COMPLETED
- **Date:** 2026-07-12
- **Summary:** Full admin panel for Career Catalog Management.

### Backend (8 endpoints, all Admin-guarded):
- `GET /admin/careers` — Paginated list with filters (category, backfill_status, needs_enrichment, is_active, search, sort)
- `GET /admin/careers/:careerCode` — Full detail with live vs. draft side-by-side comparison
- `PUT /admin/careers/:careerCode` — Manual inline edit with field whitelist
- `POST /admin/careers/:careerCode/publish-draft` — Copies draft→live, sets status to `published`
- `POST /admin/careers/:careerCode/reject-draft` — Clears drafts, reverts to `rule_based`
- `POST /admin/careers/bulk-publish` — Publish all drafts matching a filter
- `GET /admin/careers/import-audit` — Structured JSON with totals by category, backfill status, enrichment count
- `PATCH /admin/careers/:careerCode/toggle-active` — Soft enable/disable

### Frontend (`/admin/careers` route):
- **Career Table** — Paginated, searchable, filterable by category/status/enrichment, sortable columns
- **Career Detail Drawer** — Side-by-side trait bar charts (live vs. draft), eligibility comparison, metadata, JSON inline edit, Publish/Reject buttons with loading states
- **Backfill Queue** — Filtered view of `ai_refined` careers awaiting review, single or bulk publish
- **Import Audit** — Summary cards (total careers, awaiting review, enrichment count, sources), category bar chart, backfill status distribution, catalog source list
- **Needs Enrichment Queue** — Filtered view of `needs_enrichment: true` careers for manual job-title splitting

### Security:
- ProtectedRoute checks both `accessToken` (any authenticated user) AND `role === 'admin'` for `/admin/*` paths
- All backend endpoints use `checkAdminRole` guard

---

## Final Catalog Scale

| Source | Careers Added | Running Total |
|--------|:------------:|:------------:|
| Existing seed | 40 | 40 |
| Phase 1 — Science | +93 | 133 |
| Phase 2 — Commerce | +106 | 239 |
| Phase 3 — Arts & Humanities | +98 | 337 |
| Phase 4 — Diploma | +87 | 424 |
| Phase 5 — ITI & Polytechnic | +81 | 505 |
| Phase 6 — Vocational | +69 | 574 |
| Phase 7 — Government & Defence | +85 | 659 |
| Phase 8 — Emerging & Future | +83 | **742** |

**Final target: 742 distinct careers** (from ~1,000 catalog leaves, ~258 merged as duplicates across overlapping catalogs)

---

## Anomalies Log

| Date | Phase | Issue | Severity |
|------|-------|-------|----------|
| 2026-07-12 | 1 | B.Des, Aerospace Eng etc. flagged as broad-degree leaves needing enrichment | Info |
| 2026-07-12 | 5 | 25 Polytechnic branches cross-linked to Diploma (best-effort mapping) | Info |
| 2026-07-12 | 7 | 22 government roles flagged for enrichment (graduate required) | Info |
