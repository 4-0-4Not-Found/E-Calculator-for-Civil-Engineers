# SteelSight — System Documentation

## Introduction

### Purpose of the system
SteelSight is a web-based engineering tool that helps users run **AISC 360–style structural steel checks** directly in the browser. It is built for learning and iterative design/checking workflows: enter inputs, review results and steps, then compile a combined report.

### Target users
- **Primary**: civil/structural engineering students completing steel design coursework.
- **Secondary**: instructors/TAs who want a quick, consistent tool for demonstrations and homework support.

This tool is intended for **educational use** and does not replace professional engineering judgment.

---

## System overview

### How the system works (high level)
- The UI is implemented as a **multi-page Next.js App Router** application.
- Each calculator module is a client-rendered page that:
  - manages form state in React,
  - persists inputs to `localStorage`,
  - calls **local TypeScript calculation functions** under `src/lib/`,
  - renders results, limit states, and a step-by-step breakdown.
- The **Report** module reads saved module inputs from `localStorage` and recomputes summaries using the same calculation engine, ensuring consistency between modules and report output.
- The app is configured as a **PWA** so it can be installed and used offline after an initial load (subject to cache state).

### Key features and capabilities
- Dedicated modules for:
  - Tension
  - Compression
  - Bending (flexure, shear, deflection)
  - Shear (web shear capacity, workbook PROGRAM-2 parity)
  - Report (combined snapshot)
  - Info (capabilities, units, limitations, tips)
- **Local persistence**: module inputs auto-save in the browser.
- **In-app save slots**: up to 20 named slots per module.
- **Compare runs**: pin a baseline snapshot and compare current results.
- **Responsive UI**: mobile-first layout and touch-friendly controls.
- **Offline support**: service worker caching + offline fallback route (`/offline`).

---

## System architecture

### Frontend (Next.js App Router)
The app uses Next.js 16’s **App Router**. Pages are located under `src/app/` and are routed by folder name.

Key user-facing routes:
- `/` (Home)
- `/tension`
- `/compression`
- `/bending-shear` (Bending module)
- `/shear`
- `/report`
- `/info`
- `/offline` (PWA fallback page)

Legacy redirects (kept to avoid 404s on stale bookmarks):
- `/connections`, `/combined` → `/`
- `/workspace` → `/`
- `/scope` → `/info`

### Component structure
Reusable UI and feature components live under `src/components/`. Examples include:
- layout shell (`AppShell`) and navigation (`AppHeader`, `PageFooterNav`, `PageSectionNav`)
- UI primitives (`Card`, `Button`, `Field`, inputs)
- results display (`ResultHero`, `UtilizationBar`)
- step-by-step tables (`StepsTable`)
- action controls (`CalculatorActionRail` — save slots, compare, reset)

### Engineering logic (local TypeScript modules)
All engineering logic is implemented as local, importable TypeScript functions under `src/lib/`. These modules do not depend on a remote API for computations.

Key calculation entry points include:
- `src/lib/limit-state-engine/tension.ts`: `calculateTensionDesign(...)`
- `src/lib/limit-state-engine/compression.ts`: `calculateCompressionDesign(...)`
- `src/lib/limit-state-engine/bending.ts`: `calculateBendingShearDesign(...)`
- `src/lib/limit-state-engine/shear.ts`: `calculateShearDesign(...)`

Calculation functions return a structured output (see `src/lib/types/calculation`) that includes:
- a numeric **capacity/strength** (and demand),
- a **governing case** identifier,
- a set of **limit-state results**,
- and a structured **step list** (for step-by-step tables).

### No backend / no API routes

The application has **no server-side compute** and **no API routes**. All work — calculation, storage, and report generation — happens in the browser. The project is intentionally designed to be deployable as a static-ish Next.js app with no required environment variables or services.

---

## Modules description

### Tension
**Route**: `/tension`  
**Purpose**: Evaluate axial tension member capacity using gross yielding, net-section rupture, and block shear checks, and provide learning-focused steps.

**Key functions (calculation layer)**:
- `calculateTensionDesign(...)` (`src/lib/limit-state-engine/tension.ts`)
- `staggeredNetWidthInches(...)` (`src/lib/limit-state-engine/net-area.ts`) — helper used by the UI tool

**Key inputs (UI-level)**:
- Material (Fy, Fu) via `src/lib/data/materials.ts`
- Shape selection (AISC v16 database) via `src/lib/aisc/data.ts`
- Areas and factors: \(A_g\), \(A_n\), \(U\)
- Demand: \(P_u\) / \(P_a\) depending on design method
- Optional block shear areas: \(A_{gv}, A_{nv}, A_{gt}, A_{nt}\) and \(U_{bs}\)

**Outputs**:
- Governing case + controlling strength (kips)
- Limit-state capacities (yielding, rupture, block shear)
- Step-by-step trail suitable for display in `StepsTable`

### Compression
**Route**: `/compression`  
**Purpose**: Evaluate axial compression capacity with a focus on member buckling behavior and KL/r sensitivity.

**Key functions (calculation layer)**:
- `calculateCompressionDesign(...)` (`src/lib/limit-state-engine/compression.ts`)

**Key inputs (UI-level)**:
- Material (Fy) via `src/lib/data/materials.ts`
- Shape selection via `src/lib/aisc/data.ts` and family filters (`src/lib/aisc/shape-filters.ts`)
- Effective length factor \(K\), unbraced length \(L\)
- Section properties (e.g., \(r_x\), \(r_y\), \(A_g\)) from the shape database

**Outputs**:
- Controlling compression strength (kips) and safe/unsafe status for the entered demand
- Step-by-step values including slenderness, Euler stress, and critical stress selection

### Bending
**Route**: `/bending-shear`  
**Purpose**: Evaluate a simply supported strong-axis member for flexure, shear, and deflection, and provide a quick load-to-demand helper workflow.

**Key functions (calculation layer)**:
- `calculateBendingShearDesign(...)` (`src/lib/limit-state-engine/bending.ts`)
- Load helper utilities under `src/lib/excel-parity` (used to convert D/L inputs into demands)
- `flangeWebSlenderness(...)` (`src/lib/limit-state-engine/section-slenderness.ts`) — classification info displayed in UI

**Key inputs (UI-level)**:
- Material selection (Fy)
- Shape selection (W-shapes and (in check mode) HSS are supported by the UI)
- Demands: \(M_u\), \(V_u\)
- Length/span: \(L\) (inches) and service load used for deflection
- Lateral-torsional buckling inputs: \(L_b\) and \(C_b\)

**Outputs**:
- Limit-state utilization ratios (bending, shear, deflection) and a governing check
- Summary results rendered in `ResultHero` + limit-state cards
- Step-by-step calculation output

### Shear
**Route**: `/shear`  
**Purpose**: Evaluate web shear capacity (G2) following the PROGRAM-2 Shear (ANALYSIS) workbook conventions.

**Key functions (calculation layer)**:
- `calculateShearDesign(...)` (`src/lib/limit-state-engine/shear.ts`)

**Key inputs (UI-level)**:
- Material (Fy) and shape selection (W-shapes only)
- Design method (LRFD/ASD)
- Demand \(V_u\) / \(V_a\)
- Stiffening mode (`unstiffened` / `stiffened`) and the optional clear-distance \(\alpha\) input for stiffened webs

**Outputs**:
- Governing \(C_v\) case detection and capacity \(V_n\)
- Method-aware controlling strength for LRFD or ASD
- Step-by-step trail rendered in `StepsTable`

### Report
**Route**: `/report`  
**Purpose**: Present a combined project summary derived from saved module inputs in the current browser.

**How it works**:
- Reads module input blobs from `localStorage` (`src/lib/storage/keys.ts`)
- Summarizes modules using `src/lib/report/snapshot-store.ts` which calls module-specific summarizers
- Renders tables designed for print/PDF workflows

**Inputs**:
- Saved browser state only (no manual inputs on the Report page)

**Outputs**:
- A combined summary for Tension, Compression, Bending, and Shear
- Print/PDF-friendly layout, including calculation step tables when available

### Info
**Route**: `/info`  
**Purpose**: Provide in-app documentation: capabilities, limitations, units, and tips.

**Content**:
- Summarizes what each module covers and what the system does not replace
- Documents common unit conventions used in the calculators

---

## Data and calculations

### How calculations are handled
- Calculations are executed locally by calling deterministic TypeScript functions in `src/lib/limit-state-engine/`.
- UI pages pass parsed numeric inputs (strings from inputs → numbers) to calculation functions.
- Calculation functions return a structured output including:
  - limit-state results and governing case
  - demand vs capacity comparisons
  - step-by-step values for educational review

### Engineering data sources
- **AISC v16 shapes**: loaded from `data/aisc-shapes-v16.json` and exposed via `src/lib/aisc/data.ts`.
- **Material presets**: defined in `src/lib/data/materials.ts` (Fy/Fu for common grades used by the UI).

---

## User workflow

### End-to-end flow (typical)
1. **Open Home** (`/`) and select a module.
2. **Enter inputs** (material, shape, demands, geometry, method) as prompted.
3. The module **auto-saves** inputs locally (per-module key in `localStorage`).
4. The UI recomputes and displays:
   - status (safe/unsafe/invalid),
   - governing case,
   - limit-state capacities/utilizations,
   - step-by-step table(s).
5. Use module actions to:
   - save the current inputs to a named slot,
   - pin and compare runs,
   - reset inputs stored in this browser.
6. Open **Report** (`/report`) to generate a combined snapshot from the saved module inputs in this browser.

---

## Project structure (folders)

### `src/app/`
Holds page routes:
- module pages (`/tension`, `/compression`, `/bending-shear`, `/shear`)
- supporting routes (`/report`, `/info`, `/offline`)
- legacy redirect-only routes (`/connections`, `/combined`, `/workspace`, `/scope`)

### `src/components/`
Reusable presentation and interaction components: layout shells, UI primitives, navigation, step tables, results cards, and action rails.

### `src/lib/`
Domain logic and shared utilities:
- calculation engines (`src/lib/limit-state-engine/`)
- engineering data access (`src/lib/aisc/`, `src/lib/data/`)
- report summarization (`src/lib/report/`)
- persistence keys (`src/lib/storage/`)

---

## Technical stack

- **Next.js 16** (App Router)
- **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **next-pwa** for service worker generation and offline fallback routing
- **Vitest** for calculation regression testing

---

## PWA and offline functionality

PWA behavior is configured in `next.config.ts` via `next-pwa`:
- Service worker output is written to `public/`
- PWA is disabled in development (`disable: process.env.NODE_ENV === "development"`)
- Offline fallback document route is `/offline`

In practice:
- After a successful online load, core assets can be cached.
- When offline, navigation may fall back to `/offline` if a route is not available in cache.

---

## System limitations

The in-app Info page documents key limitations. Examples include:
- The tool does not replace full connection design (bolts, welds, prying, eccentric bolt groups, end-plate detailing).
- Bending design mode does not search HSS (HSS is intended for check mode with the module’s stated simplifications).
- Not all advanced AISC provisions are implemented for every possible shape and condition; some checks are simplified for education.

See `/info` for the canonical, user-facing limitations list.

---

## Future improvements (realistic)

Suggestions that fit the existing architecture (UI pages + pure calculation modules):
- **More explicit input validation UX**: tighter per-field validation messaging.
- **Expanded test coverage**: add more regression cases for edge inputs (very small/large values, boundary conditions).
- **More report configurability**: include optional “key steps only” sections per module (reusing existing step filtering logic where applicable).
- **Performance profiling pass**: reduce unnecessary recalculations by memoizing derived UI-only structures (while keeping calculations correct and readable).
