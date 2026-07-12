# SCPR - Smart Career Path Recommendation System
## Comprehensive Project Analysis & Documentation

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [System Architecture Diagram](#3-system-architecture-diagram)
4. [Module Breakdown](#4-module-breakdown)
5. [Data Flow & Workflow Diagrams](#5-data-flow--workflow-diagrams)
6. [Technical Stack](#6-technical-stack)
7. [Domain Model](#7-domain-model)
8. [Recommendation Pipeline](#8-recommendation-pipeline)
9. [AI Service Architecture](#9-ai-service-architecture)
10. [API Surface](#10-api-surface)
11. [Engineering Rules & Principles](#11-engineering-rules--principles)
12. [Project Status & Progress](#12-project-status--progress)
13. [File Structure](#13-file-structure)

---

## 1. Project Overview

### Purpose
SCPR (Smart Career Path Recommendation System) is an AI-powered career counseling platform designed specifically for Class 10 students. Unlike traditional chatbot-based approaches, SCPR uses a **deterministic engine** to narrow down career options, with AI used only for personalization and explanation — never for decision-making.

### Key Value Proposition
- Students complete an 8-step natural onboarding flow (not a test)
- System produces traceable, explainable career recommendations
- Every recommendation is deterministically computed from code
- AI personalizes and explains, but never decides eligibility
- Full transparency: students can see *why* each career fits them

### Vision Statement
> A student completes SCPR's onboarding and never feels like they took a test. They answered questions about their subjects, interests, what they're good at, what they want out of life, and how they handle pressure — and at the end, the system hands them a short, ranked, explained list of careers that actually fit them, with a roadmap to get there.

---

## 2. High-Level Architecture

The system follows a clean, modular architecture with strict boundaries between concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                          SCPR System Architecture                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────┐    ┌─────────────────────┐              │
│  │   React 19 Frontend   │    │   NestJS 11 Backend  │              │
│  │  (TypeScript + Vite)  │───▶│  (TypeScript)        │              │
│  └─────────────────────┘    └──────────┬──────────┘              │
│                                            │                          │
│                                            ▼                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                        Backend Modules                          ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────────┐  ││
│  │  │   Auth   │ │ Onboarding│ │   Careers    │ │Recommendation│  ││
│  │  └──────────┘ └──────────┘ └──────────────┘ └──────────────┘  ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────────┐  ││
│  │  │Dashboard │ │ Counselor │ │   Reports    │ │  Analytics   │  ││
│  │  └──────────┘ └──────────┘ └──────────────┘ └──────────────┘  ││
│  │  ┌─────────────────────┐ ┌──────────────┐                    ││
│  │  │    AI Service        │ │    History    │                    ││
│  │  │ (Multi-LLM Orch.)    │ │               │                    ││
│  │  └─────────────────────┘ └──────────────┘                    ││
│  └─────────────────────────────────────────────────────────────┘│
│                                            │                          │
│                                            ▼                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                      External Dependencies                      ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  ││
│  │  │ MongoDB  │ │   JWT    │ │  AI LLM   │ │   PDF Gen    │  ││
│  │  │  Atlas  │ │  Auth    │ │ Providers │ │  (pdfmake)   │  ││
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. System Architecture Diagram

### Mermaid Architecture Flow

```mermaid
flowchart TD
    subgraph Frontend["React 19 Frontend\nTypeScript + Vite"]
        A1[Login/Register] -->|JWT Auth| A2[Dashboard]
        A2 --> A3[Onboarding Wizard]
        A2 --> A4[Career Explorer]
        A2 --> A5[Counselor Chat]
        A2 --> A6[Recommendations]
        A2 --> A7[Reports]
        A2 --> A8[History]
    end
    
    subgraph Backend["NestJS 11 Backend\nTypeScript"]
        B1[Auth Module] -->|JWT Guard| B2[Health Module]
        B3[Onboarding Module] --> B4[Trait Engine]
        B5[Careers Module] --> B6[Eligibility Engine]
        B7[Recommendation Module] --> B8[Trait Matching Engine]
        B9[AI Service Module] --> B10[Provider Adapters]
        B11[Counselor Module] --> B9
        B12[Dashboard Module] --> B3 & B5 & B7
        B13[Reports Module] --> B7
        B14[Analytics Module] --> B3 & B7 & B9
        B15[History Module] --> B3 & B7 & B11
    end
    
    subgraph AI["AI Service - Multi-LLM"]
        C1[Router Service] --> C2[Key Pool]
        C1 --> C3[Retry Manager]
        C1 --> C4[Prompt Builder]
        C1 --> C5[Cache Service]
        C1 --> C6[Token Logger]
        C1 --> C7[JSON Validator]
        C2 --> D1[Gemini Provider]
        C2 --> D2[Groq Provider]
        C2 --> D3[Mistral Provider]
        C2 --> D4[DeepSeek Provider]
        C2 --> D5[GLM Provider]
    end
    
    subgraph Data["MongoDB Atlas"]
        E1[User Collection]
        E2[StudentProfile Collection]
        E3[StudentDNAHistory Collection]
        E4[Career Collection]
        E5[SavedCareer Collection]
        E6[Recommendation Collection]
        E7[AIRequestLog Collection]
        E8[Conversation Collection]
        E9[AnalyticsEvent Collection]
        E10[Report Collection]
    end
    
    Frontend -->|API Calls| Backend
    Backend -->|Mongoose ODM| Data
    Backend -->|AI Calls| AI
    AI -->|Logs| Data
```

### Mermaid Component Diagram

```mermaid
C4Context
    title SCPR System Context Diagram
    
    Person(student, "Class 10 Student", "Completes onboarding\nReceives recommendations")
    Person(admin, "Administrator", "Manages career catalog\nReviews AI backfills")
    
    System(scpod, "SCPR System", "Smart Career Path Recommendation")
    System(mongodb, "MongoDB Atlas", "Document Database")
    System(gemini, "Gemini API", "Google LLM Provider")
    System(groq, "Groq API", "LLM Provider")
    System(mistral, "Mistral API", "LLM Provider")
    System(deepseek, "DeepSeek API", "LLM Provider")
    System(glm, "GLM API", "LLM Provider")
    
    Rel(student, scpod, "Uses", "HTTPS/REST")
    Rel(admin, scpod, "Administers", "HTTPS/REST")
    Rel(scpod, mongodb, "Stores data", "Mongoose/ODM")
    Rel(scpod, gemini, "Calls LLM", "HTTPS/REST")
    Rel(scpod, groq, "Calls LLM", "HTTPS/REST")
    Rel(scpod, mistral, "Calls LLM", "HTTPS/REST")
    Rel(scpod, deepseek, "Calls LLM", "HTTPS/REST")
    Rel(scpod, glm, "Calls LLM", "HTTPS/REST")
```

---

## 4. Module Breakdown

### Backend Modules (10 Core Modules)

| Module | Responsibility | Dependencies | Key Features |
|--------|---------------|--------------|--------------|
| `auth` | Authentication & Authorization | None | JWT issuance, register/login/refresh, password hashing, failed attempt lockout |
| `health` | System Health Checks | None | Public `/health` endpoint, backend status |
| `ai-service` | Multi-LLM Orchestration | None | Provider adapters, routing, retry, caching, prompt management |
| `careers` | Career Catalog Management | `ai-service` | Career CRUD, trait weights, eligibility constraints, backfill |
| `onboarding` | Student Onboarding Flow | None | 8-step wizard, profile management, DNA computation |
| `recommendation` | Career Recommendation Engine | `ai-service`, `careers`, `onboarding` | Eligibility engine, trait matching, AI personalization |
| `counselor` | AI Chat & Guidance | `ai-service` | Conversation management, context building, intent classification |
| `dashboard` | User Dashboard | `onboarding`, `recommendation`, `careers` | Progress tracking, insights, next actions |
| `reports` | PDF Report Generation | `onboarding`, `recommendation` | PDF generation with pdfmake, status tracking |
| `analytics` | Event Tracking | None | Fire-and-forget logging, admin dashboards |
| `history` | Unified Timeline | `onboarding`, `recommendation`, `counselor` | Chronological feed of all user activities |

### Frontend Structure

| Directory | Purpose | Key Components |
|-----------|---------|----------------|
| `pages/` | React Page Components | Login, Register, Dashboard, Onboarding (8 steps), Careers, Counselor, Reports, History |
| `store/` | Zustand State Management | authStore (JWT in memory), onboarding state, UI state |
| `api/` | API Client & Services | Axios client with interceptors, endpoint wrappers |
| `assets/` | Static Assets | Images, styles, fonts |

---

## 5. Data Flow & Workflow Diagrams

### Mermaid - User Journey Flow

```mermaid
journey
    title Student User Journey
    section Authentication
      Register: 5: User
      Login: 5: User
    section Onboarding
      Personal Info: 5: User
      Academic Details: 5: User
      Interests: 5: User
      Skills: 5: User
      Goals: 5: User
      Work Preferences: 5: User
      Constraints: 5: User
      Scenarios: 5: User
    section Recommendations
      Generate Recommendations: 4: System
      View Top 5 Careers: 5: User
    section Exploration
      Explore Careers: 5: User
      Save Careers: 5: User
      Chat with Counselor: 5: User
      Generate Report: 5: User
      View History: 5: User
```

### Mermaid - Recommendation Pipeline Flow

```mermaid
flowchart TD
    subgraph Input["Student Input"]
        A[StudentProfile] -->|Contains| B[Academic Data]
        A --> C[Interests]
        A --> D[Skills]
        A --> E[Goals]
        A --> F[Constraints]
        A --> G[Scenario Responses]
    end
    
    subgraph TraitComputation["Trait Engine"]
        B & C & D & E & F & G --> H[StudentDNA\n10-dimensional vector]
    end
    
    subgraph Engine["Recommendation Engine"]
        H --> I[Eligibility Engine\nMongoDB Query]
        I -->|Eligible Careers| J[Trait Matching Engine\nCosine Similarity]
        J -->|Top 20 Candidates| K[AI Personalization\nSingle LLM Call]
        K -->|Top 5 Ranked| L[Final Recommendations]
    end
    
    subgraph Output["Output"]
        L --> M[Recommendation Document]
        L --> N[Explanations & Roadmaps]
        L --> O[Dashboard Display]
        L --> P[PDF Report]
    end
    
    subgraph Careers["Career Catalog"]
        Q[Career Collection\n~40 seed careers] -->|Trait Weights| J
        Q -->|Eligibility Rules| I
    end
    
    style Input fill:#e1f5fe
    style TraitComputation fill:#fff3e0
    style Engine fill:#e8f5e9
    style Output fill:#f3e5f5
    style Careers fill:#fce4ec
```

### Mermaid - AI Service Flow

```mermaid
flowchart TD
    subgraph Request["AI Service Request"]
        A[aiService.run\n(taskType, context)] --> B[Router Service]
    end
    
    subgraph Routing["Provider Selection"]
        B --> C[Get Provider List\nfrom taskType]
        C --> D[Primary Provider]
        D -->|Success| E[Return Response]
        D -->|Failure| F[Retry Manager]
        F --> G[Next Key in Pool]
        G -->|Success| E
        G -->|Exhausted| H[Next Provider\nin Fallback Chain]
        H --> D
    end
    
    subgraph Processing["Request Processing"]
        D --> I[Key Pool Service\nGet Next Key]
        I --> J[Prompt Builder\nLoad & Interpolate Template]
        J --> K[Provider Adapter\nCall LLM API]
        K --> L[Cache Service\nCheck/Store]
        K --> M[Token Logger\nLog AIRequestLog]
        K --> N[JSON Validator\nValidate & Repair]
    end
    
    subgraph Response["Standardized Response"]
        N --> O[Normalize to\nStandard Shape]
        O --> E
    end
    
    subgraph Providers["LLM Providers"]
        P1[Gemini] --> K
        P2[Groq] --> K
        P3[Mistral] --> K
        P4[DeepSeek] --> K
        P5[GLM] --> K
    end
    
    style Request fill:#bbdefb
    style Routing fill:#c8e6c9
    style Processing fill:#ffecb3
    style Response fill:#ffcdd2
    style Providers fill:#f8bbd0
```

### Mermaid - Onboarding Step Flow

```mermaid
flowchart LR
    subgraph Steps["8 Onboarding Steps"]
        A[1. Personal] --> B[2. Academic]
        B --> C[3. Interests]
        C --> D[4. Skills]
        D --> E[5. Goals]
        E --> F[6. Work Preferences]
        F --> G[7. Constraints]
        G --> H[8. Scenarios]
    end
    
    subgraph Engine["Trait Engine"]
        H --> I[Compute StudentDNA\n10 traits: 0-100]
    end
    
    subgraph Storage["Data Storage"]
        A & B & C & D & E & F & G & H --> J[StudentProfile\nMongoDB]
        I --> K[StudentDNA\nEmbedded in Profile]
        I --> L[StudentDNAHistory\nAppend-only Log]
    end
    
    subgraph Trigger["Auto-Trigger"]
        H --> M[Onboarding Complete Event]
        M --> N[Generate Recommendations]
    end
    
    style Steps fill:#e3f2fd
    style Engine fill:#fff9c4
    style Storage fill:#f1f8e9
    style Trigger fill:#ffecb3
```

### Mermaid - Counselor Chat Flow

```mermaid
flowchart TD
    subgraph UserInput["User Chat Input"]
        A[User Message] --> B[Context Builder]
    end
    
    subgraph Context["Context Assembly"]
        B --> C[Get Recent Messages]
        C --> D{History > 10 messages?}
        D -->|Yes| E[Get Rolling Summary]
        D -->|No| F[Use Full History]
        E --> F
        F --> G[Add User Message]
        G --> H[Build Context Payload]
    end
    
    subgraph Intent["Intent Classification"]
        H --> I[Classify Intent\ncareer/roadmap/general]
        I --> J[Shape Prompt\nBased on Intent]
    end
    
    subgraph AI["AI Processing"]
        J --> K[aiService.run\n('counselor_chat')]
        K --> L[Get AI Response]
    end
    
    subgraph PostProcess["Response Handling"]
        L --> M[Safety Filter]
        M --> N{Valid JSON?}
        N -->|Yes| O[Parse Structured Response]
        N -->|No| P[Render as Markdown]
        O --> P
        P --> Q[Save Message]
    end
    
    subgraph Storage["Storage"]
        Q --> R[ConversationMessage\nCollection]
        Q --> S[Update Conversation\nSummary if needed]
    end
    
    style UserInput fill:#e1f5fe
    style Context fill:#fff3e0
    style Intent fill:#e8f5e9
    style AI fill:#ffecb3
    style PostProcess fill:#f3e5f5
    style Storage fill:#fce4ec
```

### Mermaid - Sequence Diagram: Recommendation Generation

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Onboarding
    participant Recommendation
    participant EligibilityEngine
    participant TraitMatching
    participant AIService
    participant CareerCatalog
    participant MongoDB
    
    User->>Frontend: Complete Onboarding
    Frontend->>Backend: POST /onboarding/complete
    Backend->>Onboarding: Complete Profile
    Onboarding->>MongoDB: Save StudentProfile + StudentDNA
    Onboarding->>Recommendation: Emit onboarding_complete
    
    Recommendation->>CareerCatalog: Get All Careers
    CareerCatalog->>MongoDB: Query Careers
    MongoDB-->>CareerCatalog: Career Documents
    
    Recommendation->>EligibilityEngine: Filter Eligible
    EligibilityEngine->>MongoDB: Query with Eligibility Rules
    MongoDB-->>EligibilityEngine: ~50-100 Eligible Careers
    
    Recommendation->>TraitMatching: Compute Match Scores
    TraitMatching->>MongoDB: Get StudentDNA
    MongoDB-->>TraitMatching: StudentDNA Vector
    TraitMatching->>TraitMatching: Cosine Similarity Calculation
    TraitMatching-->>Recommendation: Top 20 Careers with Scores
    
    Recommendation->>AIService: Personalize & Rank
    AIService->>AIService: Build Payload (Top 20 + StudentDNA)
    AIService->>AIService: Load Prompt Template
    AIService->>AIService: Route to Primary Provider
    AIService->>AIService: Execute LLM Call
    AIService->>MongoDB: Log AIRequestLog
    AIService-->>Recommendation: Top 5 with Explanations
    
    Recommendation->>MongoDB: Save Recommendation
    Recommendation-->>Backend: Return Success
    Backend-->>Frontend: Return Recommendations
    Frontend-->>User: Display Top 5 Careers
```

---

## 6. Technical Stack

### Backend Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Framework | NestJS | 11.x | Modular backend framework with DI |
| Runtime | Node.js | LTS | JavaScript runtime |
| Language | TypeScript | Latest | Type-safe development |
| ODM | Mongoose | 9.x | MongoDB object modeling |
| Database | MongoDB Atlas | Latest | Cloud document database |
| Validation | class-validator / class-transformer | Latest | DTO validation at controller boundary |
| Auth | Passport.js | Latest | Authentication middleware |
| JWT | jsonwebtoken | Latest | Token generation/verification |
| Hashing | bcrypt | Latest | Password hashing |
| PDF | pdfmake | Latest | PDF generation |
| Vector Math | Custom | N/A | Cosine similarity calculations |

### Frontend Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Framework | React | 19.x | UI framework |
| Build Tool | Vite | Latest | Fast development server & bundler |
| Language | TypeScript | Latest | Type-safe development |
| Styling | Tailwind CSS | Latest | Utility-first CSS framework |
| State Management | Zustand | Latest | Client state (JWT in memory) |
| Data Fetching | TanStack Query | Latest | Server state caching & management |
| Routing | React Router | Latest | Client-side routing |
| HTTP Client | Axios | Latest | HTTP requests with interceptors |

### AI Providers

| Provider | Models | Primary Use Case | Routing Priority |
|----------|--------|------------------|------------------|
| Gemini | gemini-2.5-pro, gemini-flash | Career ranking, roadmap generation | Primary for ranking |
| Groq | LLaMA 3.3-70B, Mixtral 8x7B | Counselor chat (low-latency) | Primary for chat |
| Mistral | mistral-large | Report summary | Primary for reports |
| DeepSeek | deepseek-chat | Fallback for ranking | Secondary for ranking |
| GLM | glm-4 | JSON extraction, trait backfill | Primary for backfill |

---

## 7. Domain Model

### Core Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    User ||--o{ StudentProfile : has_one
    User ||--o{ Conversation : has_many
    User ||--o{ Recommendation : has_many
    User ||--o{ SavedCareer : has_many
    User ||--o{ AnalyticsEvent : has_many
    User ||--o{ Report : has_many
    User ||--o{ StudentDNAHistory : has_many
    
    StudentProfile ||--o{ StudentDNA : embeds
    StudentProfile ||--o{ StudentDNAHistory : logs_to
    
    Career ||--o{ SavedCareer : bookmarked_by
    Career }|--|| Category : belongs_to
    
    Recommendation ||--o{ RecommendationFeedback : has_many
    Recommendation }|--|| StudentProfile : generated_for
    Recommendation }|--|| Career : references
    
    Conversation ||--o{ ConversationMessage : has_many
    
    AIRequestLog }|--|| User : triggered_by
    
    Report }|--|| Recommendation : generated_from
    
    AnalyticsEvent }|--|| User : generated_by
```

### Mongoose Schemas Overview

#### User Schema
```typescript
{
  user_id: string;           // UUID, hyphens stripped - stable external id
  email: string;
  email_verified: boolean;
  password_hash: string;
  provider: 'local';        // Future: 'google', etc.
  role: 'student' | 'admin';
  full_name: string;
  failed_login_attempts: number;
  locked_until: Date;
  last_login: Date;
  created_at: Date;
  updated_at: Date;
}
```

#### StudentProfile Schema
```typescript
{
  user_id: string;
  onboarding_step: string;  // Current step key for resume
  completion_percentage: number;
  personal: {
    name: string;
    dob: Date;
    age: number;
    gender: string;
    city: string;
    state: string;
    board: string;
  };
  academic: {
    status: string;
    class10_percent: number;
    class12_percent: number;
    subjects: {
      maths: number;
      science: number;
      english: number;
      sst: number;
      computer: number;
    };
    favorite_subjects: string[];
    weak_subjects: string[];
    stream_interest: string;
  };
  interests: {              // 0-100 sliders
    technology: number;
    business: number;
    helping_people: number;
    teaching: number;
    nature: number;
    research: number;
    sports: number;
    design: number;
    media: number;
    government: number;
    finance: number;
    machines: number;
  };
  skills: {                 // 1-5 self-rated
    communication: number;
    leadership: number;
    problem_solving: number;
    creativity: number;
    logical_thinking: number;
    coding: number;
    drawing: number;
    math: number;
    observation: number;
    patience: number;
  };
  goals: string[];          // Ranked list
  work_preferences: string[];
  constraints: {
    govt_vs_private: string;
    budget_tier: number;
    study_duration_max: number;
    willing_to_relocate: boolean;
    abroad_ok: boolean;
    preferred_location: string;
  };
  scenario_responses: [{
    question_id: string;
    selected_option: string;
    trait_weights: object;
  }];
  current_dna: StudentDNA;  // Embedded
  created_at: Date;
  updated_at: Date;
}
```

#### StudentDNA Schema (Embedded)
```typescript
{
  analytical_thinking: number;      // 0-100
  creativity: number;              // 0-100
  communication: number;           // 0-100
  leadership: number;              // 0-100
  research: number;                // 0-100
  business_acumen: number;         // 0-100
  technical_curiosity: number;     // 0-100
  empathy: number;                  // 0-100
  patience: number;                 // 0-100
  risk_tolerance: number;           // 0-100
  computed_at: Date;
  source_version: string;           // Trait-weight config version
}
```

#### Career Schema
```typescript
{
  career_code: string;              // Stable string id
  category_code: string;
  name: string;
  description: string;
  required_skills: string[];
  technical_skills: string[];
  soft_skills: string[];
  market_demand: number;
  future_scope: string;
  career_progression: string;
  trait_weights: {                  // Live weights
    analytical_thinking: number;
    creativity: number;
    communication: number;
    leadership: number;
    research: number;
    business_acumen: number;
    technical_curiosity: number;
    empathy: number;
    patience: number;
    risk_tolerance: number;
  };
  eligibility: {                   // Hard gates
    min_maths: number;
    min_science: number;
    min_biology: number;
    min_english: number;
    max_budget_tier: number;
    min_study_duration_years: number;
    max_study_duration_years: number;
    required_stream: string;
    abroad_required: boolean;
  };
  trait_weights_draft: object;      // Staging for LLM backfill
  eligibility_draft: object;       // Staging for LLM backfill
}
```

#### Recommendation Schema
```typescript
{
  user_id: string;
  onboarding_session_ref: string;
  pipeline_version: string;
  eligible_count: number;          // Size after Eligibility Engine
  shortlist: [{
    career_code: string;
    match_score: number;           // From Trait Matching Engine
  }];
  final_recommendations: [{
    career_code: string;
    rank: number;
    ai_score: number;
    explanation: string;
    roadmap: string;
    suggested_colleges: string[];
    suggested_certifications: string[];
  }];
  ai_provider_used: string;
  ai_model_used: string;
  fallback_used: boolean;
  generated_at: Date;
  stale: boolean;                  // True if profile changed
}
```

---

## 8. Recommendation Pipeline

### Three-Stage Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    RECOMMENDATION PIPELINE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Student Input ──► Eligibility Engine ──► Trait Matching Engine   │
│                    │                       │                         │
│                    ▼                       ▼                         │
│           ~50-100 Eligible Careers     Top 20 Candidates           │
│                    │                       │                         │
│                    └───────────┬───────────┘                         │
│                                     ▼                                  │
│                            AI Personalization                         │
│                                     │                                  │
│                                     ▼                                  │
│                            Top 5 Final Recommendations                │
│                                                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Stage 1: Eligibility Engine
- **Type**: Deterministic MongoDB Query
- **Input**: Full career catalog + StudentProfile constraints
- **Output**: ~50-100 careers that pass hard constraints
- **Mechanism**: MongoDB query with `$lte`, `$gte` operators
- **AI Involvement**: **NONE** - Pure database filtering

```typescript
// Example Eligibility Query
this.careerModel.find({
  'eligibility.min_maths': { $lte: student.academic.subjects.maths },
  'eligibility.min_science': { $lte: student.academic.subjects.science },
  'eligibility.max_budget_tier': { $gte: student.constraints.budget_tier },
  'eligibility.min_study_duration_years': { $lte: student.constraints.study_duration_max },
});
```

### Stage 2: Trait Matching Engine
- **Type**: Deterministic Vector Similarity
- **Input**: Eligible careers + StudentDNA vector
- **Output**: Top 20 careers ranked by match score
- **Mechanism**: Weighted cosine similarity between vectors
- **AI Involvement**: **NONE** - Pure TypeScript math

```typescript
// Cosine Similarity Calculation
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Match Score
match_score = cosineSimilarity(studentDnaVector, careerTraitVector) * 100;
```

### Stage 3: AI Personalization
- **Type**: Single LLM Call
- **Input**: Top 20 candidates + StudentDNA + StudentProfile
- **Output**: Top 5 careers with rankings, explanations, roadmaps
- **AI Involvement**: **YES** - But only for ranking and explanation

```json
{
  "student_profile": { "academic": {...}, "interests": {...}, "goals": [...] },
  "student_dna": { "analytical_thinking": 92, "technical_curiosity": 96, ... },
  "candidate_careers": [
    { "career_code": "SE", "name": "Software Engineer", "match_score": 96 },
    { "career_code": "AI", "name": "AI Engineer", "match_score": 94 }
  ]
}
```

**Critical Rule**: The LLM must **NEVER** invent a career outside the provided candidate list. It can only rank, explain, and personalize from the top 20 already determined by the backend.

---

## 9. AI Service Architecture

### Provider Orchestration Layer

```
┌─────────────────────────────────────────────────────────────────┐
│                        AI SERVICE MODULE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                      ai-service.client.ts                        ││
│  │                    (Single Public Entrypoint)                    ││
│  │                 aiService.run(taskType, context)                  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                    │                                  │
│                                    ▼                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                      router.service.ts                          ││
│  │  Task Type → [Primary, Fallback1, Fallback2]                    ││
│  │  career_recommendation → [Gemini, DeepSeek, Groq]              ││
│  │  counselor_chat → [Groq, Groq, Gemini Flash]                   ││
│  │  career_trait_backfill → [GLM, Gemini, Groq]                   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                    │                                  │
│                    ┌───────────────┴───────────────┐                 │
│                    ▼                               ▼                 │
│  ┌─────────────────────┐               ┌─────────────────────┐    │
│  │  key-pool.service.ts │               │ retry-manager.service│    │
│  │  - Load keys from env│               │  - Rotate within     │    │
│  │  - Round-robin rotation│              │    provider first    │    │
│  │  - Track key usage   │               │  - Escalate to       │    │
│  └─────────────────────┘               │    fallback provider │    │
│                                            └─────────────────────┘    │
│                                    │                                  │
│                    ┌───────────────┴───────────────┐                 │
│                    ▼                               ▼                 │
│  ┌─────────────────────┐               ┌─────────────────────┐    │
│  │ prompt-builder.ts    │               │ cache.service.ts     │    │
│  │  - Load .md templates│               │  - SHA-256 hashing   │    │
│  │  - Variable interpolation│             │  - TTL-based cache   │    │
│  └─────────────────────┘               └─────────────────────┘    │
│                                    │                                  │
│                    ┌───────────────┴───────────────┐                 │
│                    ▼                               ▼                 │
│  ┌─────────────────────┐               ┌─────────────────────┐    │
│  │ json-validator.ts    │               │ token-logger.ts      │    │
│  │  - Schema validation │               │  - Log to MongoDB    │    │
│  │  - JSON repair        │               │  - Track usage       │    │
│  └─────────────────────┘               └─────────────────────┘    │
│                                    │                                  │
│                                    ▼                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    providers/                                  ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────┐││
│  │  │ Gemini   │ │  Groq    │ │Mistral   │ │DeepSeek  │ │ GLM │││
│  │  │ Provider │ │ Provider │ │ Provider │ │ Provider │ │Provider│││
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └─────┘││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Routing Table

| Task Type | Primary | Fallback 1 | Fallback 2 | Use Case |
|-----------|---------|------------|------------|----------|
| career_recommendation | Gemini | DeepSeek | Groq (LLaMA 3.3-70B) | Rank & explain top 20 |
| roadmap_generation | Gemini | DeepSeek | Groq | Generate career roadmap |
| counselor_chat | Groq (LLaMA 3.3-70B) | Groq (Mixtral 8x7B) | Gemini Flash | Low-latency chat |
| career_trait_backfill | GLM | Gemini | Groq | LLM-assisted catalog building |
| report_summary | Mistral | Gemini | Groq | PDF report content |

### Fallback Flow

1. **Primary Provider**: Try all available keys in pool
2. **Within Provider**: Rotate through keys, retry on rate limit/timeout
3. **Cross Provider**: After exhausting all keys for primary, escalate to Fallback 1
4. **Final Fallback**: After exhausting Fallback 1, escalate to Fallback 2
5. **Failure**: If all providers fail, throw typed error

### Standard Response Shape

```typescript
interface AIResponse {
  provider: string;           // e.g., "gemini"
  model: string;             // e.g., "gemini-2.5-pro"
  task: string;              // e.g., "career_recommendation"
  success: boolean;
  data: any;                 // Task-specific JSON
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  latency_ms: number;
  fallback_used: boolean;
  cached: boolean;
}
```

### Prompt Management

All prompts are stored as `.md` files in `ai-service/prompts/`:
- `career-recommendation.md`
- `roadmap-generation.md`
- `counselor-chat.md`
- `career-trait-backfill.md`
- `report-summary.md`
- `test-task.md`

Prompts are loaded and interpolated at runtime using `prompt-builder.service.ts`.

---

## 10. API Surface

### Global Configuration
- **Base Path**: `/api`
- **Authentication**: JWT Bearer (default), with `@Public()` decorator for exceptions
- **Response Envelope**: All success responses wrapped in `{ data, timestamp, requestId }`
- **Error Shape**: Consistent error format across all endpoints

### Module Endpoints

#### Auth Module (`/api/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Register new user | Public |
| POST | `/login` | Login with credentials | Public |
| POST | `/logout` | Invalidate refresh token | Auth |
| POST | `/refresh` | Get new access token | Public |
| GET | `/me` | Get current user info | Auth |
| GET | `/verify-email/:token` | Verify email | Public |
| POST | `/forgot-password` | Request password reset | Public |
| POST | `/reset-password` | Reset password | Public |

#### Health Module (`/api/health`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | System health check | Public |

#### AI Service Module (`/api/ai-service`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/health` | AI provider health status | Public |

#### Onboarding Module (`/api/onboarding`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/start` | Initialize onboarding | Auth |
| PUT | `/step/:stepKey` | Save step data | Auth |
| GET | `/resume` | Get current step & saved data | Auth |
| POST | `/complete` | Mark onboarding complete | Auth |
| GET | `/student-dna` | Get StudentDNA | Auth |

#### Careers Module (`/api/careers`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List all careers | Public |
| GET | `/categories` | List all categories | Public |
| GET | `/search` | Search careers | Public |
| GET | `/suggest` | Get career suggestions | Public |
| GET | `/filter` | Filter careers | Public |
| GET | `/:careerCode` | Get career by code | Public |
| GET | `/related/:careerCode` | Get related careers | Public |
| GET | `/roadmap/:careerCode` | Get career roadmap | Public |
| POST | `/by-codes` | Get multiple careers by codes | Public |
| POST | `/save/:careerId` | Save career bookmark | Auth |
| GET | `/saved` | Get saved careers | Auth |
| GET | `/saved/status/:careerId` | Check save status | Auth |
| POST | `/admin/*` | Admin CRUD operations | Admin |

#### Recommendation Module (`/api/recommendations`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/generate` | Generate recommendations | Auth |
| GET | `/latest` | Get latest recommendations | Auth |
| POST | `/regenerate` | Regenerate recommendations | Auth |
| POST | `/feedback` | Submit feedback | Auth |

#### Counselor Module (`/api/counselor`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/chat` | Send chat message | Auth |
| GET | `/conversations` | List conversations | Auth |
| GET | `/conversations/:id` | Get conversation by ID | Auth |
| POST | `/feedback` | Submit chat feedback | Auth |
| POST | `/regenerate` | Regenerate last response | Auth |

#### Dashboard Module (`/api/dashboard`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get dashboard data | Auth |

#### Reports Module (`/api/report`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/generate` | Generate PDF report | Auth |
| GET | `/status/:reportId` | Get report status | Auth |
| GET | `/download/:reportId` | Download report | Auth |
| GET | `/history` | Get report history | Auth |

#### Analytics Module (`/api/analytics`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/me` | User analytics | Auth |
| GET | `/platform` | Platform-wide analytics | Admin |
| GET | `/careers` | Career analytics | Admin |
| GET | `/ai` | AI usage analytics | Admin |
| POST | `/event` | Log analytics event | Auth |

#### History Module (`/api/history`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/?type=all\|careers\|recommendations\|onboarding` | Get history | Auth |

---

## 11. Engineering Rules & Principles

### Non-Negotiable Rules (From Spec)

1. **Mongoose Only**: Never use raw MongoDB driver calls unless Mongoose cannot express the operation
2. **Thin Controllers**: All business logic must live in `*.service.ts` files; controllers only parse requests and shape responses
3. **JWT in Memory Only**: Frontend JWT tokens must be stored in Zustand (memory only), never in `localStorage` or `sessionStorage`
4. **Analytics Must Never Throw**: Every analytics event-firing call must be wrapped in try/catch that logs and swallows failures
5. **Backend is Source of Truth**: Eligibility filtering and trait-match scoring must be deterministic TypeScript/Mongo logic; LLM never decides eligibility
6. **Never Send Full Catalog to LLM**: Every recommendation call must receive pre-filtered top-20 candidates only
7. **Provider-Agnostic Design**: No module outside `ai-service/` may import a provider SDK directly
8. **Prompts as MD Files**: All prompts must be stored as `.md` template files under `ai-service/prompts/`
9. **Snake Case on Wire**: All API request/response bodies and query params must use `snake_case` field names
10. **Scope Discipline**: Each phase must touch only the files it explicitly names

### Response Envelope Contract

**Success Response:**
```typescript
{
  data: any;              // Actual response payload
  timestamp: string;      // ISO timestamp
  requestId: string;      // Unique request identifier
}
```

**Error Response:**
```typescript
{
  statusCode: number;     // HTTP status code
  message: string;        // Error message
  detail?: string;        // Optional detail
  errors?: FieldError[];  // Optional field-level errors
  timestamp: string;      // ISO timestamp
  path: string;           // Request path
  requestId: string;      // Unique request identifier
}
```

### Field Naming Conventions

- **API Boundary**: Always `snake_case` (e.g., `user_id`, `career_code`, `student_dna`)
- **Database**: Match API naming (`snake_case`)
- **Internal TypeScript**: Can use `camelCase` or `PascalCase` as appropriate
- **Stable Identifiers**: Use `career_code` and `category_code` as string IDs, never Mongo `_id`
- **User ID**: Hyphen-stripped UUID, not Mongo `_id`

---

## 12. Project Status & Progress

### Completion Status

Based on `PROGRESS.md`, all phases have been completed:

| Phase | Status | Date | Modules Built |
|-------|--------|------|---------------|
| Phase 0 | ✅ Complete | 2026-07-11 | Project skeleton, auth, response contract |
| Phase 1 | ✅ Complete | 2026-07-11 | AI Service (multi-LLM orchestration) |
| Phase 2 | ✅ Complete | 2026-07-11 | Careers module (catalog + trait weights) |
| Phase 3 | ✅ Complete | 2026-07-11 | Onboarding module (8-step flow) |
| Phase 4 | ✅ Complete | 2026-07-11 | Recommendation module (pipeline) |
| Phase 5 | ✅ Complete | 2026-07-11 | Counselor module (AI chat) |
| Phase 6 | ✅ Complete | 2026-07-11 | Dashboard, reports, analytics, history |
| Phase 7 | ⏳ Pending | - | Frontend (React) |
| Phase 8 | ⏳ Pending | - | Testing & QA |

### Build Order Rationale

The modules were built in this specific order to ensure no forward references:

```
Auth → AI Service → Careers → Onboarding → Recommendation → Counselor → Consumer Modules
```

Each module only depends on modules already built, eliminating circular dependencies.

---

## 13. File Structure

### Backend Directory Structure

```
backend/
├── .env
├── .prettierrc
├── eslint.config.mjs
├── nest-cli.json
├── package-lock.json
├── package.json
├── README.md
├── tsconfig.build.json
├── tsconfig.json
├── dist/                          # Compiled output
└── src/
    ├── main.ts
    ├── app.module.ts
    ├── health/
    │   ├── health.controller.ts
    │   └── health.module.ts
    ├── auth/
    │   ├── auth.service.ts
    │   ├── auth.controller.ts
    │   ├── auth.module.ts
    │   ├── dto/
    │   │   ├── register.dto.ts
    │   │   └── login.dto.ts
    │   ├── decorators/
    │   │   └── public.decorator.ts
    │   ├── guards/
    │   │   └── jwt-auth.guard.ts
    │   ├── schemas/
    │   │   └── user.schema.ts
    │   └── strategies/
    │       └── jwt.strategy.ts
    ├── ai-service/
    │   ├── ai-service.client.ts
    │   ├── ai-service.controller.ts
    │   ├── ai-service.module.ts
    │   ├── ai-service.schemas.ts
    │   ├── ai-request-log.schema.ts
    │   ├── cache.service.ts
    │   ├── json-validator.service.ts
    │   ├── key-pool.service.ts
    │   ├── prompt-builder.service.ts
    │   ├── provider.interface.ts
    │   ├── retry-manager.service.ts
    │   ├── router.service.ts
    │   ├── token-logger.service.ts
    │   ├── prompts/
    │   │   ├── career-recommendation.md
    │   │   ├── career-trait-backfill.md
    │   │   ├── counselor-chat.md
    │   │   ├── report-summary.md
    │   │   ├── roadmap-generation.md
    │   │   └── test-task.md
    │   └── providers/
    │       ├── deepseek.provider.ts
    │       ├── gemini.provider.ts
    │       ├── glm.provider.ts
    │       ├── groq.provider.ts
    │       ├── mistral.provider.ts
    │       └── provider.interface.ts
    ├── careers/
    │   ├── careers.service.ts
    │   ├── careers.controller.ts
    │   ├── careers.module.ts
    │   ├── dto/
    │   │   └── career.dto.ts
    │   └── schemas/
    │       ├── career.schema.ts
    │       └── saved-career.schema.ts
    ├── onboarding/
    │   ├── onboarding.service.ts
    │   ├── onboarding.controller.ts
    │   ├── onboarding.module.ts
    │   ├── onboarding-flow.service.ts
    │   ├── trait-engine.service.ts
    │   ├── dto/
    │   │   └── onboarding-step.dto.ts
    │   └── schemas/
    │       ├── student-dna-history.schema.ts
    │       └── student-profile.schema.ts
    ├── recommendation/
    │   ├── recommendation.service.ts
    │   ├── recommendation.controller.ts
    │   ├── recommendation.module.ts
    │   ├── eligibility-engine.service.ts
    │   ├── trait-matching-engine.service.ts
    │   ├── dto/
    │   │   └── recommendation.dto.ts
    │   └── schemas/
    │       ├── recommendation-feedback.schema.ts
    │       └── recommendation.schema.ts
    ├── counselor/
    │   ├── counselor.service.ts
    │   ├── counselor.controller.ts
    │   ├── counselor.module.ts
    │   ├── context-builder.service.ts
    │   ├── dto/
    │   │   ├── chat.dto.ts
    │   │   └── counselor.dto.ts
    │   └── schemas/
    │       ├── conversation-message.schema.ts
    │       └── conversation.schema.ts
    ├── dashboard/
    │   ├── dashboard.service.ts
    │   ├── dashboard.controller.ts
    │   └── dashboard.module.ts
    ├── reports/
    │   ├── reports.service.ts
    │   ├── reports.controller.ts
    │   ├── reports.module.ts
    │   └── schemas/
    │       └── report.schema.ts
    ├── analytics/
    │   ├── analytics.service.ts
    │   ├── analytics.controller.ts
    │   ├── analytics.module.ts
    │   └── schemas/
    │       └── analytics-event.schema.ts
    ├── history/
    │   ├── history.service.ts
    │   ├── history.controller.ts
    │   └── history.module.ts
    └── common/
        ├── vector-math.ts
        ├── filters/
        │   └── http-exception.filter.ts
        └── interceptors/
            └── transform.interceptor.ts
```

### Frontend Directory Structure

```
frontend/
├── vite.config.ts
├── package.json
└── src/
    ├── App.tsx
    ├── App.css
    ├── index.css
    ├── main.tsx
    ├── api/
    │   └── client.ts
    ├── pages/
    │   ├── Dashboard.tsx
    │   ├── Login.tsx
    │   ├── Register.tsx
    │   └── onboarding/
    │       └── [step pages]
    └── store/
        └── authStore.ts
```

---

## Summary

SCPR is a sophisticated, well-architected career recommendation system that combines:

1. **Deterministic Logic** for eligibility and matching (no black-box AI decisions)
2. **AI Personalization** for ranking, explanations, and roadmaps (transparent AI usage)
3. **Multi-LLM Resilience** with automatic fallback and retry mechanisms
4. **Clean Architecture** with strict module boundaries
5. **Comprehensive Testing** with all exit criteria documented

The project follows modern best practices:
- TypeScript throughout (backend and frontend)
- NestJS modular architecture
- React 19 with Vite
- MongoDB with Mongoose
- Strict separation of concerns
- Provider-agnostic AI integration
- Memory-only JWT storage for security

### Key Innovations

1. **Three-Stage Pipeline**: Eligibility → Trait Matching → AI Personalization
2. **LLM as Co-Pilot**: AI explains and personalizes, but never decides
3. **Architectural Fix for Classification Failure**: Previous Random Forest + XGBoost approach failed due to too many classes and insufficient data; the new architecture solves this by using deterministic filtering first
4. **Provider Abstraction**: Swap AI providers with one-line config changes
5. **Traceable Recommendations**: Every recommendation can be traced through the pipeline

### Next Steps

- Complete Phase 7: Frontend implementation
- Complete Phase 8: Testing & QA
- Scale career catalog from 40 to 700+
- Add admin panel
- Consider social login (Google OAuth)

---

*Generated on: 2026-07-12*
*Documentation Version: 1.0*
*Project Version: v1*
