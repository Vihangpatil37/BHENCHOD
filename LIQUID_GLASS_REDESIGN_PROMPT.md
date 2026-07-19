# SCPR Frontend — Liquid Glass Redesign — Execution Prompt v1.0

> Copy-paste this entire file as a single prompt to your AI coding agent (Claude Code / Gemini CLI / etc.), pointed at the root of the SCPR repository. It is self-contained — the agent should not need to ask clarifying questions. Where a decision was ambiguous in the source spec, this document already makes the call; follow it as written.

---

## 0. Read This First — Agent Operating Rules

**Scope lock (hard constraint):**
- You may ONLY create, edit, or delete files inside `frontend/`.
- Do NOT touch anything inside `backend/`, any root-level `.md` catalog/spec files (`PROJECT_ANALYSIS.md`, `WORKFLOW.md`, `ISSUES_LOG.md`, `SCPR_Master_Career_Catalog_*.md`, `colour_analysis.md`, `recommendation-engine-v2-implementation-prompt.md`), or root config (`docker-compose.yml`, `.gitignore`, analysis scripts like `analyze.js`).
- This is a **visual and front-end-architecture redesign**, not a feature change. Every existing route, page, form field, API call, auth flow, and piece of functionality must keep working exactly as it does today. If a component's behavior would need to change to achieve a visual goal, prefer restructuring the component's internals over changing what it does.
- Do not add new pages or routes. The spec you're implementing references pages (Profile, Settings, Notifications page) that do not exist in this repo. **Skip those sections entirely** — only restyle pages that already exist in `frontend/src/pages/`.
- Do not rename the product. The source design spec calls the app "CareerCompass AI." Do not introduce that literal string anywhere. Use whatever product name/branding already appears in `frontend/index.html`, `package.json`, and `Landing.tsx` today. Treat the AI persona name **"Career Mentor AI"** (Section 8 below) as a UI copy convention, not a product rename — apply it only to AI-voice copy (chat, onboarding, recommendation explanations), not to the app's own branding/logo/title.

**Git workflow (do this before touching any file):**
1. Run `git status` — confirm the working tree is clean. If not, stop and report back rather than committing on top of uncommitted work.
2. Create and switch to a new branch from the current default branch:
   ```
   git checkout -b redesign/liquid-glass-ui
   ```
   (If a branch with this name already exists, use `redesign/liquid-glass-ui-v2`, etc.)
3. Commit at the end of **every phase** below with a message in the form `feat(ui): phase N — <short description>`. Do not squash phases together. Do not merge or push to `main`/`master` — leave that for human review.
4. After the final phase, produce a short PR description (see Section 11) as a file at `frontend/REDESIGN_NOTES.md` summarizing what changed, and stop there. Do not open a PR yourself.

**Working method:**
- Proceed phase by phase, in order. Do not start Phase N+1 until Phase N's exit criteria (listed under each phase) all pass.
- After each phase, run: `npm run build` inside `frontend/`, and the existing test suites (`client.test.ts`, `authStore.test.ts` or whatever `npm test` picks up). Fix any breakage before committing.
- Run `git diff --stat backend/` after every phase — it must return empty. If it doesn't, you've gone out of scope; revert those changes.

---

## 1. Mission

Rebuild the SCPR frontend's visual language from its current purple/mint/orange "Aurora Compass" theme into a unified **Liquid Glass** design system: one primary brand color, cyan reserved exclusively for AI, purple reserved exclusively for recommendations, glass-as-material (not `opacity: 50%`), light as the primary signal for state/interaction, and motion that communicates rather than decorates.

The end state should feel like a premium AI product (Apple-adjacent lighting and glass, OpenAI/Perplexity-adjacent clarity, Linear-adjacent spacing precision) — never a college dashboard, never a gaming/crypto/cyberpunk theme, never a generic SaaS template.

Two subconscious reactions the finished UI should produce, in order:
1. "This feels premium."
2. "This AI understands me."

---

## 2. Non-Negotiable Design Principles (apply to every phase)

- **The interface disappears.** Users focus on careers, recommendations, and learning — never on UI decoration.
- **Depth over borders.** No visible rectangles. Depth comes from glass, blur, shadow, light, and spacing — never thick outlines.
- **Motion has meaning.** Every animation communicates loading, thinking, selection, completion, transition, or success — nothing is decorative.
- **Light is information.** Glow/brightness signals AI activity, focus, selection, hover, recommendation-readiness, or success — never random ambiance.
- **Color is semantic**, never decorative: Blue = AI/Intelligence(brand), Cyan = AI activity only, Purple = Recommendation engine only, Green = Success only, Amber = Warning only, Red = Error only.
- **Accessibility is never traded for aesthetics**: min 4.5:1 contrast for body text, visible keyboard focus states, `prefers-reduced-motion` fully supported, color is never the sole indicator of state, 44px minimum touch targets on mobile.
- **What this is NOT**: Discord, gaming dashboards, crypto/NFT sites, RGB cyberpunk, sci-fi hacker UI, admin-template boilerplate, Material Design clone, or an Apple clone (inspired by, never copying icons/layout/nav/colors).

---

## 3. Design Token Contracts

This is the deliverable of Phase 1. Every value below must exist as both a CSS custom property (consumed via Tailwind v4 `@theme`/`:root` in `frontend/src/index.css`) **and** a typed TS export (for use in JS-driven contexts: Recharts colors, Framer Motion durations, inline style calculations). No component may hardcode any of these values directly.

### 3.1 Color Tokens

**Backgrounds** (never pure black — glass needs something to refract):
```
--bg-primary:    #05070D
--bg-secondary:  #0A0A0F
--bg-tertiary:   #10131A
```

**Primary Brand** (one brand color — buttons, links, active nav, focus rings, progress, charts; never for errors/warnings/notifications/backgrounds):
```
--brand:          #5B7CFA
--brand-hover:    #4F6FF0
--brand-pressed:  #4565DA
```

**AI Accent** — belongs exclusively to AI activity (chat, thinking/streaming states, neural effects, AI badges). Never used for ordinary buttons:
```
--ai-cyan: #70E1FF
```

**Recommendation Accent** — belongs exclusively to the recommendation/career-match experience. Never a primary-action button color:
```
--recommendation-purple: #8B5CF6
```

**Semantic status:**
```
--success:       #22C55E
--warning:       #F59E0B
--error:         #EF4444
--error-hover:   #DC2626
--info:          #3B82F6
```

**Glass surfaces** (never exceed 16% — past that it stops reading as glass):
```
--glass-surface:  rgba(255,255,255,0.05)
--glass-elevated: rgba(255,255,255,0.08)
--glass-modal:    rgba(255,255,255,0.10)
--glass-hover:    rgba(255,255,255,0.12)
--glass-pressed:  rgba(255,255,255,0.16)
```

**Glass borders** (reflections, not outlines):
```
--border-default:  rgba(255,255,255,0.08)
--border-hover:     rgba(255,255,255,0.12)
--border-focus:     rgba(112,225,255,0.30)   /* cyan */
--border-selected:  rgba(91,124,250,0.35)    /* brand blue */
```

**Text hierarchy:**
```
--text-primary:   #FFFFFF
--text-secondary: rgba(255,255,255,0.72)
--text-muted:     rgba(255,255,255,0.45)
--text-disabled:  rgba(255,255,255,0.25)
```

**Career category accents** (icon/badge/left-border ONLY — the card itself always stays glass):
```
Engineering  #3B82F6     Medical      #22C55E
Business     #F59E0B     Arts         #EC4899
Law          #64748B     Defence      #DC2626
Agriculture  #84CC16     Research     #8B5CF6
Teaching     #14B8A6     Design       #F97316
```

**Chart palette** (max 5 colors per chart, never a rainbow palette):
```
Primary #5B7CFA · AI #70E1FF · Success #22C55E · Warning #F59E0B · Recommendation #8B5CF6
```

**Shadows / glows:**
```
--shadow-default:            rgba(0,0,0,0.30)   /* 0 10px 30px */
--shadow-floating:           rgba(0,0,0,0.45)   /* 0 20px 60px */
--shadow-dialog:             rgba(0,0,0,0.55)   /* 0 40px 120px */
--glow-ai:                   rgba(112,225,255,0.25)
--glow-recommendation:       rgba(139,92,246,0.25)
```

### 3.2 Migration Map — Old → New (apply everywhere, no hardcoded leftovers)

| Old token (current Aurora Compass theme) | Replace with |
|---|---|
| `--color-bg` (`#150E22`) | `--bg-primary` (`#05070D`) |
| `--color-surface` (`#201735`) | `--glass-surface` (`rgba(255,255,255,.05)`) |
| `--color-accent` / Nebula Violet (`#B583F0`) | `--brand` (`#5B7CFA`) |
| `--color-accent-2` / Aurora Teal (`#4FE0B0`) | `--ai-cyan` (`#70E1FF`) |
| `--color-cta` / Wayfinder Gold (`#F0A83E`) | `--brand` for all primary actions; keep amber reserved strictly for `--warning` |
| `--color-text-muted` (`#C3B8D9`) | `--text-secondary` (`rgba(255,255,255,.72)`) |
| `--color-muted` (`#9686B5`) | `--text-muted` (`rgba(255,255,255,.45)`) |
| `--color-destructive` (`#EF4444`) | Keep as `--error` (unchanged) |

Before deleting old tokens, `grep -r` the old variable names and old hex values across `frontend/src` to find every hardcoded usage (component-level inline hex values, Tailwind arbitrary values like `bg-[#B583F0]`, etc.) and convert each to the new semantic token. Do not leave any component with a raw hex/rgba value once this phase is done — everything must reference a token.

### 3.3 Spacing scale (px) — only these values, nothing invented
```
4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96
```

### 3.4 Radius scale (px) — only these values
```
Buttons: 18   Cards: 24   Dialogs: 28   Inputs: 18   Floating widgets: 32   Pills: 999
```

### 3.5 Shadow elevation (4 levels only)
```
1. Card default:  0 10px 30px rgba(0,0,0,.30)
2. Floating:      0 20px 60px rgba(0,0,0,.45)
3. Dialog:        0 40px 120px rgba(0,0,0,.55)
4. Glow (AI/Rec): 0 0 40px var(--glow-ai | --glow-recommendation)
```

### 3.6 Blur scale (px) — never use 5/10/15px, it reads as cheap
```
Inputs: 20   Navigation: 25   Default/Cards: 30   Sidebar: 35   Large cards: 40   Dialogs: 45
```

### 3.7 Typography

- **Primary font:** Geist (entire UI — buttons, forms, cards, nav, dashboard)
- **Fallback:** Inter
- **Monospace:** JetBrains Mono — statistics, IDs, code, technical/API values only, never body text

| Level | Desktop | Tablet | Mobile | Weight |
|---|---|---|---|---|
| Display (hero only) | 64px | 52px | 40px | 800 (ExtraBold) |
| H1 | 40px | — | — | 700 |
| H2 | 32px | — | — | 700 |
| H3 | 24px | — | — | 600 |
| H4 | 20px | — | — | 600 |
| H5 | 18px | — | — | 600 |
| H6 | 16px | — | — | 600 |
| Body large | 18px | — | — | 400 |
| Body normal | 16px | — | — | 400 |
| Body small | 14px | — | — | 500 (labels/metadata) |
| Body tiny | 12px | — | — | 500 (hints/badges — nothing smaller exists) |

Line-height: headings `1.15`, body `1.6`, long-form articles `1.8`, cards `1.4`. Max reading width ≈70 characters. Never use `font-weight: light` anywhere. Never center-align long paragraphs. Never go below 16px for body text.

### 3.8 Motion tokens

| Name | Duration | Use |
|---|---|---|
| ultraFast | 120ms | checkbox, toggle, icon |
| fast | 180ms | button hover/focus |
| standard | 250ms | cards, nav, inputs |
| medium | 350ms | dropdown, modal, sidebar |
| slow | 600ms | page transitions, hero |
| verySlow | 2.8s–90s | AI breathing (2.8s), aurora drift (40–90s), ambient motion |

Easing: `ease-out` for most interactions, spring for floating/glass components, `ease-in-out` for page transitions. Never linear. Never bounce/elastic overshoot.

### 3.9 Glass elevation system (4 levels — components inherit these, never redefine blur/shadow/border individually)

| Level | Examples | Blur | Reflection intensity | Shadow |
|---|---|---|---|---|
| 1 — Background glass | Sidebar, Navbar | 25–35px | 5% | default |
| 2 — Cards | Career cards, widgets, chat bubbles | 30–40px | 8% | default → floating |
| 3 — Floating | Dropdown, tooltip, calendar | 30–40px | 10% | floating |
| 4 — Modal | Dialog, overlay, notifications | 45px | 12% | dialog |

Higher elevation = stronger blur + stronger shadow + stronger reflection. **Never** brighter fill color. Max two layers of glass-on-glass ever (a glass card must not contain another glass card containing another glass card).

### 3.10 Lighting system

- One global light source, direction **top-left → bottom-right**. Every reflection and shadow in the app follows this same direction — never mix directions.
- Glass reflects only on its **top edge / upper-left corner**; bottom and right stay darker.
- AI elements glow cyan (`--ai-cyan`) at 15–25% intensity, pulsing on a 2.8s cycle only while AI is actively "thinking" or streaming.
- Recommendation cards get a purple (`--recommendation-purple`) ambient glow at 10% opacity, static, only while visible — never a continuous animation.
- Hover never changes color — only reflection intensity, border brightness, and shadow size increase (max `translateY(-2px)`).
- Focus states are always cyan, never blue or white — cyan focus = "AI is listening."

---

## 4. Target Folder Architecture

Create a new token layer. Nothing here exists yet in the repo — build it fresh, then wire every component to consume it.

```
frontend/src/design/
├── tokens/
│   ├── colors.ts       # exports the full palette in §3.1 + migration constants
│   ├── spacing.ts       # §3.3
│   ├── radius.ts        # §3.4
│   ├── shadow.ts        # §3.5
│   ├── blur.ts           # §3.6
│   ├── typography.ts    # §3.7
│   ├── motion.ts         # §3.8 (durations/easings — distinct from lib/motion.ts variants)
│   ├── glass.ts          # §3.9 elevation presets
│   └── lighting.ts       # §3.10
└── index.ts              # barrel export
```

`frontend/src/index.css` gets a Tailwind v4 `@theme` block (or `:root` custom properties, matching whatever convention the current file already uses — inspect it first) generated from these same values, so both Tailwind utility classes and raw CSS reference one source of truth. Do not let the CSS values and the TS values drift — the TS files are the canonical source; the CSS block is derived from them (comment this relationship at the top of `index.css`).

---

## 5. Phase-by-Phase Execution Plan

### Phase 1 — Foundation Tokens
**Tasks:**
1. Inspect current `frontend/src/index.css` and `frontend/src/App.css` fully; list every existing color/spacing/radius/shadow/blur token and every hardcoded hex/rgba value found via repo-wide grep.
2. Build `frontend/src/design/tokens/*` per §3–4.
3. Replace the `@theme`/`:root` block in `index.css` with the new token set. Remove the old Aurora Compass variables only after confirming (via grep) that nothing still references them.
4. Do not touch component logic in this phase — tokens only.

**Exit criteria:** `npm run build` succeeds; grep for old hex values (`#150E22`, `#201735`, `#B583F0`, `#4FE0B0`, `#F0A83E`, `#C3B8D9`, `#9686B5`) across `frontend/src` returns zero results outside of code comments/migration notes; every new token in §3 exists in both `design/tokens/` and `index.css`.

### Phase 2 — Shared Components
Refactor, in this order, reusing the Phase 1 tokens exclusively:

1. **`components/ui/GlassCard.tsx`** — becomes the single source of glass material for the whole app. Implement the 6-layer glass composition (reflection → border highlight → surface → blur → shadow → background) and accept an `elevation` prop (`1 | 2 | 3 | 4`) that maps to §3.9, rather than accepting raw blur/opacity props from callers.
2. **`components/ui/Button.tsx`** — reduce to exactly four variants: `primary` (solid brand blue), `secondary` (glass), `ghost` (transparent), `danger` (red). Each supports states: default, hover, pressed (`scale(.98)`), focused (cyan glow), disabled ("asleep," not gray), loading. Never a purple button variant — purple is reserved for recommendation UI only.
3. **`components/layout/AppShell.tsx`** — floating glass navbar + floating glass sidebar (elevation 1). Selected nav item becomes a glass capsule, not a colored rectangle. If navbar and sidebar are currently inline in this file, you may extract `Navbar` and `Sidebar` as child components under `components/layout/` for clarity — purely structural, no behavior change.
4. **`components/shared/AmbientOrbs.tsx`** — expand into the full background layer system from §3.10 / source spec Part 3: base color → atmospheric gradient → aurora lighting (4 blurred light sources: cyan top-left, purple top-right, brand-blue bottom-left, white-8% bottom-right) → faint neural-network line/node pattern (opacity 2–3%, random pulse 8–15s) → fine noise texture (opacity 1–2%) → vignette (10–15% edge darkening) → ambient cursor glow (radius 200–250px, 5–8% opacity, smoothed lag, never a hard spotlight). Keep the existing component name/export signature if it's imported elsewhere, to avoid breaking call sites — verify with grep before renaming anything.
5. **`components/OnboardingProgress.tsx`** — modern stepper: one question visible at a time, progress always shown, no page-like "Next/Next/Next" feel.
6. **`components/ChatMarkdown.tsx`** — AI message typography: headings/bullets/highlights instead of wall-of-text paragraphs; assistant bubbles are glass with a cyan reflection tint, never a plain bubble.
7. **`lib/motion.ts`** — update/add Framer Motion variants matching §3.8 exactly: `fadeUp`, `cardReveal`, `sequentialReveal` (staggered ~50–60ms per item), `aiBreathing` (2.8s glow pulse), `glassHover` (translateY(-2px) + reflection/border/shadow increase), `pageTransition` (fade → blur → fade-in → lift, never a horizontal slide of the whole page).

**Exit criteria:** every one of the six components above compiles, existing unit tests (`client.test.ts`, `authStore.test.ts`, any co-located tests) still pass, and manual smoke-check confirms no card anywhere uses a hardcoded shadow/blur/border value — all pull from `design/tokens`.

### Phase 3 — Layout & Chrome
- Ensure Navbar "almost disappears": logo, nav items, profile, search only — glass separates it from background, it never dominates.
- Sidebar is a floating glass sheet (not a solid rectangle), collapsible to icon-only.
- Any dialogs/modals/dropdowns/toasts currently implemented inline in pages should be normalized to shared glass primitives at elevation 3 (floating) or 4 (modal) per §3.9 — extract into `components/ui/` if not already separate (e.g. `Dialog.tsx`, `Dropdown.tsx`, `Toast.tsx`) only if these don't already exist as shared components; otherwise restyle in place.
- Skeleton loading states: replace any spinner usage with glass skeleton placeholders that mirror the final layout, with a left-to-right shimmer (1.8s loop).

**Exit criteria:** no bare `<div>` loading spinners remain; every floating UI element (dropdown/tooltip/dialog/toast) uses the same glass elevation system as cards; keyboard focus is visible (cyan ring) on every interactive element.

### Phase 4 — Feature Pages (migrate one at a time, commit after each)

For every page, preserve all existing data-fetching, form logic, validation, and routing — this phase is presentation-layer only.

1. **`pages/Landing.tsx`** — hero answers "what does this do" within 5 seconds; two CTAs max (primary + secondary, no third); asymmetric feature-card grid (not 3 equal cards); a live/animated AI-preview section showing Student → AI → Recommendation → Roadmap; largest aurora/lighting intensity of any page.
2. **`pages/Login.tsx`** / **`pages/Register.tsx`** — minimal: logo, one-line welcome, single glass auth card, no marketing content, calmest lighting in the app.
3. **`pages/Onboarding.tsx`** (+ `OnboardingProgress.tsx`) — conversational, one question at a time, AI visibly reacts to each answer before the next question appears (this needs a brief inline "AI response" moment between questions — a short generated/templated acknowledgment line is enough; do not wire new backend calls for this, keep it presentation-side).
4. **`pages/Dashboard.tsx`** — answers "what should I do today," greeting is personal ("Good Morning, [name]"), widgets: continue-roadmap, today's AI recommendation, progress, recent activity — no decorative/empty analytics widgets.
5. **`pages/CareerExplorer.tsx`** — search + floating filter chips (not dropdown overload) + adaptive masonry/asymmetric card grid; hover reveals salary/growth/future-scope on cards.
6. **`pages/CareerGallery.tsx`** — filtering animates cards (morph/fade/reposition), never instant disappearance.
7. **`pages/CounselingChat.tsx`** (+ `ChatMarkdown.tsx`) — this is the flagship page. Three-column feel: sidebar, conversation, AI insight panel (confidence, career matches, suggested follow-up questions, resources). AI "thinking" state breathes (glow expand/contract, 2.8s) instead of a spinner. Streaming text has a cyan cursor pulse and a slowly-moving reflection, never typing-dots.
8. **`pages/HistoryLog.tsx`** — reframe from a table into a connected timeline/journey (assessment → recommendation → roadmap started → skills learned → progress), using the same connected-node visual language as the Roadmap component.
9. **`pages/AdminCareers.tsx`** — same glass/token system, but reduced motion and reduced decorative lighting — this page is productivity-first, not experiential.

**Exit criteria per page:** page renders with zero hardcoded colors (grep check), all existing functionality (forms submit, data loads, routes navigate) verified unchanged, animations match the timing tokens in §3.8, and the page passes a quick contrast check on all body text.

### Phase 5 — Polish & QA
- Sweep for any remaining hardcoded hex/rgba/shadow/blur/spacing values anywhere in `frontend/src` — replace with tokens.
- Verify `prefers-reduced-motion`: aurora drift, node pulsing, and cursor-reactive glow must all disable; fades collapse to <150ms; all functionality remains.
- Verify keyboard navigation and visible focus rings across every page.
- Verify no glass-in-glass-in-glass nesting exceeds 2 levels anywhere.
- Confirm chart components (if any use Recharts/D3) pull from the 5-color chart palette only, never a rainbow scale.
- Run Lighthouse or equivalent informally for animation jank on a throttled CPU profile — background layers must stay smooth.

**Exit criteria:** full `npm run build` + full existing test suite green; `git diff --stat backend/` empty; manual pass through every page in both desktop and mobile viewport widths.

---

## 6. AI Experience Copy Conventions

Apply only to AI-voice UI copy (chat responses, onboarding acknowledgments, recommendation explanations, notifications) — not to app branding:

- AI identity in copy: **"Career Mentor AI"**. Personality: calm, professional, supportive, analytical — never jokey, never robotic, never uses more than an occasional single emoji (prefer none).
- Every recommendation shown must include a short "why" (bullet list of contributing factors), not just a career name + percentage.
- Confidence percentages are always paired with a plain-language explanation of what they're based on.
- Loading/processing states use short descriptive phrases ("Comparing career paths…", "Generating your roadmap…") instead of a generic spinner or "Loading…".
- Error copy is human and actionable ("I'm having trouble generating a recommendation right now — please try again in a moment"), never a raw API/error string.
- Never expose raw model output, prompts, or chain-of-thought in the UI.

---

## 7. Iconography

- Single icon library: **Lucide React** only (already likely a dependency — check `package.json` before adding it again). Do not mix in Heroicons/Feather/Material icons or emoji-as-icon.
- Style: outlined, rounded, 2px stroke. Never filled/3D/gradient icons.
- Sizes: 16px (small/inline), 20px (navigation), 24px (cards), 28px (feature icons), 40px (hero only).
- Colors: default 70% white, hover 100% white, active = brand blue, AI = cyan, recommendation = purple, status icons match their semantic color.
- Career category icon mapping should follow the accent-color mapping in §3.1 (Engineering=CPU/blue, Medical=HeartPulse/green, Business=Briefcase/amber, etc.) — reuse `lib/catalogs.ts` category data if it already defines categories, just add/confirm the icon+color pairing there instead of duplicating it per page.

---

## 8. Hard "Never Do" List (aggregated across the whole system)

- Never hardcode a color/shadow/blur/radius/spacing value inside a component — tokens only.
- Never create a purple button, a purple nav item, or use purple anywhere except recommendation UI.
- Never use cyan outside AI-activity contexts.
- Never use pure black (`#000000`) anywhere in backgrounds.
- Never use a spinner — use glass skeletons or the AI-breathing pattern.
- Never animate `width`/`height`/`top`/`left` for interaction feedback — animate `transform`/`opacity` only.
- Never nest glass more than two levels deep.
- Never introduce bounce/elastic easing.
- Never touch anything outside `frontend/`.
- Never add new pages, routes, or backend calls not already present.
- Never introduce the literal product name "CareerCompass AI."

---

## 9. Definition of Done

- [ ] All 5 phases complete, each with its own commit on `redesign/liquid-glass-ui`.
- [ ] Zero hardcoded design values remain in `frontend/src` (grep-verified).
- [ ] `npm run build` and full existing test suite pass.
- [ ] `git diff --stat backend/` is empty.
- [ ] Every page in `frontend/src/pages/` renders correctly at desktop and mobile widths with no console errors.
- [ ] Reduced-motion mode verified.
- [ ] `frontend/REDESIGN_NOTES.md` written summarizing what changed phase-by-phase, any deviations from this prompt (and why), and a short list of anything you deliberately left out-of-scope.

---

## 10. If You Get Stuck

Do not silently improvise outside the rules above. Instead, in `frontend/REDESIGN_NOTES.md`, log the specific ambiguity, the interpretation you chose, and why — then continue. The person reviewing this will read that file before merging.
