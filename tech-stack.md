# Tech Stack Definition

# Project: insightOS

# Version: 1.0

---

# 1. Philosophy Behind Stack Selection

The tech stack for insightOS is chosen based on:

- Frontend-first architecture
- Minimal backend complexity
- Production-grade standards
- Strong TypeScript discipline
- AI integration capability
- Performance and scalability readiness

The stack must:

- Avoid unnecessary complexity
- Avoid overengineering
- Support streaming AI
- Support modular architecture
- Be resume-impressive but realistic

---

# 2. Core Framework

## Next.js 14 (App Router)

Why:

- Server + client components
- Built-in API routes
- Streaming support
- Production-ready routing
- Edge-compatible
- Strong industry adoption

App Router is mandatory.
Pages Router is not allowed.

---

# 3. Language

## TypeScript (Strict Mode Enabled)

Rules:

- "strict": true
- No implicit any
- No loose typing
- All AI responses must be strongly typed
- All shared domain models typed

This project must demonstrate TypeScript maturity.

---

# 4. Styling

## Tailwind CSS

Why:

- Fast development
- Clean utility-based system
- Industry standard
- Easy to maintain
- Scalable for SaaS UI

No random CSS files.
No inline messy styles.

Optional:

- shadcn/ui for professional component base

---

# 5. State Management

## Zustand (Preferred)

Why:

- Lightweight
- Minimal boilerplate
- Predictable
- Feature-scoped stores possible

Global state categories:

- user
- dashboardFilters
- copilotSession
- uiState

Local state preferred when possible.

Redux Toolkit is allowed only if complexity grows significantly.

---

# 6. Data Fetching & Async State

## TanStack Query (React Query)

Why:

- Handles caching
- Handles retries
- Handles loading/error states
- Industry standard
- Scales well

All server calls (including AI proxy) must go through a data layer abstraction.

No direct fetch calls inside components.

---

# 7. AI Integration

## LLM Provider

Primary:

- OpenAI API

Alternative:

- Anthropic Claude API

Decision Criteria:

- Structured JSON output support
- Streaming capability
- Stable SDK

Temperature must be low (0.2).

---

## AI Integration Approach

- All LLM calls via Next.js API route
- Structured JSON mode enforced
- Streaming via ReadableStream
- Server-side schema validation
- No client-side AI key exposure

---

# 8. Schema Validation

## Zod

Why:

- Strong runtime validation
- Type-safe inference
- Clean integration with TypeScript

Used for:

- AI structured output validation
- Action payload validation
- Input sanitization

---

# 9. Table Virtualization

## @tanstack/react-virtual

Why:

- Efficient large dataset rendering
- Performance demonstration
- Senior-level frontend signal

Required for data-table feature.

---

# 10. Charts

## Recharts (or similar)

Why:

- Clean chart rendering
- Popular
- Easy integration
- SaaS-friendly visuals

Charts must support:

- Line chart
- Bar chart
- Responsive container

---

# 11. Rate Limiting

Custom in-memory rate limiter (MVP)

Located in:
lib/rate-limit/

Used inside:
app/api/ai/route.ts

Future upgrade:

- Redis-based rate limiting

---

# 12. Logging Strategy

Server-side console logging for:

- AI request metadata
- Token usage estimation
- Errors

Future extensibility:

- Structured logging service

---

# 13. Environment Configuration

Environment variables:

- OPENAI_API_KEY
- LLM_MODEL
- NODE_ENV

Rules:

- Never commit .env
- Use .env.local
- Validate environment variables on startup

---

# 14. Deployment

## Vercel

Why:

- Native Next.js support
- Easy environment variable management
- Streaming compatibility
- Professional deployment experience

Deployment must:

- Run production build
- Secure API routes
- Hide API keys
- Have clean README instructions

---

# 15. Developer Tooling

- ESLint (strict)
- Prettier
- Husky (optional)
- Commit discipline
- Clean Git history

---

# 16. Future Upgrade Path

This stack allows:

- Adding Supabase
- Adding PostgreSQL
- Adding WebSockets
- Adding Edge functions
- Multi-workspace support
- Persistent AI memory

No major refactor required.

---

# 17. Out of Scope

- Microservices
- GraphQL (unnecessary here)
- Heavy backend frameworks
- Docker orchestration
- Kubernetes
- Complex DevOps pipelines

This is frontend-dominant, AI-integrated architecture.

---

END OF TECH STACK DOCUMENT
