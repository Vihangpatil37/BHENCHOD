# SCPR Frontend UI Migration — Execution Prompt

**Paste this whole document as the task prompt for your coding agent (Claude Code, etc.) inside the repo that contains both folders.** It is grounded in an actual audit of your two codebases — not a generic plan.

---

## 0. Role & Mission

You are an expert React/TypeScript frontend engineer performing a **visual migration**, not a rewrite. Two real folders exist in this project:

- `frontend/` — the **current, production** SCPR app. Small, functional, minimal styling. This is the app you will edit.
- `reference/` — the **design-reference** SCPR app. Large, fully styled, premium UI. **Read-only.** You copy its visual language, animation patterns, and component composition — never its business logic, never its API calls, never its routes wholesale.

Your job: make `frontend/` **look and animate like `reference/`** while every existing API call, state field, store, and route in `frontend/` keeps working exactly as it does today.

If you ever find yourself about to delete or rewrite a `client.get/post/put/delete(...)` call, a Zustand store field, or an onboarding step key from `frontend/` — **stop**. That is business logic. Only touch JSX structure, class names, and add animation wrappers.

---

## 1. Ground Truth (audited, not assumed)

### 1.1 `frontend/` (current — what you edit)

- Stack: React 19.2, Vite 8, **Tailwind CSS v4** (`@tailwindcss/vite`, CSS-first, no `tailwind.config.js`), Zustand 5, `@tanstack/react-query` 5 (installed but not really used yet), `axios`, `react-router-dom` 7, `lucide-react`.
- No `components/` folder at all. Everything lives in 7 flat page files under `src/pages/`:

| File | Lines | Route | API calls it owns (must be preserved) |
|---|---|---|---|
| `Login.tsx` | 101 | `/login` | `POST /auth/login` |
| `Register.tsx` | 118 | `/register` | `POST /auth/register` |
| `Dashboard.tsx` | 413 | `/` | `GET /dashboard`, `GET /reports/history`, `POST /reports/generate`, `GET /reports/status/:id`, `GET /reports/download/:id`, `POST /auth/logout` |
| `Onboarding.tsx` | 885 | `/onboarding` | `GET /onboarding/resume`, `PUT /onboarding/step/:stepKey`, `POST /onboarding/complete`, `POST /auth/logout` — 4-step wizard: `personal → academic → interests → goals` |
| `CareerExplorer.tsx` | 585 | `/careers` | `GET /careers`, `GET /careers/saved`, `GET /careers/:code`, `GET /careers/related/:code`, `POST /careers/save`, `DELETE /careers/save/:code`, `GET /recommendations/latest`, `POST /recommendations/regenerate`, `POST /auth/logout` |
| `CounselingChat.tsx` | 526 | `/chat` | `GET /counselor/conversations`, `GET /counselor/conversations/:id`, `POST /counselor/chat`, `POST /counselor/regenerate`, `POST /counselor/feedback`, `POST /auth/logout` |
| `HistoryLog.tsx` | 293 | `/history` | `GET /history`, `POST /auth/logout` |

- `src/store/authStore.ts` — Zustand store: `user, accessToken, refreshToken, setAuth, clearAuth, updateAccessToken`. **Do not rename these fields.**
- `src/api/client.ts` — axios instance with request interceptor (JWT attach) and response interceptor (envelope unwrap `{data,timestamp,requestId} → data`, plus refresh-token retry queue). **Do not touch this file's logic.**
- Every page currently hand-rolls its own sidebar (`Home, BookOpen, Compass, MessageSquare, History, LogOut` icons repeated in every file) and its own logout call. This duplication is exactly what Phase 1's shared `AppShell` should eliminate.
- Colors today: plain Tailwind `slate-*` grays. No design tokens, no motion library, no glassmorphism.

### 1.2 `reference/` (design source — read only)

- Stack: React 19.2, Vite 8, **Tailwind CSS v3** (`tailwind.config.js` + PostCSS), `framer-motion`, `clsx` + `tailwind-merge` (via a `cn()` helper), `zustand`, `@tanstack/react-query`, `@studio-freight/lenis` (smooth scroll), `zod`, `react-markdown`, `@supabase/supabase-js`.
- Fully modular: `components/{landing,auth,dashboard,careers,recommendation,counselor,profile,assessment,navigation,shared}/`, `pages/`, `hooks/`, `services/`, `queries/`, `store/`, `types/`, `lib/`.
- Product name matches exactly: **"SCPR – Smart Career Path Recommendation System"** — confirms this is the same product's design-forward build, not an unrelated template.
- Route `/profile` + `components/profile/ProfileWizard/` with `steps/Step1Personal, Step2Academic, Step3Interests, Step4Goals` — **this is a 1:1 structural match** to `frontend/`'s `Onboarding.tsx` (same 4 step keys). This is your cleanest, highest-confidence migration target.
- No standalone reusable `<Button>` component exists in `reference/` — buttons are `motion.button` with repeated Tailwind class strings. You will need to **extract** a `Button` component in Phase 1 by generalizing the class patterns you see repeated across `reference/src/components/**` and `reference/src/pages/**`, not copy one file.

### 1.3 The one real technical conflict: Tailwind v4 vs v3

`frontend/` is already on **Tailwind v4's CSS-first config** (`@import "tailwindcss"` in `index.css`, no JS config file). `reference/` is on **Tailwind v3** with a JS config and `rgb(var(--x) / <alpha-value>)` CSS variables for opacity support.

**Decision: stay on Tailwind v4 in `frontend/`. Do not downgrade. Do not add a `tailwind.config.js`.** Port the design tokens using Tailwind v4's `@theme` directive instead (exact block in section 2). Tailwind v4 supports opacity modifiers (`bg-accent/50`) natively on plain hex colors defined in `@theme`, so you don't need the `rgb(var(...))` triplet trick `reference/` uses — it's a v3 workaround you don't need.

---

## 2. Design Tokens — paste this into `frontend/src/index.css`

Replace the current contents of `frontend/src/index.css` with:

```css
@import "tailwindcss";

@theme {
  --color-bg: #150E22;
  --color-surface: #201735;
  --color-text: #FFFFFF;
  --color-text-muted: #C3B8D9;
  --color-accent: #B583F0;
  --color-accent-2: #4FE0B0;
  --color-muted: #9686B5;
  --color-cta: #F0A83E;
  --color-cta-text: #1A1330;
  --color-destructive: #EF4444;

  --font-jakarta: "Plus Jakarta Sans", sans-serif;
  --font-anton: "Anton", sans-serif;
}

@layer base {
  body {
    @apply bg-bg text-text font-jakarta antialiased;
    overflow-x: hidden;
  }
}

/* Glassmorphism utilities — copied verbatim from reference/src/index.css */
@layer utilities {
  .glass-card {
    @apply backdrop-blur-[20px] bg-white/[0.06] border border-white/[0.08];
  }
  .glass-orb {
    @apply blur-[120px] opacity-[0.18];
  }
  .focus-ring {
    @apply focus:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2;
  }
}

.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
.custom-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.15) transparent; }
```

Add the fonts to `frontend/index.html` `<head>` (copy exactly from `reference/index.html`):

```html
<meta name="theme-color" content="#150E22" />
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
```

Also update the `<title>` in `frontend/index.html` to `SCPR - Smart Career Path Recommendation System`.

---

## 3. Dependencies to add to `frontend/package.json`

```bash
cd frontend
npm install framer-motion clsx tailwind-merge
```

Do **not** add `@studio-freight/lenis`, `zod`, `react-markdown`, or `@supabase/supabase-js` yet — nothing in the current codebase needs them. Add `react-markdown` only when you get to Phase 4 (AI Counselor) if `frontend/`'s chat responses need markdown rendering — check first, don't assume.

Then create `frontend/src/lib/utils.ts` (copy verbatim, it's tiny and framework-agnostic):

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

And `frontend/src/lib/motion.ts` (copy verbatim from `reference/src/lib/motion.ts` — these are pure animation variants, zero business logic, safe to import 1:1):

```ts
import type { Variants } from 'framer-motion';

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: 'easeOut' } },
};
export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};
```

---

## 4. Page-by-page migration map

For each row: keep every function/hook/API call in the "Preserve" column completely intact. Rebuild only the JSX/markup, following the visual composition of the "Copy visual patterns from" column.

| `frontend/` file to edit | Preserve (business logic) | Copy visual patterns from `reference/` |
|---|---|---|
| `pages/Login.tsx` | the `POST /auth/login` call, form state, `setAuth()` | `pages/AuthPage.tsx`, `components/auth/AuthCard/`, `components/auth/EmailLoginForm/`, `components/auth/LoadingOverlay/` |
| `pages/Register.tsx` | `POST /auth/register` call, form state | `components/auth/EmailSignupForm/`, `components/auth/PrivacyNotice/` |
| `pages/Dashboard.tsx` | `fetchDashboardData`, report-generation polling (`handleStartReportGen`, `pollReportStatus`), all state shapes | `pages/DashboardPage.tsx` + `components/dashboard/{Greeting,AIInsight,JourneyTracker,CareerSnapshot,ProfileRing,QuickActions,NextAction,MotivationBanner,RecentActivity}` |
| `pages/Onboarding.tsx` | `STEPS` array/keys, `fetchResume`, `getStepData`, `PUT /onboarding/step/:key` save-per-step logic, `complete` call | `components/profile/ProfileWizard/`, `steps/Step1Personal`, `steps/Step2Academic` (incl. `Class10Fields`/`Class12Fields`/`DiplomaFields`), `steps/Step3Interests`, `steps/Step4Goals`, `shared/{FieldWrapper,SelectChip,WizardNavigation,StepIndicator}` |
| `pages/CareerExplorer.tsx` | all `careers/*` and `recommendations/*` calls, save/unsave logic | `pages/careers/{CareersExplorer,CareerDetail}.tsx`, `components/careers/{CareerCard,CategoryPills,FilterSidebar,SearchBar,VirtualCareerGrid}`, `components/recommendation/{TopMatchHero,MatchCard,AISummary,LowConfidenceWarning}` |
| `pages/CounselingChat.tsx` | all `counselor/*` calls, conversation state | `pages/counselor/CounselorHome.tsx`, `components/counselor/{ChatWindow,ConversationSidebar,MessageBubble}`, `hooks/ai/useStreaming.ts` (pattern only — your streaming call target stays your own backend route) |
| `pages/HistoryLog.tsx` | `GET /history` call + filters | `pages/history/HistoryPage.tsx` |
| *(new)* public landing at `/` before login | none — this is net-new, currently `frontend/` has no landing page | `pages/Landing.tsx` + entire `components/landing/**` tree |
| *(new, extracted from every page)* `components/layout/AppShell.tsx` | the repeated sidebar/logout block currently copy-pasted in all 6 authenticated pages | `components/navigation/{TopBar,BottomNav,FloatingAIButton}` |

**Reports:** `reference/` has a dedicated `pages/report/ReportHome.tsx`. Keep report generation inline inside your Dashboard for now (that's where the logic lives today) — just restyle it using `ReportHome.tsx`'s visual patterns for the progress/download states. Don't split it into a new route unless you separately decide to; that's a routing change, not a UI migration.

---

## 5. Shared component library to build first (Phase 1 scope)

Create `frontend/src/components/` with these folders. Build components as **generalizations** of repeated patterns you find in `reference/`, not copies of a single file (most of these don't exist as standalone components in `reference/` — you're extracting them):

```
components/
  ui/
    Button.tsx          # variants: primary (cta gold), secondary (glass), ghost, destructive
    GlassCard.tsx        # copy near-verbatim from reference/src/components/shared/GlassCard.tsx
    Input.tsx
    Badge.tsx
    Modal.tsx
    Skeleton.tsx         # base pattern from reference/src/components/shared/Skeletons/Skeletons.tsx
    EmptyState.tsx
    Toast.tsx
    ProgressRing.tsx     # base pattern from reference/src/components/profile/ProfileHealth/ProfileHealthRing.tsx
  layout/
    AppShell.tsx         # sidebar + topbar + mobile bottom nav wrapper, replaces per-page duplication
    AuthLayout.tsx        # centered card layout for Login/Register
  shared/
    AmbientOrbs.tsx       # copy from reference/src/components/shared/AmbientOrbs/
    SectionReveal.tsx     # copy from reference/src/components/shared/SectionReveal.tsx (scroll-in wrapper)
    ErrorBoundary.tsx     # copy from reference/src/components/shared/ErrorBoundary.tsx
```

`GlassCard.tsx` reference implementation (copy this one verbatim, it's pure presentation):

```tsx
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  className?: string;
}

export const GlassCard = ({ children, className, ...props }: GlassCardProps) => {
  return (
    <motion.div
      className={twMerge(
        "bg-bg/65 backdrop-blur-[20px] rounded-[32px] border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.2)]",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};
```

---

## 6. Execution order

Work in this order. After each phase, run `npm run build` in `frontend/` and confirm every existing route still calls the same API endpoints (grep for the endpoint strings listed in section 1.1 — none should have disappeared).

1. **Phase 1 — Foundation:** design tokens (section 2), dependencies (section 3), shared `ui/` + `layout/` components (section 5), `AppShell` replacing the 6 duplicated sidebars.
2. **Phase 2 — Auth & Landing:** build the landing page (net-new), restyle Login/Register inside `AuthLayout` — API calls untouched.
3. **Phase 3 — Dashboard & Core Modules:** Dashboard, Career Explorer, Reports UI.
4. **Phase 4 — AI & Onboarding:** Onboarding → styled as ProfileWizard, Counseling Chat, History.
5. **Phase 5 — Polish:** animations pass, responsive pass, remove any leftover `slate-*` classes, accessibility/keyboard nav, lazy-load routes like `reference/App.tsx` does with `React.lazy`.

This document is the standing reference for *what* maps to *what*. When you're ready to execute a specific phase, ask for that phase by number and you'll get the full step-by-step build doc (component list, exact acceptance criteria) scoped to only the files in that phase's row above.

---

## 7. Non-negotiable rules (repeat, because this is the part most likely to get violated under time pressure)

- Never change a Zustand store field name, an API path, an HTTP method, or a request/response shape.
- Never remove the `client.ts` interceptor logic (JWT attach, 401 refresh queue, envelope unwrap).
- Never import runtime logic (hooks, services, stores) from `reference/` — only visual/animation code (`motion.ts`, class name patterns, layout structure).
- Every restyled page must still hit the exact same endpoints listed in section 1.1 — verify with a grep before calling a page "done."
- Stay on Tailwind v4 CSS-first config. No `tailwind.config.js`.
- If a reference component pulls in a dependency not listed in section 3 (e.g. `react-virtuoso`, `@studio-freight/lenis`), treat that as a deliberate decision point, not an automatic add — flag it instead of silently installing.
