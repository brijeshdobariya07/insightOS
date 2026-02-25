# Architecture Document

# Project: insightOS

# Version: 1.0

---

# 1. Architecture Philosophy

insightOS is designed as a frontend-first, AI-integrated SaaS dashboard built with production-grade architectural
discipline.

The architecture prioritizes:

- Clear separation of concerns
- Feature-based modular structure
- Performance optimization
- AI integration safety
- Maintainability
- Minimal backend surface area

This is NOT a monolithic messy React app.
This is a structured, scalable frontend system.

---

# 2. High-Level System Overview

User (Browser)
↓
Next.js App Router (Frontend)
↓
Next.js API Route (AI Proxy Layer)
↓
LLM Provider (OpenAI / Anthropic API)

No direct AI calls from client.
All AI communication flows through secure API routes.

---

# 3. Architectural Layers

The application will follow a layered frontend architecture.

## 3.1 Presentation Layer

Responsible for:

- UI components
- Layouts
- Styling
- Visual states
- Streaming rendering

This layer must NOT:

- Call AI directly
- Contain business logic
- Handle data transformation

---

## 3.2 Feature Layer

Feature-based modules:

- dashboard
- metrics
- table
- logs
- ai-copilot
- auth (mock)

Each feature contains:

- Components
- Hooks
- Local state
- Types
- Utilities (if feature-specific)

Features must remain isolated and reusable.

---

## 3.3 State Management Layer

Global state will be minimal and predictable.

Use:

- Zustand (lightweight)
  OR
- Redux Toolkit (if needed for complexity)

State categories:

- Auth state
- Dashboard filters
- Copilot session state
- UI preferences

No random global state.
All state must be intentional.

---

## 3.4 Data Layer

Since Option A uses mock data:

- Static dataset generator
- API mock handlers
- Fetch abstraction layer
- TanStack Query for async state

Data should be abstracted to allow future DB integration without rewriting UI.

---

## 3.5 AI Proxy Layer (Server)

Located in:

/app/api/ai/route.ts

Responsibilities:

- Accept user query
- Inject contextual dashboard data
- Call LLM API
- Stream response
- Enforce structured JSON output
- Validate schema
- Handle errors
- Apply basic rate limiting
- Log usage

Client must never access AI API key.

---

# 4. Folder Structure Strategy

The project will follow feature-based architecture.

High-level structure:

```
insightOS/
│
├── app/
│   ├── (auth)/
│   ├── dashboard/
│   ├── api/
│   │   └── ai/
│   └── layout.tsx
│
├── features/
│   ├── metrics/
│   ├── data-table/
│   ├── logs/
│   ├── ai-copilot/
│   └── auth/
│
├── lib/
│   ├── ai/
│   ├── utils/
│   ├── validators/
│   └── rate-limit/
│
├── types/
│
├── product-spec.md
├── architecture.md
└── README.md
```

No dumping everything in `components/`.

We organize by feature, not file type.

---

# 5. AI Copilot Architecture

The AI Copilot system consists of:

1. Copilot UI Panel
2. Copilot State Manager
3. Context Builder
4. AI API Proxy
5. Structured Response Validator
6. Action Dispatcher

---

## 5.1 Context Builder

Before sending request to AI:

System gathers:

- Current route
- Active filters
- Visible metrics
- User role

Context is serialized into structured JSON.
Not free-text concatenation.

---

## 5.2 AI Response Flow

Server returns:

- Streaming content
- Final structured JSON payload

Client:

- Renders stream progressively
- Validates final JSON
- Updates UI safely
- Displays suggested actions

---

## 5.3 Action Dispatcher

AI suggested actions are:

Validated →
Mapped to frontend-safe handlers →
Executed deterministically

AI never executes raw code.
Only structured action types.

---

# 6. State Strategy

Global State (Zustand example):

- user
- dashboardFilters
- copilotSession
- uiState

Local state preferred whenever possible.

Avoid unnecessary global coupling.

---

# 7. Performance Strategy

- React.memo where appropriate
- useCallback only when needed
- Virtualized tables (react-virtual)
- Lazy loaded heavy components
- Suspense boundaries
- Streaming AI UI
- Avoid prop drilling

---

# 8. Security Strategy

- AI key in server env only
- Rate limiting in API route
- Input validation
- Structured output schema validation
- No eval or dynamic execution
- Prompt injection mitigation by:
    - System instructions
    - Context boundaries
    - Strict output mode

---

# 9. Error Handling Strategy

Client Side:

- Error boundaries
- Fallback UI
- Retry buttons

Server Side:

- Try/catch around AI calls
- Structured error response
- Timeout handling
- Safe fallback message

---

# 10. Logging Strategy (Basic)

Server:

- Log AI request metadata
- Log token usage
- Log errors

Client:

- Console warnings for invalid structure
- Silent fallback for malformed responses

---

# 11. Scalability Considerations (Future)

Even though this is Option A:

Architecture must allow:

- Database integration
- Real auth provider
- Multiple workspaces
- WebSocket streaming
- External data sources

Design now so expansion is possible.

---

# 12. Anti-Patterns To Avoid

- Mixing AI logic in UI components
- Global mutable state
- Direct LLM calls from client
- Large unstructured prompts
- Overengineering backend
- Deep prop drilling
- Random utility dumping

---

END OF ARCHITECTURE DOCUMENT
