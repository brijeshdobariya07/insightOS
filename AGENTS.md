# AGENTS.md — insightOS

## Project Overview

insightOS is a frontend-first, AI-integrated SaaS analytics dashboard with an embedded AI Copilot.
Built with Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS 4, Zustand, TanStack Query, and Zod.
This is NOT a chatbot — it is a bounded, structured AI copilot inside a realistic SaaS environment.

## Build / Dev / Lint Commands

```bash
npm install          # Install dependencies
npm run dev          # Start development server (next dev)
npm run build        # Production build (next build) — run before committing to verify no errors
npm run lint         # ESLint check (eslint-config-next with core-web-vitals + typescript rules)
npm start            # Start production server (next start)
```

There is no test runner configured yet. When tests are added, they should use a framework
compatible with React 19 (e.g., Vitest + React Testing Library). Test files should live
alongside their feature in `features/<name>/__tests__/`.

## Tech Stack

| Layer            | Technology                    | Notes                                      |
|------------------|-------------------------------|--------------------------------------------|
| Framework        | Next.js 16 (App Router only) | Pages Router is **not allowed**            |
| Language         | TypeScript (strict mode)      | `noImplicitAny`, `noUncheckedIndexedAccess`|
| React            | React 19                      | Server + Client components                 |
| Styling          | Tailwind CSS 4                | Via `@tailwindcss/postcss`; no random CSS  |
| State            | Zustand 5                     | Feature-scoped stores; minimal global state|
| Data Fetching    | TanStack Query 5              | No direct `fetch` in components            |
| Validation       | Zod 4                         | Runtime schema validation for AI responses |
| Charts           | Recharts 3                    | Line, bar charts with responsive containers|
| Virtualization   | @tanstack/react-virtual 3     | Required for data-table feature            |

## Project Architecture

**Feature-based architecture** — organized by domain, not file type.

```
app/                    # Next.js routing + layouts ONLY — no business logic
  dashboard/page.tsx    # Wires page to feature modules
  api/ai/route.ts       # AI proxy layer (server-side only)
  layout.tsx            # Root layout
features/               # Core application logic (each feature is isolated)
  ai-copilot/           # Copilot UI, hooks, services, store, context-builder, action-dispatcher
  auth/                 # Mock authentication
  dashboard-layout/     # Layout components
  data-table/           # Virtualized data table
  logs/                 # Activity logs
  metrics/              # Metrics cards and charts
lib/                    # Cross-feature pure utilities (NO React components)
  ai/                   # prompt-builder, response-parser, schema-validator
  rate-limit/           # In-memory rate limiter (for API routes)
  utils/                # formatters, constants, helpers
  validators/           # Zod schemas (copilot-schema, etc.)
types/                  # Shared domain TypeScript types only
```

### Feature Folder Structure

Each feature under `features/` must follow this pattern:

```
features/<name>/
  components/           # UI components (PascalCase filenames)
  hooks/                # Custom hooks (camelCase, prefixed with "use")
  services.ts           # Data fetching & transformation (or services/ folder)
  store.ts              # Zustand store (feature-scoped)
  types.ts              # Feature-specific TypeScript types
  index.ts              # Public export boundary — only expose controlled exports
```

## Code Style

### TypeScript

- **Strict mode is mandatory** — `"strict": true`, `"noImplicitAny": true`, `"noUncheckedIndexedAccess": true`.
- All AI responses, shared domain models, and API payloads must be strongly typed.
- Feature-specific types go in `features/<name>/types.ts`; shared types go in `types/`.
- Use Zod schemas for runtime validation of external data (AI responses, API inputs).

### Naming Conventions

| Element          | Convention   | Example                        |
|------------------|--------------|--------------------------------|
| Folders          | kebab-case   | `ai-copilot/`, `data-table/`  |
| Components       | PascalCase   | `MetricsDashboard.tsx`         |
| Hooks            | camelCase    | `useMetricsData.ts`            |
| Utilities/libs   | camelCase    | `formatters.ts`, `helpers.ts`  |
| Types files      | camelCase    | `types.ts`                     |
| Stores           | camelCase    | `store.ts`                     |

### Imports & Module Boundaries

- Use `@/*` path alias (maps to project root) for cross-directory imports.
- **Allowed**: `features/` → `lib/`, `features/` → `types/`, `app/` → `features/`.
- **Forbidden**: feature-to-feature direct imports, circular imports, deep relative cross-domain paths.
- Each feature exposes a public API via `index.ts` — import from the barrel, not internal paths.
- No direct `fetch` calls inside components — all data fetching goes through TanStack Query hooks in `features/<name>/hooks/` or `features/<name>/services.ts`.

### Components & React Patterns

- `app/` pages must be thin — import and compose feature modules, no complex logic.
- Use Server Components by default; add `"use client"` only when state/interactivity is needed.
- Prefer local state; reach for Zustand only for cross-component/feature state.
- Use `React.memo`, `useCallback`, `Suspense` boundaries, and lazy loading appropriately.
- Error boundaries with fallback UI for each major section.

### Styling

- Tailwind CSS utility classes only — no random `.css` files, no inline style objects.
- Dark theme is the default (`bg-gray-950 text-gray-100` on body).

### Error Handling

- Server-side (API routes): try/catch around AI calls, return structured error JSON, handle timeouts.
- Client-side: error boundaries, fallback UI, retry buttons.
- AI responses that fail validation must return a safe fallback (see `ai-behavior-contract.md`).
- Never let malformed AI responses crash the UI.

## AI Copilot Rules

The AI copilot is a **bounded assistant**, not a general chatbot. Key constraints:

- All LLM calls go through `app/api/ai/route.ts` — never expose API keys to the client.
- Structured JSON output only (validated with Zod against the schema in `ai-behavior-contract.md`).
- Low temperature (0.2) for deterministic, factual responses.
- Context injection: current page, user role, applied filters, visible metrics — serialized as structured JSON.
- Action types are an enum: `APPLY_FILTER`, `EXPORT_REPORT`, `HIGHLIGHT_METRIC` — never invent new ones.
- Rate limiting enforced server-side via `lib/rate-limit/`.

## Environment Variables

```
OPENAI_API_KEY        # Required — LLM provider key (server-side only)
LLM_MODEL             # Model identifier
NODE_ENV              # development | production
```

- Never commit `.env` files (gitignored via `.env*` pattern).
- Use `.env.local` for local development.
- Validate env vars on startup.

## Git Conventions

- Commit style: `feat: short description` (conventional commits preferred).
- Keep commits small and atomic.
- Run `npm run build` before pushing to verify no TypeScript/build errors.
- Run `npm run lint` to catch ESLint issues.

## Key Reference Documents

| Document                  | Purpose                                      |
|---------------------------|----------------------------------------------|
| `product-spec.md`         | Full product requirements and feature scope  |
| `architecture.md`         | System layers, AI flow, performance strategy |
| `folder-structure.md`     | Detailed folder rules and import boundaries  |
| `ai-behavior-contract.md` | AI output schema, safety rules, action types |
| `tech-stack.md`           | Stack choices and rationale                  |

## Anti-Patterns to Avoid

- Mixing AI/business logic into UI components.
- Direct LLM calls from the client.
- Global mutable state or unnecessary global stores.
- Deep prop drilling — use hooks or Zustand instead.
- Dumping files into generic `components/` or `utils/` — use feature folders.
- Large unstructured prompts — use the context-builder pattern.
- Importing across features directly — use `lib/` or `types/` as shared layers.
