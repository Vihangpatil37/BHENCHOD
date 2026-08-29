<div align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="NestJS Logo" />
  <h1>SCPR Platform</h1>
  <p><strong>A highly secure, scalable, and modular platform powering student career recommendations.</strong></p>

  <p>
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
    <img alt="React" src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
    <img alt="NestJS" src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" />
    <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" />
    <img alt="License" src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" />
  </p>
</div>

---

## 📖 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Security Hardening](#-security-hardening)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🏛 Architecture Overview

The SCPR Platform is a full-stack monorepo consisting of:
1. **Frontend**: A modern React SPA built with Vite, utilizing Zustand for state management, TailwindCSS for styling, and Framer Motion for rich, dynamic animations.
2. **Backend**: Built on **NestJS**, leveraging its powerful dependency injection, modular architecture, and robust decorators. The system interfaces with a **MongoDB** document database via Mongoose, and features a bespoke Recommendation Engine (V2), secure JWT-based Authentication, and robust Role-Based Access Control (RBAC).

Key design principles:
- **Defense in Depth**: Secure by default (Helmet, Throttler, strictly sanitized inputs, DOMPurify for AI outputs).
- **Test-Driven**: Extensive Unit and E2E coverage specifically around trust boundaries.
- **Premium UX**: Highly polished, modern interface with micro-interactions and smooth transitions.

---

## 🛠 Prerequisites

Ensure you have the following installed on your local development machine:

- **Node.js** (v18.x or higher recommended)
- **npm** (v9.x or higher)
- **MongoDB** (Local instance or an Atlas Cluster URI)

---

## 🚀 Getting Started

1. **Install dependencies:**
   From the root of the respective workspaces, run:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Configure your environment:**
   Copy the `.env.example` files to `.env` in the backend and frontend, and fill in the required values.

3. **Start the development servers:**
   There is a convenient `start.bat` at the root of the project to launch both servers simultaneously:
   ```bash
   # On Windows
   ./start.bat
   ```
   Or manually:
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run start:dev
   
   # Terminal 2 - Frontend
   cd frontend && npm run dev
   ```

---

## 📂 Project Structure

```text
.
├── backend/
│   ├── src/
│   │   ├── ai-service/        # AI orchestration, LLM router, and prompt management
│   │   ├── auth/              # JWT authentication, guards, hashing, and password resets
│   │   ├── careers/           # Career catalog management and queries
│   │   ├── recommendation/    # V2 Recommendation Engine (Scoring engines, hybrid ranking)
│   │   └── ...
│   └── test/                  # E2E Security Testing
│
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable UI elements and layout shells
│   │   ├── pages/             # Route-level components (Login, Dashboard, Explore)
│   │   ├── store/             # Zustand global state (Auth, UI state)
│   │   └── api/               # Axios clients and request interceptors
│   └── ...
│
└── start.bat                  # Root script to start both dev servers
```

---

## 🧪 Testing & Quality Assurance

We maintain a rigorous testing standard across the stack. The backend E2E tests are configured to spin up an in-memory MongoDB instance automatically.

```bash
# Backend Testing
cd backend
npm run test         # Unit tests
npm run test:e2e     # Security E2E suites

# Frontend Testing
cd frontend
npm run test         # Vitest suites
npm run lint         # Oxlint fast checks
```

---

## 🛡 Security Hardening

Security is treated as a first-class citizen. The platform implements:
- **Rate Limiting:** Granular endpoint throttling via `@nestjs/throttler`.
- **JWT & RBAC:** Stateless secure tokens with `@Roles('admin')` guards.
- **Injection Prevention:** Mongoose schema validations and strict `class-validator` DTOs.
- **Password Policies:** Enforced Bcrypt hashing with complex regex requirements.
- **XSS Prevention:** DOMPurify sanitization strictly applied to any markdown or dynamic SVG content on the frontend.

---

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`).
2. Commit your changes (`git commit -m 'feat(domain): add some amazing feature'`).
3. Ensure all tests pass.
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

---

## 📄 License

This project is proprietary and confidential. Unauthorized copying of files in this repository, via any medium, is strictly prohibited.
