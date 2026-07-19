# Frontend Colour Analysis

This document provides an exhaustive, inch-by-inch analysis of all colours used across the frontend, including Tailwind classes, CSS variables, and hardcoded values.

## 1. Global Theme Variables (frontend/src/index.css)

These are the core custom colors defined in Tailwind v4 `@theme` block:

| Variable | Hex Code | Description/Usage |
| :--- | :--- | :--- |
| `--color-bg` | `#150E22` | Main background color (Very Dark Purple) |
| `--color-surface` | `#201735` | Surface/Card background color (Dark Purple) |
| `--color-text` | `#FFFFFF` | Primary text color (White) |
| `--color-text-muted` | `#C3B8D9` | Muted text color (Light grayish purple) |
| `--color-accent` | `#B583F0` | Primary accent color (Light Purple) |
| `--color-accent-2` | `#4FE0B0` | Secondary accent color (Teal/Mint) |
| `--color-muted` | `#9686B5` | Muted elements (Grayish purple) |
| `--color-cta` | `#F0A83E` | Call to Action color (Orange/Yellow) |
| `--color-cta-text` | `#1A1330` | Text on CTA buttons (Dark Purple/Black) |
| `--color-destructive` | `#EF4444` | Error/Destructive actions (Red) |

## 2. Color Usage Summary (By Color/Class)

This section lists every color-related class, hex code, or CSS variable found and the files they appear in.

### `#0A0F0D`
Used in:
- `frontend/src/pages/Landing.tsx`

### `#150E22`
Used in:
- `frontend/src/index.css`

### `#1A1330`
Used in:
- `frontend/src/index.css`

### `#1e1e2e`
Used in:
- `frontend/src/components/ChatMarkdown.tsx`

### `#201735`
Used in:
- `frontend/src/index.css`

### `#2d2d44`
Used in:
- `frontend/src/components/ChatMarkdown.tsx`

### `#4FE0B0`
Used in:
- `frontend/src/index.css`
- `frontend/src/pages/Landing.tsx`

### `#7c3aed`
Used in:
- `frontend/src/components/ChatMarkdown.tsx`

### `#8A9A94`
Used in:
- `frontend/src/pages/Landing.tsx`

### `#9686B5`
Used in:
- `frontend/src/index.css`

### `#9F8D8B`
Used in:
- `frontend/src/pages/Landing.tsx`

### `#B583F0`
Used in:
- `frontend/src/index.css`
- `frontend/src/pages/Landing.tsx`

### `#C3B8D9`
Used in:
- `frontend/src/index.css`

### `#D5F4F9`
Used in:
- `frontend/src/pages/Landing.tsx`

### `#D7C5B2`
Used in:
- `frontend/src/pages/Landing.tsx`

### `#EF4444`
Used in:
- `frontend/src/index.css`

### `#F0A83E`
Used in:
- `frontend/src/index.css`

### `#FFFFFF`
Used in:
- `frontend/src/index.css`

### `#a78bfa`
Used in:
- `frontend/src/components/ChatMarkdown.tsx`

### `#fff`
Used in:
- `frontend/src/components/ChatMarkdown.tsx`

### `bg-accent`
Used in:
- `frontend/src/components/layout/AppShell.tsx`
- `frontend/src/components/OnboardingProgress.tsx`
- `frontend/src/components/shared/AmbientOrbs.tsx`
- `frontend/src/pages/CareerExplorer.tsx`
- `frontend/src/pages/CareerGallery.tsx`
- `frontend/src/pages/CounselingChat.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/HistoryLog.tsx`
- `frontend/src/pages/Landing.tsx`
- `frontend/src/pages/Onboarding.tsx`

### `bg-accent-2`
Used in:
- `frontend/src/components/shared/AmbientOrbs.tsx`

### `bg-amber-500`
Used in:
- `frontend/src/lib/catalogs.ts`
- `frontend/src/pages/AdminCareers.tsx`
- `frontend/src/pages/CareerExplorer.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/Onboarding.tsx`

### `bg-bg`
Used in:
- `frontend/src/App.tsx`
- `frontend/src/components/layout/AppShell.tsx`
- `frontend/src/components/layout/AuthLayout.tsx`
- `frontend/src/components/shared/ErrorBoundary.tsx`
- `frontend/src/components/ui/GlassCard.tsx`
- `frontend/src/index.css`
- `frontend/src/lib/catalogs.ts`
- `frontend/src/pages/AdminCareers.tsx`
- `frontend/src/pages/CareerExplorer.tsx`
- `frontend/src/pages/CounselingChat.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/HistoryLog.tsx`
- `frontend/src/pages/Landing.tsx`
- `frontend/src/pages/Onboarding.tsx`

### `bg-black`
Used in:
- `frontend/src/pages/CareerGallery.tsx`
- `frontend/src/pages/Landing.tsx`

### `bg-blue-500`
Used in:
- `frontend/src/lib/catalogs.ts`
- `frontend/src/pages/AdminCareers.tsx`

### `bg-clip-text`
Used in:
- `frontend/src/pages/Dashboard.tsx`

### `bg-cta`
Used in:
- `frontend/src/components/shared/ErrorBoundary.tsx`
- `frontend/src/components/ui/Button.tsx`
- `frontend/src/pages/Landing.tsx`

### `bg-cta-text`
Used in:
- `frontend/src/pages/Landing.tsx`

### `bg-destructive`
Used in:
- `frontend/src/components/layout/AppShell.tsx`
- `frontend/src/components/shared/ErrorBoundary.tsx`
- `frontend/src/components/ui/Button.tsx`
- `frontend/src/pages/Login.tsx`
- `frontend/src/pages/Register.tsx`

### `bg-emerald-500`
Used in:
- `frontend/src/lib/catalogs.ts`
- `frontend/src/pages/AdminCareers.tsx`
- `frontend/src/pages/CareerExplorer.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/HistoryLog.tsx`

### `bg-gradient-to-r`
Used in:
- `frontend/src/components/OnboardingProgress.tsx`
- `frontend/src/pages/AdminCareers.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/Landing.tsx`
- `frontend/src/pages/Onboarding.tsx`

### `bg-gradient-to-tr`
Used in:
- `frontend/src/pages/CounselingChat.tsx`

### `bg-indigo-500`
Used in:
- `frontend/src/lib/catalogs.ts`

### `bg-orange-500`
Used in:
- `frontend/src/lib/catalogs.ts`

### `bg-pink-500`
Used in:
- `frontend/src/pages/HistoryLog.tsx`

### `bg-purple-500`
Used in:
- `frontend/src/lib/catalogs.ts`

### `bg-red-500`
Used in:
- `frontend/src/pages/AdminCareers.tsx`
- `frontend/src/pages/Onboarding.tsx`

### `bg-rose-500`
Used in:
- `frontend/src/lib/catalogs.ts`

### `bg-teal-500`
Used in:
- `frontend/src/lib/catalogs.ts`

### `bg-text-muted`
Used in:
- `frontend/src/pages/CounselingChat.tsx`

### `bg-transparent`
Used in:
- `frontend/src/components/ChatMarkdown.tsx`
- `frontend/src/components/OnboardingProgress.tsx`
- `frontend/src/pages/Landing.tsx`
- `frontend/src/pages/Onboarding.tsx`

### `bg-white`
Used in:
- `frontend/src/components/ChatMarkdown.tsx`
- `frontend/src/components/layout/AppShell.tsx`
- `frontend/src/components/OnboardingProgress.tsx`
- `frontend/src/components/ui/Button.tsx`
- `frontend/src/index.css`
- `frontend/src/pages/AdminCareers.tsx`
- `frontend/src/pages/CareerExplorer.tsx`
- `frontend/src/pages/CareerGallery.tsx`
- `frontend/src/pages/CounselingChat.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/HistoryLog.tsx`
- `frontend/src/pages/Landing.tsx`
- `frontend/src/pages/Login.tsx`
- `frontend/src/pages/Onboarding.tsx`
- `frontend/src/pages/Register.tsx`

### `border-2`
Used in:
- `frontend/src/App.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/Landing.tsx`

### `border-accent`
Used in:
- `frontend/src/components/layout/AppShell.tsx`
- `frontend/src/components/OnboardingProgress.tsx`
- `frontend/src/pages/CareerExplorer.tsx`
- `frontend/src/pages/CareerGallery.tsx`
- `frontend/src/pages/CounselingChat.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/HistoryLog.tsx`
- `frontend/src/pages/Landing.tsx`
- `frontend/src/pages/Login.tsx`
- `frontend/src/pages/Onboarding.tsx`
- `frontend/src/pages/Register.tsx`

### `border-accent-2`
Used in:
- `frontend/src/pages/Landing.tsx`

### `border-amber-500`
Used in:
- `frontend/src/lib/catalogs.ts`
- `frontend/src/pages/AdminCareers.tsx`
- `frontend/src/pages/CareerExplorer.tsx`
- `frontend/src/pages/Dashboard.tsx`

### `border-b`
Used in:
- `frontend/src/components/ChatMarkdown.tsx`
- `frontend/src/pages/AdminCareers.tsx`
- `frontend/src/pages/CareerExplorer.tsx`
- `frontend/src/pages/CareerGallery.tsx`
- `frontend/src/pages/CounselingChat.tsx`
- `frontend/src/pages/HistoryLog.tsx`
- `frontend/src/pages/Landing.tsx`
- `frontend/src/pages/Onboarding.tsx`

### `border-b-0`
Used in:
- `frontend/src/pages/Landing.tsx`
- `frontend/src/pages/Onboarding.tsx`

### `border-bg`
Used in:
- `frontend/src/pages/Landing.tsx`

### `border-blue-500`
Used in:
- `frontend/src/lib/catalogs.ts`
- `frontend/src/pages/AdminCareers.tsx`

### `border-collapse`
Used in:
- `frontend/src/components/ChatMarkdown.tsx`

### `border-cta`
Used in:
- `frontend/src/App.tsx`
- `frontend/src/pages/AdminCareers.tsx`
- `frontend/src/pages/Landing.tsx`

### `border-destructive`
Used in:
- `frontend/src/components/ui/Button.tsx`
- `frontend/src/pages/Login.tsx`
- `frontend/src/pages/Register.tsx`

### `border-emerald-500`
Used in:
- `frontend/src/lib/catalogs.ts`
- `frontend/src/pages/AdminCareers.tsx`
- `frontend/src/pages/HistoryLog.tsx`

### `border-emerald-700`
Used in:
- `frontend/src/pages/AdminCareers.tsx`

### `border-indigo-500`
Used in:
- `frontend/src/lib/catalogs.ts`

### `border-l`
Used in:
- `frontend/src/pages/AdminCareers.tsx`
- `frontend/src/pages/CareerExplorer.tsx`
- `frontend/src/pages/CareerGallery.tsx`
- `frontend/src/pages/Landing.tsx`

### `border-none`
Used in:
- `frontend/src/pages/Landing.tsx`

### `border-orange-500`
Used in:
- `frontend/src/lib/catalogs.ts`

### `border-pink-500`
Used in:
- `frontend/src/pages/HistoryLog.tsx`

### `border-purple-500`
Used in:
- `frontend/src/lib/catalogs.ts`

### `border-r`
Used in:
- `frontend/src/components/layout/AppShell.tsx`
- `frontend/src/pages/CounselingChat.tsx`

### `border-radius`
Used in:
- `frontend/src/index.css`

### `border-red-500`
Used in:
- `frontend/src/pages/AdminCareers.tsx`
- `frontend/src/pages/Onboarding.tsx`

### `border-rose-500`
Used in:
- `frontend/src/lib/catalogs.ts`

### `border-t`
Used in:
- `frontend/src/components/layout/AppShell.tsx`
- `frontend/src/pages/AdminCareers.tsx`
- `frontend/src/pages/CareerExplorer.tsx`
- `frontend/src/pages/CareerGallery.tsx`
- `frontend/src/pages/HistoryLog.tsx`
- `frontend/src/pages/Landing.tsx`
- `frontend/src/pages/Onboarding.tsx`

### `border-t-2`
Used in:
- `frontend/src/pages/CareerExplorer.tsx`
- `frontend/src/pages/CareerGallery.tsx`

### `border-t-amber-500`
Used in:
- `frontend/src/lib/catalogs.ts`

### `border-t-blue-500`
Used in:
- `frontend/src/lib/catalogs.ts`

### `border-t-emerald-500`
Used in:
- `frontend/src/lib/catalogs.ts`

### `border-t-indigo-500`
Used in:
- `frontend/src/lib/catalogs.ts`

### `border-t-orange-500`
Used in:
- `frontend/src/lib/catalogs.ts`

### `border-t-purple-500`
Used in:
- `frontend/src/lib/catalogs.ts`

### `border-t-rose-500`
Used in:
- `frontend/src/lib/catalogs.ts`

### `border-t-teal-500`
Used in:
- `frontend/src/lib/catalogs.ts`

### `border-t-transparent`
Used in:
- `frontend/src/App.tsx`
- `frontend/src/pages/Dashboard.tsx`

### `border-t-white`
Used in:
- `frontend/src/lib/catalogs.ts`

### `border-teal-500`
Used in:
- `frontend/src/lib/catalogs.ts`

### `border-transparent`
Used in:
- `frontend/src/components/OnboardingProgress.tsx`
- `frontend/src/pages/Onboarding.tsx`

### `border-white`
Used in:
- `frontend/src/components/ChatMarkdown.tsx`
- `frontend/src/components/layout/AppShell.tsx`
- `frontend/src/components/OnboardingProgress.tsx`
- `frontend/src/components/ui/Button.tsx`
- `frontend/src/components/ui/GlassCard.tsx`
- `frontend/src/index.css`
- `frontend/src/lib/catalogs.ts`
- `frontend/src/pages/AdminCareers.tsx`
- `frontend/src/pages/CareerExplorer.tsx`
- `frontend/src/pages/CareerGallery.tsx`
- `frontend/src/pages/CounselingChat.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/HistoryLog.tsx`
- `frontend/src/pages/Landing.tsx`
- `frontend/src/pages/Login.tsx`
- `frontend/src/pages/Onboarding.tsx`
- `frontend/src/pages/Register.tsx`

### `border-y`
Used in:
- `frontend/src/pages/Landing.tsx`

### `fill-accent`
Used in:
- `frontend/src/pages/CounselingChat.tsx`

### `fill-amber-400`
Used in:
- `frontend/src/pages/Onboarding.tsx`

### `outline-2`
Used in:
- `frontend/src/index.css`

### `outline-accent`
Used in:
- `frontend/src/index.css`

### `outline-none`
Used in:
- `frontend/src/index.css`
- `frontend/src/pages/AdminCareers.tsx`
- `frontend/src/pages/CareerExplorer.tsx`
- `frontend/src/pages/CareerGallery.tsx`
- `frontend/src/pages/CounselingChat.tsx`
- `frontend/src/pages/Login.tsx`
- `frontend/src/pages/Onboarding.tsx`
- `frontend/src/pages/Register.tsx`

### `outline-offset-2`
Used in:
- `frontend/src/index.css`

### `rgba(0,0,0,0.2)`
Used in:
- `frontend/src/components/ui/GlassCard.tsx`

### `rgba(213,244,249,0.08)`
Used in:
- `frontend/src/pages/Landing.tsx`

### `rgba(213,244,249,0.1)`
Used in:
- `frontend/src/pages/Landing.tsx`

### `rgba(240,168,62,0.3)`
Used in:
- `frontend/src/pages/Landing.tsx`

### `ring-0`
Used in:
- `frontend/src/pages/Onboarding.tsx`

### `shadow-2xl`
Used in:
- `frontend/src/pages/Landing.tsx`

### `shadow-accent`
Used in:
- `frontend/src/pages/CareerExplorer.tsx`
- `frontend/src/pages/CareerGallery.tsx`
- `frontend/src/pages/CounselingChat.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/Onboarding.tsx`

### `shadow-cta`
Used in:
- `frontend/src/components/ui/Button.tsx`

### `shadow-emerald-500`
Used in:
- `frontend/src/pages/Dashboard.tsx`

### `shadow-lg`
Used in:
- `frontend/src/components/layout/AppShell.tsx`
- `frontend/src/components/ui/Button.tsx`
- `frontend/src/pages/CareerExplorer.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/HistoryLog.tsx`
- `frontend/src/pages/Onboarding.tsx`

### `shadow-md`
Used in:
- `frontend/src/pages/CareerExplorer.tsx`
- `frontend/src/pages/CounselingChat.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/Onboarding.tsx`

### `shadow-xl`
Used in:
- `frontend/src/pages/CareerExplorer.tsx`
- `frontend/src/pages/CareerGallery.tsx`
- `frontend/src/pages/Landing.tsx`

### `text-accent`
Used in:
- `frontend/src/components/ChatMarkdown.tsx`
- `frontend/src/components/layout/AppShell.tsx`
- `frontend/src/components/OnboardingProgress.tsx`
- `frontend/src/pages/AdminCareers.tsx`
- `frontend/src/pages/CareerExplorer.tsx`
- `frontend/src/pages/CareerGallery.tsx`
- `frontend/src/pages/CounselingChat.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/HistoryLog.tsx`
- `frontend/src/pages/Landing.tsx`
- `frontend/src/pages/Login.tsx`
- `frontend/src/pages/Onboarding.tsx`
- `frontend/src/pages/Register.tsx`

### `text-blue-400`
Used in:
- `frontend/src/lib/catalogs.ts`
- `frontend/src/pages/AdminCareers.tsx`

### `text-cta`
Used in:
- `frontend/src/pages/AdminCareers.tsx`
- `frontend/src/pages/Landing.tsx`
- `frontend/src/pages/Login.tsx`
- `frontend/src/pages/Register.tsx`

### `text-cta-text`
Used in:
- `frontend/src/components/shared/ErrorBoundary.tsx`
- `frontend/src/components/ui/Button.tsx`
- `frontend/src/pages/Landing.tsx`

### `text-destructive`
Used in:
- `frontend/src/components/layout/AppShell.tsx`
- `frontend/src/components/shared/ErrorBoundary.tsx`
- `frontend/src/components/ui/Button.tsx`
- `frontend/src/pages/Login.tsx`
- `frontend/src/pages/Register.tsx`

### `text-indigo-400`
Used in:
- `frontend/src/lib/catalogs.ts`

### `text-muted`
Used in:
- `frontend/src/index.css`
- `frontend/src/pages/AdminCareers.tsx`
- `frontend/src/pages/CareerExplorer.tsx`
- `frontend/src/pages/CareerGallery.tsx`
- `frontend/src/pages/CounselingChat.tsx`
- `frontend/src/pages/Login.tsx`
- `frontend/src/pages/Register.tsx`

### `text-pink-400`
Used in:
- `frontend/src/pages/HistoryLog.tsx`

### `text-pink-500`
Used in:
- `frontend/src/pages/Dashboard.tsx`

### `text-purple-400`
Used in:
- `frontend/src/lib/catalogs.ts`

### `text-red-400`
Used in:
- `frontend/src/pages/AdminCareers.tsx`
- `frontend/src/pages/Onboarding.tsx`

### `text-text-muted`
Used in:
- `frontend/src/components/ChatMarkdown.tsx`
- `frontend/src/components/layout/AppShell.tsx`
- `frontend/src/components/OnboardingProgress.tsx`
- `frontend/src/components/shared/ErrorBoundary.tsx`
- `frontend/src/components/ui/Button.tsx`
- `frontend/src/lib/catalogs.ts`
- `frontend/src/pages/AdminCareers.tsx`
- `frontend/src/pages/CareerExplorer.tsx`
- `frontend/src/pages/CareerGallery.tsx`
- `frontend/src/pages/CounselingChat.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/HistoryLog.tsx`
- `frontend/src/pages/Landing.tsx`
- `frontend/src/pages/Login.tsx`
- `frontend/src/pages/Onboarding.tsx`
- `frontend/src/pages/Register.tsx`

### `text-transparent`
Used in:
- `frontend/src/pages/Dashboard.tsx`

### `text-white`
Used in:
- `frontend/src/components/ChatMarkdown.tsx`
- `frontend/src/components/layout/AppShell.tsx`
- `frontend/src/components/shared/ErrorBoundary.tsx`
- `frontend/src/components/ui/Button.tsx`
- `frontend/src/pages/AdminCareers.tsx`
- `frontend/src/pages/CareerExplorer.tsx`
- `frontend/src/pages/CareerGallery.tsx`
- `frontend/src/pages/CounselingChat.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/HistoryLog.tsx`
- `frontend/src/pages/Landing.tsx`
- `frontend/src/pages/Login.tsx`
- `frontend/src/pages/Onboarding.tsx`
- `frontend/src/pages/Register.tsx`

### `var(--color-accent)`
Used in:
- `frontend/src/index.css`

### `var(--color-bg)`
Used in:
- `frontend/src/index.css`

### `var(--color-surface)`
Used in:
- `frontend/src/index.css`

## 3. Directory & File Breakdown

This section goes folder by folder, file by file, listing exactly which colors are used inside them.

### `frontend/src/App.tsx`
**Colors/Classes used:**
- **Backgrounds**: `bg-bg`
- **Borders/Rings/Outlines**: `border-2`, `border-cta`, `border-t-transparent`

### `frontend/src/components/ChatMarkdown.tsx`
**Colors/Classes used:**
- **Backgrounds**: `bg-transparent`, `bg-white`
- **Text**: `text-accent`, `text-text-muted`, `text-white`
- **Borders/Rings/Outlines**: `border-b`, `border-collapse`, `border-white`
- **Other/Hex/Variables**: `#1e1e2e`, `#2d2d44`, `#7c3aed`, `#a78bfa`, `#fff`

### `frontend/src/components/OnboardingProgress.tsx`
**Colors/Classes used:**
- **Backgrounds**: `bg-accent`, `bg-gradient-to-r`, `bg-transparent`, `bg-white`
- **Text**: `text-accent`, `text-text-muted`
- **Borders/Rings/Outlines**: `border-accent`, `border-transparent`, `border-white`

### `frontend/src/components/layout/AppShell.tsx`
**Colors/Classes used:**
- **Backgrounds**: `bg-accent`, `bg-bg`, `bg-destructive`, `bg-white`
- **Text**: `text-accent`, `text-destructive`, `text-text-muted`, `text-white`
- **Borders/Rings/Outlines**: `border-accent`, `border-r`, `border-t`, `border-white`
- **Other/Hex/Variables**: `shadow-lg`

### `frontend/src/components/layout/AuthLayout.tsx`
**Colors/Classes used:**
- **Backgrounds**: `bg-bg`

### `frontend/src/components/shared/AmbientOrbs.tsx`
**Colors/Classes used:**
- **Backgrounds**: `bg-accent`, `bg-accent-2`

### `frontend/src/components/shared/ErrorBoundary.tsx`
**Colors/Classes used:**
- **Backgrounds**: `bg-bg`, `bg-cta`, `bg-destructive`
- **Text**: `text-cta-text`, `text-destructive`, `text-text-muted`, `text-white`

### `frontend/src/components/ui/Button.tsx`
**Colors/Classes used:**
- **Backgrounds**: `bg-cta`, `bg-destructive`, `bg-white`
- **Text**: `text-cta-text`, `text-destructive`, `text-text-muted`, `text-white`
- **Borders/Rings/Outlines**: `border-destructive`, `border-white`
- **Other/Hex/Variables**: `shadow-cta`, `shadow-lg`

### `frontend/src/components/ui/GlassCard.tsx`
**Colors/Classes used:**
- **Backgrounds**: `bg-bg`
- **Borders/Rings/Outlines**: `border-white`
- **Other/Hex/Variables**: `rgba(0,0,0,0.2)`

### `frontend/src/index.css`
**Colors/Classes used:**
- **Backgrounds**: `bg-bg`, `bg-white`
- **Text**: `text-muted`
- **Borders/Rings/Outlines**: `border-radius`, `border-white`, `outline-2`, `outline-accent`, `outline-none`, `outline-offset-2`
- **Other/Hex/Variables**: `#150E22`, `#1A1330`, `#201735`, `#4FE0B0`, `#9686B5`, `#B583F0`, `#C3B8D9`, `#EF4444`, `#F0A83E`, `#FFFFFF`, `var(--color-accent)`, `var(--color-bg)`, `var(--color-surface)`

### `frontend/src/lib/catalogs.ts`
**Colors/Classes used:**
- **Backgrounds**: `bg-amber-500`, `bg-bg`, `bg-blue-500`, `bg-emerald-500`, `bg-indigo-500`, `bg-orange-500`, `bg-purple-500`, `bg-rose-500`, `bg-teal-500`
- **Text**: `text-blue-400`, `text-indigo-400`, `text-purple-400`, `text-text-muted`
- **Borders/Rings/Outlines**: `border-amber-500`, `border-blue-500`, `border-emerald-500`, `border-indigo-500`, `border-orange-500`, `border-purple-500`, `border-rose-500`, `border-t-amber-500`, `border-t-blue-500`, `border-t-emerald-500`, `border-t-indigo-500`, `border-t-orange-500`, `border-t-purple-500`, `border-t-rose-500`, `border-t-teal-500`, `border-t-white`, `border-teal-500`, `border-white`

### `frontend/src/pages/AdminCareers.tsx`
**Colors/Classes used:**
- **Backgrounds**: `bg-amber-500`, `bg-bg`, `bg-blue-500`, `bg-emerald-500`, `bg-gradient-to-r`, `bg-red-500`, `bg-white`
- **Text**: `text-accent`, `text-blue-400`, `text-cta`, `text-muted`, `text-red-400`, `text-text-muted`, `text-white`
- **Borders/Rings/Outlines**: `border-amber-500`, `border-b`, `border-blue-500`, `border-cta`, `border-emerald-500`, `border-emerald-700`, `border-l`, `border-red-500`, `border-t`, `border-white`, `outline-none`

### `frontend/src/pages/CareerExplorer.tsx`
**Colors/Classes used:**
- **Backgrounds**: `bg-accent`, `bg-amber-500`, `bg-bg`, `bg-emerald-500`, `bg-white`
- **Text**: `text-accent`, `text-muted`, `text-text-muted`, `text-white`
- **Borders/Rings/Outlines**: `border-accent`, `border-amber-500`, `border-b`, `border-l`, `border-t`, `border-t-2`, `border-white`, `outline-none`
- **Other/Hex/Variables**: `shadow-accent`, `shadow-lg`, `shadow-md`, `shadow-xl`

### `frontend/src/pages/CareerGallery.tsx`
**Colors/Classes used:**
- **Backgrounds**: `bg-accent`, `bg-black`, `bg-white`
- **Text**: `text-accent`, `text-muted`, `text-text-muted`, `text-white`
- **Borders/Rings/Outlines**: `border-accent`, `border-b`, `border-l`, `border-t`, `border-t-2`, `border-white`, `outline-none`
- **Other/Hex/Variables**: `shadow-accent`, `shadow-xl`

### `frontend/src/pages/CounselingChat.tsx`
**Colors/Classes used:**
- **Backgrounds**: `bg-accent`, `bg-bg`, `bg-gradient-to-tr`, `bg-text-muted`, `bg-white`
- **Text**: `text-accent`, `text-muted`, `text-text-muted`, `text-white`
- **Borders/Rings/Outlines**: `border-accent`, `border-b`, `border-r`, `border-white`, `outline-none`
- **Other/Hex/Variables**: `fill-accent`, `shadow-accent`, `shadow-md`

### `frontend/src/pages/Dashboard.tsx`
**Colors/Classes used:**
- **Backgrounds**: `bg-accent`, `bg-amber-500`, `bg-bg`, `bg-clip-text`, `bg-emerald-500`, `bg-gradient-to-r`, `bg-white`
- **Text**: `text-accent`, `text-pink-500`, `text-text-muted`, `text-transparent`, `text-white`
- **Borders/Rings/Outlines**: `border-2`, `border-accent`, `border-amber-500`, `border-t-transparent`, `border-white`
- **Other/Hex/Variables**: `shadow-accent`, `shadow-emerald-500`, `shadow-lg`, `shadow-md`

### `frontend/src/pages/HistoryLog.tsx`
**Colors/Classes used:**
- **Backgrounds**: `bg-accent`, `bg-bg`, `bg-emerald-500`, `bg-pink-500`, `bg-white`
- **Text**: `text-accent`, `text-pink-400`, `text-text-muted`, `text-white`
- **Borders/Rings/Outlines**: `border-accent`, `border-b`, `border-emerald-500`, `border-pink-500`, `border-t`, `border-white`
- **Other/Hex/Variables**: `shadow-lg`

### `frontend/src/pages/Landing.tsx`
**Colors/Classes used:**
- **Backgrounds**: `bg-accent`, `bg-bg`, `bg-black`, `bg-cta`, `bg-cta-text`, `bg-gradient-to-r`, `bg-transparent`, `bg-white`
- **Text**: `text-accent`, `text-cta`, `text-cta-text`, `text-text-muted`, `text-white`
- **Borders/Rings/Outlines**: `border-2`, `border-accent`, `border-accent-2`, `border-b`, `border-b-0`, `border-bg`, `border-cta`, `border-l`, `border-none`, `border-t`, `border-white`, `border-y`
- **Other/Hex/Variables**: `#0A0F0D`, `#4FE0B0`, `#8A9A94`, `#9F8D8B`, `#B583F0`, `#D5F4F9`, `#D7C5B2`, `rgba(213,244,249,0.08)`, `rgba(213,244,249,0.1)`, `rgba(240,168,62,0.3)`, `shadow-2xl`, `shadow-xl`

### `frontend/src/pages/Login.tsx`
**Colors/Classes used:**
- **Backgrounds**: `bg-destructive`, `bg-white`
- **Text**: `text-accent`, `text-cta`, `text-destructive`, `text-muted`, `text-text-muted`, `text-white`
- **Borders/Rings/Outlines**: `border-accent`, `border-destructive`, `border-white`, `outline-none`

### `frontend/src/pages/Onboarding.tsx`
**Colors/Classes used:**
- **Backgrounds**: `bg-accent`, `bg-amber-500`, `bg-bg`, `bg-gradient-to-r`, `bg-red-500`, `bg-transparent`, `bg-white`
- **Text**: `text-accent`, `text-red-400`, `text-text-muted`, `text-white`
- **Borders/Rings/Outlines**: `border-accent`, `border-b`, `border-b-0`, `border-red-500`, `border-t`, `border-transparent`, `border-white`, `outline-none`, `ring-0`
- **Other/Hex/Variables**: `fill-amber-400`, `shadow-accent`, `shadow-lg`, `shadow-md`

### `frontend/src/pages/Register.tsx`
**Colors/Classes used:**
- **Backgrounds**: `bg-destructive`, `bg-white`
- **Text**: `text-accent`, `text-cta`, `text-destructive`, `text-muted`, `text-text-muted`, `text-white`
- **Borders/Rings/Outlines**: `border-accent`, `border-destructive`, `border-white`, `outline-none`

## 4. Recommendations for Theming

1. **Update `frontend/src/index.css`**: The easiest way to re-theme the entire app is to change the CSS variables in the `@theme` block. Tailwind classes like `bg-bg`, `text-accent`, etc. will automatically adapt.
2. **Audit Hardcoded Opacities**: Classes like `bg-white/[0.06]` and `bg-white/[0.02]` are used for the glassmorphism effects. If you change the primary background to a lighter theme, these white overlays might need to become dark (e.g., `bg-black/[0.06]`).
3. **Arbitrary Values**: Look out for arbitrary classes like `bg-[#2A1F45]`, `border-[#3A2A60]`, etc. in specific components (e.g., in `Hero.tsx` or `CounselingSession.tsx`). These won't change when you update `index.css`. You should replace them with theme variables if possible.
