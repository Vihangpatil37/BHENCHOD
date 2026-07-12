# SCPR — Career Catalog Import + Admin Panel
## Master Execution Prompt for Autonomous Coding Agent

> Feed this document to the coding agent (Gemini / Antigravity) one phase at a time.
> Do not skip ahead. Each phase ends with a checkpoint the agent must report before
> proceeding to the next.

---

## 0. Context

SCPR currently has ~40 seed careers in the `Career` collection. This is far too small
for the Eligibility Engine and Trait Matching Engine to meaningfully differentiate —
Top-20 candidates out of 40 careers isn't a real shortlist.

Eight raw catalog documents have been produced, covering every post-Class-10 pathway
in the Indian education system:

| Part | File | Domain | Approx. Career Leaves |
|------|------|--------|----------------------|
| 1 | `SCPR_Master_Career_Catalog_Part_1_Science_v2.md` | Science (PCM/PCB/PCMB) | ~180 |
| 2 | `SCPR_Master_Career_Catalog_Part_2_Commerce.md` | Commerce | ~120 |
| 3 | `SCPR_Master_Career_Catalog_Part_3_Arts_Humanities.md` | Arts & Humanities | ~180 |
| 4 | `SCPR_Master_Career_Catalog_Part_4_Diploma.md` | Diploma | ~250 |
| 5 | `SCPR_Master_Career_Catalog_Part_5_ITI_Polytechnic.md` | ITI & Polytechnic | ~300 |
| 6 | `SCPR_Master_Career_Catalog_Part_6_Vocational_Skill_Development.md` | Vocational | ~250 |
| 7 | `SCPR_Master_Career_Catalog_Part_7_Government_Defence.md` | Government & Defence | ~250 |
| 8 | `SCPR_Master_Career_Catalog_Part_8_Emerging_Future_Careers.md` | Emerging & Future | ~250 |

These are raw ASCII trees — names only, no `trait_weights`, no `eligibility`, no
descriptions. This prompt turns them into proper `Career` documents and gives you a
UI to review and refine the result.

**This master prompt has two halves:**
- **Part A (Phases 0–9):** Parse, deduplicate, default-score, and seed all 8 catalogs.
- **Part B (Phase 10):** Admin panel to manage the resulting ~1,000–1,300 careers.

---

## 1. Hard Rules (apply to every phase)

1. **Idempotent imports.** Every seed operation is an upsert keyed on `career_code`.
   Re-running any phase must never create duplicates.
2. **Mongoose only.** No raw MongoDB driver calls.
3. **Thin controllers.** All parsing/import/backfill logic lives in services, not
   controllers.
4. **snake_case on the wire.** All new admin API fields follow existing convention.
5. **Scope discipline.** Each phase touches only the files it names. Do not
   refactor unrelated modules "while you're in there."
6. **Never send the full catalog to an LLM.** AI backfill (Phase 9) calls
   `career_trait_backfill` **one career at a time**, exactly as the existing
   `ai-service` routing table already defines (GLM → Gemini → Groq). Do not invent
   a new task type or a batched mega-prompt.
7. **Rule-based values are the live values until a human approves otherwise.**
   `trait_weights` / `eligibility` (live fields the recommendation engine reads)
   are populated by the deterministic rules in Phase 0. AI backfill only ever
   writes to `trait_weights_draft` / `eligibility_draft`. Promotion to live fields
   happens **only** through the Phase 10 admin panel's explicit "Publish" action.
   This means recommendation quality can never silently degrade from an
   unreviewed AI pass.
8. **State file.** Maintain `CAREER_IMPORT_PROGRESS.md` in the repo root. Before
   starting any phase, read it. After finishing any phase, update it with: phase
   number, careers imported, duplicates merged, timestamp, and any anomalies
   flagged for human review. If a session ends mid-phase, the next session must
   resume from the state file, not from phase 0.

---

## 2. Phase 0 — Import Infrastructure & Schema Extensions

**Files this phase may touch:**
`onboarding/../careers/schemas/career.schema.ts`, new `careers/import/` directory,
`CAREER_IMPORT_PROGRESS.md`.

### 2.1 Schema extensions

Add the following fields to the existing `Career` schema (does not break existing
40 careers — all new fields are optional/defaulted):

```typescript
{
  // ...existing fields (career_code, category_code, name, trait_weights, eligibility,
  // trait_weights_draft, eligibility_draft, etc. — unchanged)

  sub_domain_code: string;         // e.g. "science_pcm", "diploma_computer_engineering"
  pathway_tags: string[];          // e.g. ["B.Tech CSE"], breadcrumb context from source tree
  source_catalog_parts: string[];  // e.g. ["part_1_science", "part_4_diploma"] — populated on dedup merge
  backfill_status: 'rule_based' | 'ai_refined' | 'published';
  needs_enrichment: boolean;       // true if the leaf was a broad degree name, not a specific job title
  is_active: boolean;              // default true; admin can soft-disable without deleting
  imported_at: Date;
}
```

### 2.2 Category / sub-domain lookup table

Create `careers/import/taxonomy.config.ts` with this exact mapping (do not invent
your own slugs — use these so eligibility/weight rules in 2.3 apply correctly):

```
category_code: "science"
  sub_domains: science_pcm, science_pcb, science_pcmb

category_code: "commerce"
  sub_domains: b_com, bba, bms, ca, cs, cma, economics, finance, banking,
    international_business, digital_business, fintech, business_analytics,
    entrepreneurship

category_code: "arts_humanities"
  sub_domains: ba_psychology, ba_political_science, ba_sociology, ba_history,
    ba_geography, ba_english, journalism_mass_comm, llb_integrated, fine_arts,
    performing_arts, design, foreign_languages, social_work, education

category_code: "diploma"
  sub_domains: computer_engineering, information_technology, ai_ml, data_science,
    cyber_security, electronics_comm, electrical_engineering, mechanical_engineering,
    civil_engineering, automobile_engineering, mechatronics, robotics,
    chemical_engineering, architecture_assistantship, medical_lab_tech, pharmacy,
    fashion_design, interior_design, animation_multimedia, hotel_management,
    aviation, marine_engineering

category_code: "iti_polytechnic"
  sub_domains: iti_electrician, iti_fitter, iti_copa, iti_welder,
    iti_diesel_mechanic, iti_motor_vehicle, iti_hvac, iti_electronics_mechanic,
    iti_draughtsman_civil, iti_draughtsman_mechanical, iti_other_trades

category_code: "vocational"
  sub_domains: healthcare, beauty_wellness, hospitality_tourism, food_bakery,
    retail_sales, digital_marketing, photography_media, animation_gaming,
    agriculture, renewable_energy, drone_technology, logistics_supply_chain,
    sports_fitness, fashion_apparel, entrepreneurship

category_code: "government_defence"
  sub_domains: upsc, ssc, banking_govt, railways_rrb, indian_army, indian_navy,
    indian_air_force, capf, police_services, judiciary, teaching_govt,
    psu_companies, research_organisations, intelligence_agencies

category_code: "emerging_future"
  sub_domains: artificial_intelligence, data_science_emerging,
    cyber_security_emerging, cloud_computing, robotics_automation, semiconductor,
    space_technology, quantum_computing, biotechnology_emerging, climate_tech,
    electric_vehicles, drone_technology_emerging, ar_vr_xr, blockchain_web3,
    healthtech, fintech_emerging, creator_economy, freelancing,
    entrepreneurship_emerging
```

### 2.3 Rule-based default trait_weights (per category_code base, then keyword modifiers)

Create `careers/import/default-weights.config.ts`. Base profile per category
(0–100 scale, matches existing `StudentDNA`/`trait_weights` 10 dimensions):

| Trait | science | commerce | arts_humanities | diploma | iti_polytechnic | vocational | govt_defence | emerging_future |
|---|---|---|---|---|---|---|---|---|
| analytical_thinking | 80 | 65 | 45 | 65 | 55 | 35 | 55 | 75 |
| creativity | 50 | 40 | 75 | 40 | 30 | 55 | 25 | 55 |
| communication | 45 | 60 | 75 | 40 | 30 | 55 | 55 | 45 |
| leadership | 40 | 55 | 45 | 35 | 25 | 40 | 70 | 40 |
| research | 65 | 40 | 50 | 35 | 20 | 25 | 40 | 55 |
| business_acumen | 30 | 80 | 30 | 30 | 25 | 45 | 35 | 45 |
| technical_curiosity | 75 | 35 | 30 | 70 | 75 | 40 | 30 | 85 |
| empathy | 40 | 35 | 65 | 35 | 30 | 45 | 50 | 30 |
| patience | 55 | 50 | 55 | 55 | 65 | 55 | 65 | 40 |
| risk_tolerance | 45 | 55 | 45 | 40 | 35 | 50 | 60 | 65 |

After applying the base profile, apply **keyword modifiers** to the career name
(case-insensitive substring match, additive, then clamp 0–100):

| Keyword in name | Modifier |
|---|---|
| Manager, Director, Head, Chief, CFO, CTO | leadership +15, business_acumen +10 |
| Engineer, Technician, Developer, Programmer | technical_curiosity +10, analytical_thinking +5 |
| Analyst, Scientist, Researcher | research +15, analytical_thinking +10 |
| Designer, Artist, Stylist, Curator | creativity +15 |
| Teacher, Counselor, Therapist, Trainer, Coach, Instructor | empathy +15, communication +10 |
| Officer, Founder, Entrepreneur | leadership +10, risk_tolerance +10 |
| Consultant, Advisor | communication +10, business_acumen +5 |

If a career name matches multiple keywords, apply all matching modifiers before
clamping.

### 2.4 Rule-based default eligibility

Create `careers/import/default-eligibility.config.ts`. Map by category + sub-domain:

| Category / sub-domain | min_maths | min_science | min_biology | required_stream | min_study_duration_years | max_study_duration_years | max_budget_tier |
|---|---|---|---|---|---|---|---|
| science_pcm | 60 | 55 | 0 | PCM | 4 | 6 | 3 |
| science_pcb | 0 | 60 | 55 | PCB | 4.5 | 6 | 3 |
| science_pcmb | 55 | 60 | 50 | PCMB | 4 | 6 | 3 |
| commerce (all) | 40 | 0 | 0 | Commerce | 3 | 5 | 3 |
| arts_humanities (all) | 0 | 0 | 0 | Arts | 3 | 5 | 2 |
| diploma (all) | 35 | 35 | 0 | null | 3 | 3 | 2 |
| iti_polytechnic (all) | 0 | 0 | 0 | null | 1 | 2 | 1 |
| vocational (all) | 0 | 0 | 0 | null | 0.5 | 2 | 1 |
| emerging_future (most) | 55 | 50 | 0 | PCM | 4 | 6 | 2 |
| emerging_future: creator_economy, freelancing, entrepreneurship_emerging | 0 | 0 | 0 | null | 0 | 2 | 1 |

**government_defence is special-cased** (do not apply a single blanket rule):
- `ssc`, `railways_rrb`, `indian_army` (non-officer entries: Soldier GD, Agniveer,
  Technical Entry), `indian_navy` (Agniveer, Sailor), `indian_air_force` (Agniveer
  Vayu) → `min_study_duration_years: 0–1`, open at Class 10/12, `required_stream: null`
- `upsc`, `judiciary`, `research_organisations` (Scientist roles), `teaching_govt`
  (Lecturer/Professor tier), CAPF/Police officer-tier entries → require graduation
  first: `min_study_duration_years: 3` minimum before eligibility, flag
  `needs_enrichment: true` since the real gate is "graduate + exam," not a Class 10
  subject score.

### 2.5 Definition of Done — Phase 0
- [ ] Schema extended, existing 40 careers unaffected (new fields default correctly)
- [ ] `taxonomy.config.ts`, `default-weights.config.ts`, `default-eligibility.config.ts` created
- [ ] Unit tests on the weight/eligibility rule functions (pure functions — cheap to test, do this now)
- [ ] `CAREER_IMPORT_PROGRESS.md` created and initialized

**Checkpoint: report back before starting Phase 1.**

---

## 3. Parsing Algorithm (applies identically to Phases 1–8)

Each catalog file contains one fenced ` ```text ` block with an ASCII tree using
`│`, `├──`, `└──`, and indentation to encode hierarchy.

**Algorithm:**
1. Extract the fenced tree block.
2. Depth = indentation column of the `├──`/`└──` marker, normalized to tree levels
   (not raw character count — count marker occurrences).
3. **A node is a career leaf if and only if it has no children** (no deeper-indented
   lines follow it before the next same-or-shallower-depth line).
4. **Skip any subtree rooted at a node whose text is "Overview"** (case-insensitive)
   — these consistently contain descriptive metadata (Duration, Eligibility, Best
   For, etc.), not careers. Confirmed present in Parts 1, 3, and 4.
5. For every leaf found:
   - `name` = leaf text, trimmed
   - `category_code` = the file's top-level domain (from the `taxonomy.config.ts` table)
   - `sub_domain_code` = the depth-1 ancestor node's slugified text
   - `pathway_tags` = array of all ancestor node texts between depth-1 and the leaf's
     immediate parent (e.g. `["B.Tech CSE"]` for "AI Engineer" in Part 1)
   - `career_code` = slugify(`name`) — lowercase, spaces→underscores, strip
     punctuation (e.g. "AI Engineer" → `ai_engineer`)

### 3.1 Special case — Part 5's "Polytechnic" subtree

The `Polytechnic` branch inside Part 5 lists **branch/degree names only**
(e.g. "Computer Engineering", "Data Science", "Robotics") with **no career-title
children** — unlike the ITI branch in the same file, which does have real leaf
careers. These are the same programs already covered with real job titles in
Part 4 (Diploma).

**Do not create empty or placeholder Career documents from this subtree.** Instead:
for each Polytechnic branch name, find the matching `sub_domain_code` group already
imported from Part 4, and append `"polytechnic"` to `pathway_tags` on every career
in that group. This cross-links the pathway without creating junk records.

### 3.2 Broad-degree leaves (`needs_enrichment`)

Some leaves are degree names, not job titles — e.g. in Part 1 PCM: `Aerospace
Engineering`, `Aeronautical Engineering`, `Biotechnology`, `Chemical Engineering`,
`Automobile Engineering`, `Marine Engineering`, `Petroleum Engineering`, `Mining
Engineering`, `NDA`. Import these as Career records same as any other leaf, but set
`needs_enrichment: true` so the admin panel (Phase 10) can surface them for a human
to later split into specific job titles. Apply the same judgment to structurally
similar bare leaves you encounter in other parts.

---

## 4. Deduplication Algorithm (applies across all 8 phases, running cumulatively)

Career names repeat across parts (e.g. "AI Engineer" appears under Science PCM,
Diploma AI&ML, and Emerging AI). Before inserting any parsed leaf:

1. Compute `career_code` (slugified name).
2. Query existing `Career` collection for that `career_code`.
3. **If not found:** insert new document with `source_catalog_parts: [this_part]`.
4. **If found:** do not create a duplicate. Instead:
   - Append this part's identifier to `source_catalog_parts` (if not already present)
   - Merge `pathway_tags` (union, deduplicated)
   - Leave `trait_weights`/`eligibility` from the **first** import untouched (do not
     overwrite — first-seen category context wins; admin can adjust later)
5. Log every merge to `CAREER_IMPORT_PROGRESS.md` under that phase's entry so the
   count of "true new careers" vs. "merged duplicates" is auditable.

---

## 5. Phases 1–8 — Per-Catalog Import

Each phase follows this identical template. Substitute the file and taxonomy row.

**Files this phase may touch:** `careers/import/seed-part-N.ts`, seed execution
only — no schema or controller changes after Phase 0.

**Steps:**
1. Read `CAREER_IMPORT_PROGRESS.md` — confirm previous phase completed.
2. Parse the source file per Section 3.
3. Deduplicate per Section 4 against everything imported so far.
4. Apply default weights (Section 2.3) and eligibility (Section 2.4).
5. Upsert into `Career` collection (`backfill_status: 'rule_based'`, `imported_at: now`).
6. Update `CAREER_IMPORT_PROGRESS.md`: total leaves found, new inserts, merged
   duplicates, any `needs_enrichment` flags raised, timestamp.
7. **Checkpoint — stop and report** before moving to the next phase.

| Phase | Source file | category_code |
|---|---|---|
| 1 | `SCPR_Master_Career_Catalog_Part_1_Science_v2.md` | science |
| 2 | `SCPR_Master_Career_Catalog_Part_2_Commerce.md` | commerce |
| 3 | `SCPR_Master_Career_Catalog_Part_3_Arts_Humanities.md` | arts_humanities |
| 4 | `SCPR_Master_Career_Catalog_Part_4_Diploma.md` | diploma |
| 5 | `SCPR_Master_Career_Catalog_Part_5_ITI_Polytechnic.md` | iti_polytechnic (+ cross-link per 3.1) |
| 6 | `SCPR_Master_Career_Catalog_Part_6_Vocational_Skill_Development.md` | vocational |
| 7 | `SCPR_Master_Career_Catalog_Part_7_Government_Defence.md` | government_defence |
| 8 | `SCPR_Master_Career_Catalog_Part_8_Emerging_Future_Careers.md` | emerging_future |

**Phase 8 additionally runs a final full-catalog dedup sanity pass**: query for any
`career_code` collisions that might have slipped through phase-by-phase checks, and
report the final total career count in `CAREER_IMPORT_PROGRESS.md`.

---

## 6. Phase 9 — AI Backfill Refinement

**Files this phase may touch:** a new one-off script
`careers/import/ai-backfill-runner.ts` (not a permanent service — this is a batch
job you run once, reusing the existing `ai-service`).

**Do not build new AI infrastructure.** The `career_trait_backfill` task and its
routing chain (GLM → Gemini → Groq) already exist per the `ai-service` router
config. Reuse it exactly.

**Steps:**
1. Query all careers where `backfill_status: 'rule_based'`.
2. For each career, **one at a time** (rule 6 in Section 1 — never batch multiple
   careers into a single LLM call), call
   `aiService.run('career_trait_backfill', { career_name, category_code,
   sub_domain_code, pathway_tags, current_trait_weights, current_eligibility })`.
3. Write the LLM's suggested values to `trait_weights_draft` / `eligibility_draft`
   only. Do **not** touch the live `trait_weights`/`eligibility` fields.
4. Set `backfill_status: 'ai_refined'`.
5. Respect existing `cache.service` and `token-logger.service` — this will be a
   large batch of calls (~1,000+), so caching matters and you should log progress
   incrementally in case the run is interrupted (resumable by re-querying for
   `backfill_status: 'rule_based'`).
6. Rate-limit the runner client-side (do not fire 1,000 concurrent requests — batch
   in controlled concurrency, e.g. 5 at a time, to avoid exhausting the key pool).

**This phase can run unattended** and does not block Phase 10 — the admin panel is
what makes its output usable.

---

## 7. Phase 10 — Admin Panel: Career Catalog Management

**Files this phase may touch:** `careers/careers.controller.ts` (admin routes only),
`careers/careers.service.ts` (new admin methods), new frontend
`pages/admin/careers/` directory. Guard all new routes with the existing Admin role
check.

### 7.1 Backend — new admin endpoints (extends existing `/api/careers/admin/*`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/careers` | Paginated list, filterable by `category_code`, `backfill_status`, `needs_enrichment`, `is_active`; searchable by name |
| GET | `/admin/careers/:career_code` | Full detail, including draft vs. live fields side by side |
| PUT | `/admin/careers/:career_code` | Manual edit of any field |
| POST | `/admin/careers/:career_code/publish-draft` | Copies `trait_weights_draft`→`trait_weights` and `eligibility_draft`→`eligibility`, sets `backfill_status: 'published'` |
| POST | `/admin/careers/:career_code/reject-draft` | Clears draft fields, reverts `backfill_status: 'rule_based'` |
| POST | `/admin/careers/bulk-publish` | Publish all drafts matching a filter (e.g. entire `category_code`) |
| GET | `/admin/careers/import-audit` | Returns `CAREER_IMPORT_PROGRESS.md` history as structured JSON (part, counts, timestamp) |
| PATCH | `/admin/careers/:career_code/toggle-active` | Soft enable/disable without deleting |

All responses follow the existing `{ data, timestamp, requestId }` envelope. All
business logic in `careers.service.ts` — controller stays thin.

### 7.2 Frontend — admin UI

Build under a new `/admin/careers` route (gate with existing Admin auth check in
the frontend router):

- **Career Table**: paginated, search box, filter chips for category / sub-domain /
  `backfill_status` / `needs_enrichment`. Sortable columns.
- **Career Detail Drawer**: opens on row click. Shows live `trait_weights` vs.
  `trait_weights_draft` as a side-by-side or overlaid radar chart (10 dimensions —
  reuse the visualization approach students see for their own StudentDNA, if one
  exists, for visual consistency). Inline edit fields for every schema field.
  "Publish Draft" / "Reject Draft" buttons only enabled when `backfill_status:
  'ai_refined'`.
- **Backfill Queue view**: filtered table of `backfill_status: 'ai_refined'` careers
  awaiting review, with bulk-select + bulk-publish.
- **Import Audit dashboard**: simple table/timeline reading `import-audit`,
  showing each phase's import counts — this is your visibility into "did the
  1,000-career import actually work."
- **Needs Enrichment queue**: filtered view of `needs_enrichment: true` careers
  (the broad-degree leaves from Section 3.2) so they surface for manual
  specific-job-title splitting later, instead of being silently forgotten.

State/data-fetching: Zustand for UI state (selected filters, drawer open/closed),
TanStack Query for all server data, typed service file
(`api/services/adminCareers.ts`) — consistent with existing frontend architecture
rules. Frontend does not compute any scores; it only displays and edits values the
backend already computed.

### 7.3 Definition of Done — Phase 10
- [ ] All 8 admin endpoints implemented, Admin-guarded, thin controller / service split
- [ ] Career Table + Detail Drawer + Backfill Queue + Import Audit + Needs Enrichment views built
- [ ] Publish/Reject draft flow tested end-to-end on at least 5 real imported careers
- [ ] Bulk-publish tested on a filtered category

---

## 8. Final Summary Checklist

- [ ] Phase 0: schema + rule configs + tests
- [ ] Phases 1–8: all 8 catalogs imported, deduplicated, checkpointed
- [ ] Catalog scale: ~40 → target 1,000+ (report actual final count)
- [ ] Phase 9: AI backfill drafts generated for all rule-based careers
- [ ] Phase 10: admin panel live, drafts reviewable and publishable
- [ ] `CAREER_IMPORT_PROGRESS.md` is a complete, readable audit trail of the entire import

---

*This master prompt should be executed one phase at a time. Do not let the agent
collapse multiple phases into one session — the checkpoints exist so you can spot-
check the data before it compounds across 1,000+ records.*
