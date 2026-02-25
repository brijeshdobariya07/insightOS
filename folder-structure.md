# Folder Structure Definition

# Project: insightOS

# Version: 1.0

---

# 1. Folder Philosophy

insightOS follows a feature-based architecture.

We do NOT organize by:

- components/
- hooks/
- utils/

We organize by feature domain.

Each feature must be:

- Isolated
- Modular
- Self-contained
- Scalable

This structure ensures:

- Maintainability
- Clear ownership boundaries
- Easy expansion
- AI agent alignment

---

# 2. Root Structure

```
insightOS/
│
├── app/
├── features/
├── lib/
├── types/
│
├── product-spec.md
├── architecture.md
├── folder-structure.md
└── README.md
```

---

# 3. app/ Directory (Next.js App Router)

This folder handles routing and layout only.

It must NOT contain business logic.

```
app/
│
├── layout.tsx
├── page.tsx
│
├── dashboard/
│   ├── page.tsx
│   ├── loading.tsx
│   └── error.tsx
│
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   └── register/
│       └── page.tsx
│
└── api/
    └── ai/
        └── route.ts
```

Rules:

- app/ only wires pages to features.
- No complex logic inside page.tsx.
- Pages import feature modules.

---

# 4. features/ Directory

Core application logic lives here.

Each feature must follow consistent structure.

```
features/
│
├── auth/
│   ├── components/
│   ├── hooks/
│   ├── store.ts
│   ├── types.ts
│   └── index.ts
│
├── dashboard-layout/
│   ├── components/
│   ├── hooks/
│   └── index.ts
│
├── metrics/
│   ├── components/
│   ├── hooks/
│   ├── services.ts
│   ├── types.ts
│   └── index.ts
│
├── data-table/
│   ├── components/
│   ├── hooks/
│   ├── services.ts
│   ├── types.ts
│   └── index.ts
│
├── logs/
│   ├── components/
│   ├── hooks/
│   ├── services.ts
│   ├── types.ts
│   └── index.ts
│
└── ai-copilot/
    ├── components/
    ├── hooks/
    ├── services/
    ├── store.ts
    ├── types.ts
    ├── context-builder.ts
    ├── action-dispatcher.ts
    └── index.ts
```

---

# 5. Feature Folder Responsibilities

## 5.1 components/

UI components specific to that feature.

Rules:

- No cross-feature imports
- Pure presentation if possible
- Keep logic in hooks/services

---

## 5.2 hooks/

Custom hooks for feature logic.

Examples:

- useMetricsData()
- useDashboardFilters()
- useCopilotSession()

Hooks:

- Manage async state
- Handle data transformation
- Connect to global store when needed

---

## 5.3 services.ts (or services/ folder)

Responsible for:

- Data fetching
- Data transformation
- API calls (if feature-specific)

Services must:

- Not contain UI logic
- Not manipulate DOM
- Return predictable outputs

---

## 5.4 store.ts

Feature-level state (if required).

Use:

- Zustand

Store should:

- Only manage feature-specific state
- Avoid global pollution

---

## 5.5 types.ts

All TypeScript interfaces and types for the feature.

Never mix feature types across folders.
Shared types go in /types directory.

---

## 5.6 index.ts

Public export boundary.

Each feature exposes only controlled exports.

Example:

```
export { MetricsDashboard } from "./components/MetricsDashboard"
export { useMetricsData } from "./hooks/useMetricsData"
```

Do NOT expose internal utilities.

---

# 6. lib/ Directory

Reusable cross-feature utilities.

```
lib/
│
├── ai/
│   ├── prompt-builder.ts
│   ├── response-parser.ts
│   └── schema-validator.ts
│
├── rate-limit/
│   └── memory-rate-limiter.ts
│
├── utils/
│   ├── formatters.ts
│   ├── constants.ts
│   └── helpers.ts
│
└── validators/
    └── copilot-schema.ts
```

Rules:

- lib/ must contain pure logic only
- No React components
- No feature-specific imports
- No circular dependencies

---

# 7. types/ Directory

Shared types across features.

```
types/
│
├── dashboard.ts
├── copilot.ts
└── common.ts
```

Only shared domain models belong here.

---

# 8. AI Copilot Special Structure

The ai-copilot feature is the most important.

```
features/ai-copilot/
│
├── components/
│   ├── CopilotPanel.tsx
│   ├── CopilotMessage.tsx
│   ├── CopilotInput.tsx
│   ├── CopilotSuggestions.tsx
│   └── CopilotStreamingRenderer.tsx
│
├── hooks/
│   ├── useCopilotSession.ts
│   └── useCopilotActions.ts
│
├── services/
│   └── copilot-api.ts
│
├── store.ts
├── types.ts
├── context-builder.ts
├── action-dispatcher.ts
└── index.ts
```

This feature must:

- Build structured context
- Send safe API requests
- Handle streaming
- Validate response
- Dispatch safe actions

It is isolated from dashboard logic.
It consumes dashboard state through controlled hooks.

---

# 9. Naming Conventions

Files:

- kebab-case for folders
- PascalCase for components
- camelCase for hooks
- *.types.ts for feature types

Components:

- Always PascalCase
- Single responsibility
- Avoid massive components

Hooks:

- Always prefixed with "use"
- No side effects outside scope

---

# 10. Import Rules

Allowed:

- features can import from lib/
- features can import from types/
- app/ can import from features/

Not Allowed:

- features importing from other features directly
- circular imports
- deep relative imports across domains

---

# 11. Expansion Strategy

This structure must allow:

- Adding new modules
- Replacing mock services with real APIs
- Adding WebSocket streaming
- Adding multi-workspace support
- Adding persistent DB later

No restructuring should be required.

---

# 12. Architectural Discipline Rule

If a file feels “unclear where it belongs”:

You are breaking structure.

Stop.
Refactor.
Re-evaluate responsibility.

Structure first.
Code second.

---

END OF FOLDER STRUCTURE DOCUMENT
