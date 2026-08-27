<div align="center">

# 🎯 SCPR — Smart Career Path Recommendation

### _AI-Powered Career Guidance for India's Next Generation_

<br />

![Version](https://img.shields.io/badge/version-2.0.0-5B7CFA?style=for-the-badge&labelColor=0A0A0F)
![Status](https://img.shields.io/badge/status-LIVE-00E676?style=for-the-badge&labelColor=0A0A0F)
![Engines](https://img.shields.io/badge/scoring_engines-10-FF6B6B?style=for-the-badge&labelColor=0A0A0F)
![Careers](https://img.shields.io/badge/career_catalog-742+-70E1FF?style=for-the-badge&labelColor=0A0A0F)

![NestJS](https://img.shields.io/badge/NestJS_11-E0234E?style=flat-square&logo=nestjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB_7-47A248?style=flat-square&logo=mongodb&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![Vite](https://img.shields.io/badge/Vite_8-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

<br />

> **A student completes SCPR's onboarding and never feels like they took a test.**  
> They answered questions about their subjects, interests, strengths, aspirations,  
> and life constraints — and the system hands them a short, ranked, explained  
> list of careers that *actually fit them*, with a roadmap to get there.

<br />

[Features](#-features) •
[Architecture](#-architecture) •
[Tech Stack](#-tech-stack) •
[Getting Started](#-getting-started) •
[Project Structure](#-project-structure) •
[API Reference](#-api-reference) •
[Design System](#-design-system--liquid-glass) •
[Contributing](#-contributing)

</div>

---

## 🧠 The Problem

Traditional career counseling in India is:
- **Generic** — same advice for every student regardless of their unique profile
- **Opaque** — no transparency into why a career is recommended
- **Biased** — often driven by parental/social expectations rather than student aptitude
- **Inaccessible** — professional counseling costs ₹5,000–₹25,000+ per session

SCPR solves this with a **deterministic multi-engine scoring pipeline** enhanced by **AI personalization** — giving every Class 10 student a traceable, explainable, and defensible career recommendation for free.

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎓 Smart Onboarding
An 8-step natural conversation (not a test) that captures a student's complete profile:

1. **Personal** — Name, location, board
2. **Academic** — Subjects, grades, strengths
3. **Interests** — 12 interactive sliders
4. **Skills** — 10 self-rated competencies
5. **Goals** — Ranked life aspirations
6. **Work Preferences** — Environment & style
7. **Constraints** — Budget, location, duration
8. **Scenarios** — AI-generated situational questions

</td>
<td width="50%">

### 🤖 10-Engine Recommendation Pipeline
A state-of-the-art scoring architecture:

| Engine | Weight |
|--------|--------|
| 📚 Academic | 25% |
| 💡 Interest | 20% |
| 🛠️ Skill | 20% |
| 🧬 Personality | 15% |
| 🚧 Constraint | 10% |
| 📈 Opportunity | 10% |

+ **Hybrid Ranking** → **Diversity** → **Confidence** → **Explainability**

</td>
</tr>
<tr>
<td width="50%">

### 💬 AI Counselor Chat
- Context-aware conversations with student profile injection
- Rolling memory compression (auto-summarizes after 10 messages)
- Intent classification: career / roadmap / general queries
- **Live Mermaid.js roadmap rendering** in chat
- Safety filters and content guardrails

</td>
<td width="50%">

### 🗺️ Interactive Career Roadmaps
- **742+ career-specific Mermaid flowcharts** rendered in-browser
- Step-by-step progression from Class 10 to career entry
- Dynamically matched to each career in the catalog
- Scrollable, zoomable, dark-mode optimized diagrams

</td>
</tr>
<tr>
<td width="50%">

### 🎨 Premium Liquid Glass UI
- Glassmorphism design with backdrop blur effects
- Animated ambient orbs and particle systems
- Scroll-reveal animations powered by Framer Motion
- Full dark mode with custom color tokens
- Responsive design (mobile → desktop)

</td>
<td width="50%">

### 📊 Additional Features
- **Career Gallery** — Visual browsing with category filters
- **Career Explorer** — Search, save, and compare careers
- **PDF Reports** — Auto-generated career recommendation PDFs
- **Activity History** — Unified timeline of all interactions
- **Admin Panel** — Career catalog management with draft/publish workflow
- **Analytics Dashboard** — Platform, career, and AI usage insights

</td>
</tr>
</table>

---

## 🏗️ Architecture

### High-Level System Design

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          SCPR SYSTEM ARCHITECTURE                        │
│                                                                          │
│   ┌─────────────────────┐         ┌─────────────────────────────────┐  │
│   │   React 19 Frontend  │  REST   │       NestJS 11 Backend         │  │
│   │   Vite + Tailwind    │────────▶│                                 │  │
│   │   Liquid Glass UI    │         │  ┌─────────┐  ┌──────────────┐ │  │
│   └─────────────────────┘         │  │  Auth    │  │  Onboarding  │ │  │
│                                    │  └─────────┘  └──────────────┘ │  │
│                                    │  ┌─────────┐  ┌──────────────┐ │  │
│                                    │  │ Careers  │  │Recommendation│ │  │
│                                    │  └─────────┘  └──────┬───────┘ │  │
│                                    │  ┌─────────┐         │         │  │
│                                    │  │Counselor│    ┌────▼─────┐   │  │
│                                    │  └─────────┘    │V2 Engine │   │  │
│                                    │                 │ Pipeline │   │  │
│                                    │                 └────┬─────┘   │  │
│                                    └──────────────────────┼─────────┘  │
│                                                           │            │
│   ┌─────────────────────┐         ┌──────────────────────▼─────────┐  │
│   │    MongoDB Atlas     │◀────────│      AI Service (Multi-LLM)    │  │
│   │    12 Collections    │         │  Gemini · Groq · Mistral       │  │
│   └─────────────────────┘         │  DeepSeek · GLM · OpenRouter   │  │
│                                    └────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

### V2 Recommendation Pipeline

```
  Student Profile          6 Scoring Engines              Post-Processing
 ┌──────────────┐     ┌───────────────────────┐     ┌──────────────────────┐
 │ StudentDNA   │     │ Academic    ─── 0.25   │     │                      │
 │ (10-dim      │     │ Interest    ─── 0.20   │     │  Hybrid Ranking      │
 │  vector,     │────▶│ Skill       ─── 0.20   │────▶│       ▼              │
 │  0-100 per   │     │ Personality ─── 0.15   │     │  Diversity Filter    │
 │  trait)      │     │ Constraint  ─── 0.10   │     │       ▼              │
 └──────────────┘     │ Opportunity ─── 0.10   │     │  AI Personalization  │
                      └───────────────────────┘     │       ▼              │
 ┌──────────────┐                                    │  Confidence Score    │
 │ Career       │     Each engine produces a         │       ▼              │
 │ Catalog      │────▶ScoreBreakdown with:           │  Explainability      │
 │ (742+)       │     • score, weight, confidence    │       ▼              │
 └──────────────┘     • bonuses & penalties          │  Top 5 Ranked        │
                      • matched/missing factors      │  Recommendations     │
                      • human-readable reasoning     └──────────────────────┘
```

### Key Design Principle

> **LLM as Co-Pilot, Not Decision-Maker**  
> The AI never decides eligibility, invents careers, or overrides scores.  
> It only explains and personalizes the deterministic shortlist that the backend already computed.

---

## 🛠️ Tech Stack

### Backend

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | NestJS 11 | Modular backend with dependency injection |
| **Language** | TypeScript 5.7+ | End-to-end type safety |
| **Database** | MongoDB 7 + Mongoose 9 | Document store with ODM |
| **Auth** | Passport.js + JWT + bcrypt | Stateless authentication with lockout protection |
| **Validation** | class-validator + ajv | DTO validation + AI response schema validation |
| **AI** | Custom Multi-Provider | 5 LLM providers with key pooling, retry, and fallback |
| **PDF** | pdfmake | Server-side PDF generation (no Puppeteer) |
| **Testing** | Jest + ts-jest | 26 test files, ~2,700 test lines |

### Frontend

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | React 19 | Modern UI with concurrent features |
| **Build** | Vite 8 | Sub-second HMR development |
| **Styling** | Tailwind CSS 4 | Utility-first with custom design tokens |
| **State** | Zustand + TanStack Query | Client state + server cache management |
| **Routing** | React Router 7 | Lazy-loaded routes with auth guards |
| **Animation** | Framer Motion 12 | Scroll-reveal, page transitions, micro-interactions |
| **Diagrams** | Mermaid.js 11 | Interactive career roadmap rendering |
| **Icons** | Lucide React | Consistent icon system |

### AI Providers

| Provider | Model | Status | Use Case |
|----------|-------|--------|----------|
| 🟢 Gemini | 2.5 Flash | Active | Career ranking, roadmap gen, trait backfill |
| 🟡 Groq | LLaMA 3.3-70B | Active (TPD-limited) | Counselor chat (low-latency) |
| 🟢 Mistral | Large Latest | Active | Report summaries |
| ⚫ DeepSeek | Chat | Configured | Fallback provider |
| ⚫ GLM | 4 Plus | Configured | Available reserve |

### Infrastructure

| Tool | Purpose |
|------|---------|
| Docker | Multi-stage production builds |
| docker-compose | Full stack orchestration |
| nginx | Frontend static serving + SPA routing |
| MongoDB 7 | Volume-backed persistent storage |

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | v20+ |
| MongoDB | v7+ (local or Atlas) |
| npm | v9+ |
| Git | Latest |

### 1. Clone the Repository

```bash
git clone https://github.com/Vihangpatil37/BHENCHOD.git
cd "parul project"
```

### 2. Environment Setup

Create `.env` files in both `backend/` and `frontend/` directories:

**`backend/.env`**
```env
MONGODB_URI=mongodb://localhost:27017/scpr
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# AI Provider Keys (at least one required)
GEMINI_API_KEYS=key1,key2,key3
GROQ_API_KEYS=key1,key2
MISTRAL_API_KEYS=key1

# Engine Version
RECOMMENDATION_ENGINE_VERSION=v2
```

**`frontend/.env`**
```env
VITE_API_URL=http://localhost:3000/api
```

### 3. Install & Run

**Quick Start (Windows):**
```bash
.\start.bat
```

**Manual Setup:**

```bash
# Terminal 1 — Backend
cd backend
npm install
npm run start:dev        # → http://localhost:3000

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev              # → http://localhost:5173
```

### 4. Seed Career Data

```bash
cd backend

# Seed full career catalog (runs automatically on first start)
npm run seed

# Seed interactive Mermaid roadmaps
npm run seed:roadmaps
```

### 5. Docker Deployment

```bash
docker-compose up --build -d
```

This spins up:
- **Backend** container (NestJS on port 3000)
- **Frontend** container (nginx on port 80)
- **MongoDB** container (port 27017 with persistent volume)

---

## 📂 Project Structure

```
scpr/
├── 📁 backend/                          # NestJS 11 Backend
│   └── src/
│       ├── 📁 ai-service/               # Multi-LLM Orchestration Layer
│       │   ├── providers/               #   Provider adapters (Gemini, Groq, etc.)
│       │   ├── prompts/                 #   Markdown prompt templates
│       │   ├── config/                  #   Provider-model configuration
│       │   ├── router.service.ts        #   Task → provider routing
│       │   ├── key-pool.service.ts      #   Round-robin API key management
│       │   ├── retry-manager.service.ts #   Cross-provider retry & fallback
│       │   ├── cache.service.ts         #   SHA-256 response caching
│       │   ├── json-validator.service.ts#   ajv schema validation + repair
│       │   └── token-logger.service.ts  #   Per-call token/cost logging
│       │
│       ├── 📁 auth/                     # Authentication & Authorization
│       │   ├── strategies/              #   JWT + Local passport strategies
│       │   ├── guards/                  #   JwtAuthGuard, RolesGuard
│       │   └── schemas/                 #   User schema (bcrypt, lockout)
│       │
│       ├── 📁 careers/                  # Career Catalog Management
│       │   ├── import/                  #   Seed scripts & roadmap importer
│       │   ├── schemas/                 #   Career schema (742+ entries)
│       │   └── dto/                     #   Create/Update career DTOs
│       │
│       ├── 📁 onboarding/              # Student Profile & DNA
│       │   ├── schemas/                 #   StudentProfile, StudentDNA
│       │   ├── trait-engine.service.ts  #   10-dim DNA vector computation
│       │   └── dto/                     #   Per-step validation DTOs
│       │
│       ├── 📁 recommendation/          # 🧠 Core Recommendation Engine
│       │   ├── engines/                 #   10 scoring engine implementations
│       │   │   ├── base-scoring.engine.ts       # Abstract base class
│       │   │   ├── academic.engine.ts           # Academic alignment
│       │   │   ├── interest.engine.ts           # Interest matching
│       │   │   ├── skill.engine.ts              # Skill gap analysis
│       │   │   ├── personality.engine.ts        # DNA-trait correlation
│       │   │   ├── constraint.engine.ts         # Budget/location/duration
│       │   │   ├── opportunity.engine.ts        # Market demand signals
│       │   │   ├── hybrid-ranking.engine.ts     # Weighted aggregation
│       │   │   ├── diversity.engine.ts          # Category spread
│       │   │   ├── confidence.engine.ts         # Input completeness
│       │   │   └── explainability.engine.ts     # Human-readable reasons
│       │   ├── config/                  #   Weight configs & thresholds
│       │   └── interfaces/              #   ScoreBreakdown contract
│       │
│       ├── 📁 counselor/               # AI Chat & Guidance
│       ├── 📁 dashboard/               # User Dashboard Aggregation
│       ├── 📁 analytics/               # Event Tracking & Insights
│       ├── 📁 history/                 # Unified Activity Timeline
│       └── 📁 health/                  # Health Check Endpoint
│
├── 📁 frontend/                         # React 19 Frontend
│   └── src/
│       ├── 📁 pages/                    # 10 Application Pages
│       │   ├── Landing.tsx              #   Marketing page with animations
│       │   ├── Login.tsx                #   Auth with ambient orbs
│       │   ├── Register.tsx             #   User registration
│       │   ├── Dashboard.tsx            #   Journey state & overview
│       │   ├── Onboarding.tsx           #   8-step wizard with confetti
│       │   ├── CareerExplorer.tsx        #   Search & compare careers
│       │   ├── CareerGallery.tsx         #   Visual gallery + roadmaps
│       │   ├── CounselingChat.tsx        #   AI chat with Mermaid diagrams
│       │   ├── HistoryLog.tsx            #   Activity timeline
│       │   └── AdminCareers.tsx          #   Catalog management
│       │
│       ├── 📁 components/               # Reusable UI Components
│       │   ├── ui/                      #   GlassCard, Button, Skeleton, Mermaid
│       │   └── ChatMarkdown.tsx         #   Markdown + Mermaid renderer
│       │
│       ├── 📁 store/                    # Zustand State Management
│       ├── 📁 api/                      # Axios Client + Interceptors
│       └── 📁 lib/                      # Utilities, motion, catalogs
│
├── 📁 catalogs/                         # Career Data (8 Sector Files)
│   ├── SCPR_Master_Career_Catalog_Part_1_Science_v2.md
│   ├── SCPR_Master_Career_Catalog_Part_2_Commerce.md
│   ├── SCPR_Master_Career_Catalog_Part_3_Arts_Humanities.md
│   ├── SCPR_Master_Career_Catalog_Part_4_Diploma.md
│   ├── SCPR_Master_Career_Catalog_Part_5_ITI_Polytechnic.md
│   ├── SCPR_Master_Career_Catalog_Part_6_Vocational_Skill_Development.md
│   ├── SCPR_Master_Career_Catalog_Part_7_Government_Defence.md
│   └── SCPR_Master_Career_Catalog_Part_8_Emerging_Future_Careers.md
│
├── docker-compose.yml                   # Full Stack Orchestration
├── start.bat                            # Windows Quick Start
└── PROJECT_ANALYSIS.md                  # Deep Architectural Documentation
```

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login (returns JWT pair) |
| `POST` | `/api/auth/refresh` | Refresh access token |
| `POST` | `/api/auth/logout` | Invalidate session |
| `GET` | `/api/auth/me` | Get current user profile |

### Onboarding
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/onboarding/profile` | Get student profile |
| `PATCH` | `/api/onboarding/step/:stepKey` | Save a step |
| `POST` | `/api/onboarding/complete` | Finalize & compute DNA |
| `POST` | `/api/onboarding/generate-scenarios` | AI scenario generation |

### Careers
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/careers` | List all careers |
| `GET` | `/api/careers/:code` | Get career details + roadmap |
| `POST` | `/api/careers/saved` | Save/unsave a career |
| `GET` | `/api/careers/saved` | List saved careers |

### Recommendations
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/recommendations/generate` | Generate recommendations |
| `GET` | `/api/recommendations/latest` | Get latest recommendations |
| `POST` | `/api/recommendations/:id/feedback` | Submit feedback |

### Counselor
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/counselor/chat` | Send a message |
| `GET` | `/api/counselor/conversations` | List conversations |
| `GET` | `/api/counselor/conversations/:id` | Get conversation history |

### Dashboard & Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard` | Dashboard state + insights |
| `POST` | `/api/reports/generate` | Generate PDF report |
| `GET` | `/api/reports/:id/download` | Download PDF |

---

## 🎨 Design System — Liquid Glass

SCPR uses a custom **Liquid Glass** design system — a premium dark-mode-first UI built on glassmorphism principles.

### Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#050507` | Page backgrounds |
| `--bg-secondary` | `#0A0A0F` | Card backgrounds |
| `--bg-tertiary` | `#10131A` | Elevated surfaces |
| `--brand` | `#5B7CFA` | Primary actions, links |
| `--ai-cyan` | `#70E1FF` | AI-related elements |
| `--success` | `#00E676` | Positive states |
| `--warning` | `#FFD740` | Caution states |
| `--danger` | `#FF5252` | Error states |

### UI Components
- **GlassCard** — Frosted glass container with border glow
- **Button** — Multi-variant (primary, ghost, outline) with loading states
- **Skeleton** — Shimmer loading placeholders
- **Mermaid** — Reusable diagram renderer with dark theme integration
- **ChatMarkdown** — Rich markdown with code blocks, tables, and diagrams

### Animations
- **Ambient Orbs** — Floating gradient spheres on auth pages
- **Scroll Reveal** — `fadeUp` motion variants on scroll
- **Page Transitions** — Smooth route transitions via Framer Motion
- **Confetti** — Celebration burst on onboarding completion
- **Micro-interactions** — Hover scales, focus rings, loading spinners

---

## 📊 Project Metrics

| Metric | Count |
|--------|------:|
| Backend Modules | 11 |
| Frontend Pages | 10 |
| V2 Scoring Engines | 10 |
| Career Catalog | 742+ |
| API Endpoints | 50+ |
| MongoDB Collections | 12 |
| LLM Providers | 5 + OpenRouter |
| Backend Source Files | 117 |
| Frontend Source Files | 38 |
| Test Files | 28 |
| Backend Source Lines | ~10,700 |
| Frontend Source Lines | ~5,800 |
| Test Lines | ~2,700 |
| Build Phases Complete | P0–P7 |

---

## 🤝 Contributing

1. **Fork** this repository
2. **Create** your feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'feat: add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

Please read `WORKFLOW.md` for detailed git conventions and commit message format.

---

## 📄 License

This project is proprietary and developed for the **Smart Career Path Recommendation** initiative.

---

<div align="center">

**Built with ❤️ for India's students**

*Every student deserves to know their options — not just the ones their parents heard about.*

<br />

![Made with TypeScript](https://img.shields.io/badge/Made_with-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Powered by AI](https://img.shields.io/badge/Powered_by-AI-5B7CFA?style=for-the-badge&logo=openai&logoColor=white)
![For Students](https://img.shields.io/badge/For-Students-00E676?style=for-the-badge&logo=googlescholar&logoColor=white)

</div>
