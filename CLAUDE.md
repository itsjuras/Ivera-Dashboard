# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

When the user provides a reference image (screenshot) and optionally some CSS classes or style notes:

1. **Generate** a single index.html file using Tailwind CSS (via CDN). Follow 
2. **Screenshot** the rendered page using Puppeteer (npx puppeteer screenshot index.html --fullpage or equivalent). If the page has distinct sections, capture those individually too.
3. **Compare** your screenshot against the reference image. Check for mismatches in:
   - Spacing and padding (measure in px)
   - Font sizes, weights, and line heights
   - Colors (exact hex values)
   - Alignment and positioning
   - Border radii, shadows, and effects
   - Responsive behavior
   - Image/icon sizing and placement
4. **Fix** every mismatch found. Edit the HTML/Tailwind code.
5. **Re-screenshot** and compare again.
6. **Repeat** steps 3–5 until the result is within ~2–3px of the reference everywhere.

Do NOT stop after one pass. Always do at least 2 comparison rounds. Only stop when the user says so or when no visible differences remain.

## ⚠️ Data Layer — Read This First

**The frontend never talks to PostgreSQL directly. All data flows through the Express API.**

```
Screen → services/* (API client) → Express Route → Controller → Model → PostgreSQL
```

- `client/src/services/` makes HTTP calls to the Express API. No database imports in client code.
- `server/controllers/` contain request handlers that call models and return typed responses.
- `server/models/` own all database queries and schema logic. Controllers never write raw SQL.
- `server/routes/` map URL paths to controllers — routing logic only, no business logic.
- `server/middleware/` handles auth, validation, and error handling.
- DB columns are `snake_case`; TypeScript types are `camelCase`. Mapping lives in models.

---

## Project Summary

**Ivera Dashboard** — a web dashboard for business owners using Ivera, an AI assistant that answers calls, converts leads, and handles booking and payments automatically.

**Core features:**
1. **Statistics** — usage metrics, converted leads, active client count, revenue tracking
2. **Calendar** — scheduled clients synced from external calendar systems (Google Calendar, Apple Calendar, etc.)

**North Star:** a clean, data-rich dashboard that lets business owners see their AI assistant's performance at a glance and manage their client pipeline.

---

## Design Principles (Hard Requirements)

### Design is an iterative process
- Work in a loop: **requirements → blueprint → implement → verify → refine**.
- "Done" means:
  - All explicit requirements are implemented
  - Implicit requirements are satisfied (usability, reliability, performance, supportability, security)
  - The codebase is readable and shows a coherent, complete picture of the system

### Software Quality Attributes (optimize for these)

**Functionality**
- Implement requested behaviors completely across all dashboard domains (stats, calendar, etc.).
- Validate + sanitize input on all write endpoints.
- Structure auth cleanly even if it's stubbed (so it can be replaced safely later).

**Usability**
- Desktop-first dashboard UX; responsive down to tablet.
- Consistent spacing and typography; predictable navigation.
- Clear states for every view (loading/error/empty/success).

**Reliability**
- Predictable failure: safe errors, resilient network handling.
- Avoid brittle coupling across layers; keep boundaries stable.
- Guard DB and API calls with robust validation and parameterization.

**Performance**
- Avoid unnecessary re-renders; keep dashboard views lightweight.
- Optimize API queries; avoid N+1 patterns; return only needed fields.
- Avoid heavy dependencies unless ROI is strong.

**Supportability**
- Favor clarity over clever abstractions.
- High cohesion, low coupling, stable interfaces.
- Make it easy to add: new stat types, new calendar integrations, new dashboard widgets.

---

## Core Software Design Rules (Apply Always)

### Separation of Concerns
- Each layer has one job.
- UI should not know HTTP details; controllers should not know SQL details.
- Pages/views orchestrate — they should not contain heavy logic.

### Modularity
- Prefer small, named modules with explicit interfaces.
- Keep boundaries clean; integration complexity grows with module count.

### Information Hiding
- Hide implementation decisions behind small APIs.
- Views call `services/*` and never call Express endpoints with raw `fetch` scattered throughout components.
- Controllers call `models/*` and never write raw SQL inline.

### Functional Independence
- **High cohesion:** modules do one thing well.
- **Low coupling:** modules depend on stable contracts, not internals.

### Law of Demeter (Principle of Least Knowledge)
- Avoid deep reach chains across layers.
- Shape/flatten data at boundaries so components receive only what they need.
- Pass only what's needed to child components — not giant objects.

### Open/Closed (practical)
- Extend via new modules/functions rather than rewriting stable code.
- Prefer composition over inheritance.

---

## TypeScript + "OO" Principles (Use as maintainability tools)

### Abstraction
- Represent domain concepts using types that remain meaningful without implementation details.

### Liskov (interchangeability)
- If you introduce interchangeable implementations (e.g., calendar providers, auth strategies),
  they must behave consistently under the same contract.

### Dependency Inversion
- High-level code depends on abstractions (types/functions), not concrete provider details.

---

## Commands

### Client (`client/`)
```bash
cd client && npm install       # install dependencies
cd client && npm start         # React dev server (http://localhost:3000)
cd client && npm run build     # production build
cd client && npm run lint      # lint
```

### Server (`server/`)
```bash
cd server && npm install       # install dependencies
cd server && npm run dev       # Express dev server with hot reload
cd server && npm run build     # compile TypeScript
cd server && npm run lint      # lint
```

### Environment
```bash
cp server/.env.example server/.env
# Fill in: DATABASE_URL, PORT, and any auth/calendar API keys
```

### Prerequisites
- Node.js v18+
- PostgreSQL running locally or via managed service

---

## Architecture

### Client structure (`client/src/`)

| Folder | Role |
|--------|------|
| `views/` | Page-level React components (the "V" in MVC) — one per route/screen |
| `components/` | Reusable UI pieces (buttons, cards, charts, tables) |
| `hooks/` | Custom React hooks for shared stateful logic |
| `services/` | API client functions — the only place that makes HTTP calls to the server |
| `utils/` | Pure helper functions (formatting, date math, etc.) |
| `assets/` | Static assets (images, fonts, icons) |

### Server structure (`server/`)

| Folder | Role |
|--------|------|
| `controllers/` | Request handlers — receive req/res, call models, return JSON (the "C" in MVC) |
| `models/` | Database queries and data access logic (the "M" in MVC) — only layer that touches PostgreSQL |
| `routes/` | Express route definitions — maps HTTP methods + paths to controllers |
| `middleware/` | Auth, input validation, error handling, logging |
| `config/` | Database connection, environment variables, app configuration |

### Key data flows

**Dashboard stats:**
`StatsView → statsService.getStats() → GET /api/stats → statsController → statsModel → PostgreSQL`

**Calendar:**
`CalendarView → calendarService.getEvents() → GET /api/calendar/events → calendarController → calendarModel → PostgreSQL`
(Calendar data is synced from external providers via a separate existing system — the dashboard reads from the local DB.)

---

## Coding Conventions

- **TypeScript strict** throughout client and server — no `any` (use `unknown` + narrowing).
- Prefer **named exports** (unless the file already uses default exports).
- Keep components **small and composable**. Avoid giant files.
- Prefer **simple, explicit code** over abstractions.
- Avoid adding dependencies unless they provide strong ROI. Explain why if you add one.

### Architecture rules (enforce design principles)
- Keep **data access** out of UI: views call `services/*`, never raw `fetch` or direct API URLs.
- Keep **SQL** out of controllers: controllers call `models/*`, never write queries inline.
- Introduce **module boundaries** early: separate service files per domain (stats, calendar, auth, etc.).
- Prefer **composition** over inheritance-style patterns.
- Avoid tight coupling: don't import across layers "just because it works".

---

## "Gotchas" / Hard Rules
- **NEVER commit** `.env`, API keys, DB URLs, or tokens.
- Don't rewrite large parts of the repo unless asked.
- If unsure about a change that affects structure/dependencies, **propose a plan first**.
- Calendar data comes from an external sync system — the dashboard only reads it, never writes to external calendar APIs.
