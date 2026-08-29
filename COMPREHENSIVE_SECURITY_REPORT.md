# Comprehensive Security Report — SCPR Platform

**Date:** 2026-08-29 | **Status:** Complete | **Branch:** feature/onboarding-updates

---

## Executive Summary

Full project-wide security testing executed across all layers: Backend (NestJS), Frontend (React), AI Service, Dependencies, and Secrets. **All 301 tests pass** (208 unit + 93 E2E). Zero critical hardcoded secrets found. All dependency vulnerabilities resolved. Platform security posture is **STRONG** with minor hardening opportunities identified.

### Key Metrics

| Category | Result |
|----------|--------|
| Backend Unit Tests | ✅ 208/208 PASS |
| Backend E2E Security Tests | ✅ 93/93 PASS |
| Frontend Unit Tests | ✅ 20/20 PASS |
| Frontend Lint (oxlint) | ✅ 0 errors, 13 warnings |
| SAST (eslint-plugin-security) | ✅ 0 critical, 97 info (object-injection false positives) |
| Backend npm audit | ✅ 0 vulnerabilities (3 high fixed) |
| Frontend npm audit | ✅ 0 vulnerabilities (5 fixed: 1 moderate, 4 high) |
| Secret Scanner | ✅ No hardcoded secrets (38 test fixtures excluded) |
| Hardcoded API Keys | ✅ None found |
| .gitignore Coverage | ✅ .env files excluded, backend/.env not tracked |

---

## 1. Test Execution Results

### 1.1 Backend Unit Tests (No DB Required)

```
Test Suites: 28 passed, 28 total
Tests:       208 passed, 208 total
Time:        ~2.8s
```

All security-specific unit tests pass:
- `auth.password-security.spec.ts` — 14 tests (policy, hashing, lockout, no fallback)
- `auth.jwt-security.spec.ts` — 9 tests (secret strength, algorithm, expiry)
- `auth-deps-secrets.security.spec.ts` — 7 tests (deps verified, no hardcoded secrets)

### 1.2 Backend E2E Security Tests (In-Memory MongoDB)

```
Test Suites: 7 passed, 7 total
Tests:       93 passed, 93 total
Time:        ~36s
```

| Suite | Tests | Status | Coverage |
|-------|-------|--------|----------|
| auth-rbac.security.e2e-spec.ts | 14 | ✅ PASS | RBAC: student vs admin access on analytics, careers, AI |
| auth-bola.security.e2e-spec.ts | 11 | ✅ PASS | BOLA/IDOR: cross-user data isolation on all endpoints |
| auth-injection.security.e2e-spec.ts | 26 | ✅ PASS | NoSQL injection, ReDoS, field stripping, validation |
| auth-disclosure.security.e2e-spec.ts | 14 | ✅ PASS | Stack trace hiding, password hash exclusion, error messages |
| auth-headers.security.e2e-spec.ts | 11 | ✅ PASS | Helmet headers, CORS, error format |
| auth-career-exposure.security.e2e-spec.ts | 8 | ✅ PASS | Active-only filtering, draft field exclusion, search safety |
| app.e2e-spec.ts | 9 | ✅ PASS | Auth flow, onboarding, token refresh |

**Fix applied during testing:** Removed `@Public()` from `ai-service/health` endpoint — it had a conflict with `@Roles('admin')` causing 403 for admin users (the `@Public()` bypassed JWT authentication, so `RolesGuard` couldn't find the user object).

### 1.3 Frontend Tests

```
Test Files:  3 passed (3)
Tests:       20 passed (20)
Time:        ~1.1s
```

| Suite | Tests | Status |
|-------|-------|--------|
| ChatMarkdown.security.test.tsx | 11 | ✅ PASS (DOMPurify, XSS prevention) |
| client.test.ts | 5 | ✅ PASS (API client, interceptors) |
| authStore.test.ts | 4 | ✅ PASS (auth state management) |

---

## 2. Static Application Security Testing (SAST)

### 2.1 eslint-plugin-security

**Configuration:** Added `eslint-plugin-security` with rules for `detect-object-injection`, `detect-non-literal-regexp`, `detect-unsafe-regex`, `detect-eval-with-expression`, `detect-no-csrf-before-method-override`, `detect-possible-timing-attacks`.

**Results:**
- 97 warnings — all `detect-object-injection` (false positives for dynamic property access in NestJS services) and `detect-non-literal-fs-filename` (expected for prompt template loading)
- **0 critical findings** — no unsafe regex, no eval(), no CSRF violations, no timing attacks

### 2.2 Frontend Lint (oxlint)

**Results:** 0 errors, 13 warnings
- React hooks dependency warnings (exhaustive-deps)
- Unused variables (test utilities)
- **No security-critical issues**

---

## 3. XSS Prevention Verification

### ChatMarkdown Component

| Check | Status | Evidence |
|-------|--------|----------|
| DOMPurify imported | ✅ | `import DOMPurify from 'dompurify'` |
| SVG sanitized before innerHTML | ✅ | `ref.current.innerHTML = DOMPurify.sanitize(svg)` |
| No dangerouslySetInnerHTML | ✅ | Verified absent via security tests |
| No rehype-raw plugin | ✅ | Verified absent via security tests |
| ReactMarkdown used safely | ✅ | Content rendered as children, not raw HTML |
| DOMPurify package installed | ✅ | In dependencies |

---

## 4. AI Service Security

### 4.1 Prompt Injection/Jailbreak Mitigations

| Prompt | Guardrails | Status |
|--------|-----------|--------|
| career-recommendation.md | Role lock, no rank changes, no invented careers, GUARDRAILS section | ✅ |
| counselor-chat.md | Top 20 career boundary, out-of-sounds handling, never undermine backend | ✅ |
| roadmap-generation.md | BLACKLIST of banned phrases, error object for out-of-scope | ✅ |
| scenario-generation.md | Locked trait keys, structured JSON output | ✅ |
| career-trait-backfill.md | Strict JSON schema, no ranking/scoring | ✅ |
| report-summary.md | Minimal surface, just summarization | ✅ |

### 4.2 API Key Security

| Check | Status | Evidence |
|-------|--------|----------|
| Keys loaded from env vars only | ✅ | `key-pool.service.ts` reads `${PROVIDER}_API_KEYS` |
| No hardcoded keys in source | ✅ | Regex scan found zero matches |
| provider-models.config.ts uses env vars | ✅ | All model names via `process.env` |
| Error responses hide provider details | ✅ | `ai-service.controller.ts` comment: "never expose provider error details" |

---

## 5. Dependency Security (SCA)

### 5.1 Backend

**Before fix:** 3 high severity vulnerabilities
- `brace-expansion` ≤1.1.17 — DoS via unbounded expansion (GHSA-mh99-v99m-4gvg)
- `fast-uri` 3.0.0-3.1.4 — Host confusion via backslash authority (GHSA-v2hh-gcrm-f6hx)
- `js-yaml` 3.x/4.x — Quadratic CPU in !!omap resolution (CVE-2026-59870)

**After `npm audit fix`:** ✅ 0 vulnerabilities remaining

### 5.2 Frontend

**Before fix:** 5 vulnerabilities (1 moderate, 4 high)
- `mermaid` 11.x — Prototype pollution, CSS injection, DoS (5 advisories)
- `nanoid` ≤3.3.17 — Infinite loop with negative/zero size
- `postcss` ≤8.5.22 — Path traversal via sourceMappingURL
- `react-router` 7.12-7.18.1 — CSRF bypass in RSC mode

**After `npm audit fix`:** ✅ 0 vulnerabilities remaining

---

## 6. Secrets & Credential Scanning

### 6.1 Custom Regex Scanner Results

**Scanner:** `backend/scripts/secret-scanner.js` — scans for hardcoded API keys, MongoDB URIs, JWT secrets, AWS keys, private keys, and generic secret patterns.

**Results:**
- 38 matches — all are test fixture passwords (`'Password1'`) in test files. Expected and safe.
- **0 hardcoded API keys** (Groq, OpenRouter, Gemini patterns)
- **0 hardcoded MongoDB connection strings**
- **0 hardcoded JWT secrets**
- **0 AWS keys or private keys**

### 6.2 .gitignore Coverage

| Check | Status |
|-------|--------|
| `.env` in root `.gitignore` | ✅ |
| `backend/.env` tracked by git | ✅ No |
| `frontend/.gitignore` covers `.env` | ✅ (via root) |

---

## 7. Authentication & Authorization

| Measure | Status | Evidence |
|---------|--------|----------|
| JWT secrets ≥32 chars enforced at startup | ✅ | `main.ts` throws on missing/short |
| No fallback JWT secrets | ✅ | `auth.service.ts`, `jwt.strategy.ts` |
| Password policy: 8+ chars, uppercase, lowercase, digit | ✅ | `register.dto.ts` with MinLength + regex |
| Password hash `select:false` in schema | ✅ | `user.schema.ts` |
| `sanitizeUser()` strips sensitive fields | ✅ | Never exposes `password_hash`, `failed_login_attempts`, `locked_until` |
| Account lockout after 5 failed attempts (15min) | ✅ | `auth.service.ts` |
| RBAC: `@Roles('admin')` on admin endpoints | ✅ | Analytics, careers admin, AI service health |
| `RolesGuard` registered globally | ✅ | `app.module.ts` APP_GUARD |
| Public routes marked `@Public()` | ✅ | Auth endpoints, health, public careers |

---

## 8. Infrastructure Security

| Measure | Status | Evidence |
|---------|--------|----------|
| Helmet security headers | ✅ | `main.ts` — X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy |
| CORS allowlist via `CORS_ORIGINS` env | ✅ | `main.ts` — configurable origins |
| Rate limiting: auth (20/min), default (100/min) | ✅ | `ThrottlerModule` in `app.module.ts` |
| ValidationPipe with whitelist + forbidNonWhitelisted | ✅ | All routes — strips/rejects extra fields |
| Stack traces hidden in non-development | ✅ | `HttpExceptionFilter` — only shows in `NODE_ENV=development` |
| MongoDB URI from env vars | ✅ | `app.module.ts` ConfigService |

---

## 9. Security Hardening Timeline

| Phase | Measure | Status |
|-------|---------|--------|
| 0 | Security reconnaissance & threat mapping | ✅ |
| 1 | Auth hardening (no fallback secrets, password policy, lockout) | ✅ |
| 2 | RBAC enforcement (global guards, admin-only endpoints) | ✅ |
| 3 | Data minimization (active-only filtering, draft exclusion) | ✅ |
| 4 | Input validation (NoSQL injection, ReDoS, field stripping) | ✅ |
| 5 | XSS & response hardening (Helmet, DOMPurify, stack trace hiding) | ✅ |
| 6 | CORS, rate limiting, security headers | ✅ |
| 7 | E2E test infrastructure (mongodb-memory-server) | ✅ **NEW** |
| 8 | SAST integration (eslint-plugin-security) | ✅ **NEW** |
| 9 | Dependency auditing & remediation | ✅ **NEW** |
| 10 | Secret scanning automation | ✅ **NEW** |

---

## 10. Remaining Recommendations

| Priority | Recommendation | Effort |
|----------|---------------|--------|
| Medium | Add gitleaks pre-commit hook to prevent secret commits | Low |
| Medium | Add PII redaction in structured logs (emails, user IDs) | Medium |
| Low | Add CI security gate (npm audit + SAST in pipeline) | Medium |
| Low | Consider adding Content-Security-Policy header for frontend | Low |
| Low | Add rate limiting per-user (not just per-IP) for authenticated endpoints | Medium |

---

## 11. Files Changed/Created in This Session

### Infrastructure (Created)
- `backend/test/globalSetup.ts` — MongoDB memory server startup
- `backend/test/globalTeardown.ts` — Cleanup
- `backend/test/test-app.helper.ts` — Shared E2E app factory (helmet, CORS, validation)
- `backend/scripts/secret-scanner.js` — Regex-based credential scanner

### Infrastructure (Modified)
- `backend/test/jest-e2e-setup.ts` — MongoDB URI from file, high throttle limits
- `backend/test/jest-e2e.json` — Added globalSetup/globalTeardown, 60s timeout
- `backend/eslint.config.mjs` — Added eslint-plugin-security rules
- `backend/src/app.module.ts` — Throttle limits configurable via env vars

### Security Fixes
- `backend/src/ai-service/ai-service.controller.ts` — Removed `@Public()` from admin-only health endpoint
- `backend/src/common/filters/http-exception.filter.ts` — Stack traces hidden in test mode too

### Test Updates
- `backend/test/auth-injection.security.e2e-spec.ts` — Updated extra-field tests for `forbidNonWhitelisted`
- `backend/test/app.e2e-spec.ts` — Updated passwords to meet policy
- All 6 E2E test files — Updated to use `createTestApp` helper

### Dependencies Added
- `mongodb-memory-server` (dev) — In-memory MongoDB for E2E tests
- `eslint-plugin-security` (dev) — SAST rules

---

*Report generated 2026-08-29 11:35 UTC+5:30*
*Total tests: 301 (208 unit + 93 E2E) — All passing*
