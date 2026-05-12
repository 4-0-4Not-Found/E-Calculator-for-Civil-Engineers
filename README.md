# SpanLedger Steel (PWA) — Structural Steel Calculators

SpanLedger Steel is a browser-first set of structural steel calculators designed for **learning and coursework workflows**. It runs AISC-360–style checks using **local TypeScript calculation modules** (no external calculation service), provides step-by-step breakdowns for review, and supports offline-friendly usage via a **Progressive Web App (PWA)**.

> Educational tool only: verify real designs with applicable standards and qualified review.

---

## Features

- **Four calculator modules**: Tension, Compression, Bending (Bending & Shear page), Shear
- **Report / print-to-PDF**: combined project snapshot computed from saved module inputs
- **Autosave**: inputs persist to `localStorage` per module (device + browser scoped)
- **In-app save slots**: up to 20 named slots per module (save, rename, load, delete)
- **Compare runs**: pin a baseline snapshot and compare current results (browser-local)
- **PWA/offline support**: caches core app shell and provides `/offline` fallback
- **Responsive UI**: mobile-first layout, keyboard-friendly controls

---

## Tech stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19 + TypeScript
- **Styling**: Tailwind CSS v4
- **PWA**: `next-pwa` (service worker emitted to `public/` during production build)
- **Validation**: Zod schemas for persisted drafts (module-level)
- **Testing**: Vitest (calculation regression tests)

---

## System architecture (high level)

### Request/compute model

This system is intentionally “frontend-heavy”:

- **Calculations run locally** by importing pure TypeScript functions from `src/lib/limit-state-engine/**`.
- Each module page:
  - manages form state in React,
  - converts string inputs → numeric inputs,
  - calls the calculation engine,
  - renders results + a structured step list.
- The **Report** page re-reads saved inputs and **recomputes** outputs using the same calculation engine (so module and report output remain consistent).

### Routes (App Router)

User-facing routes:

- `/` — Home dashboard
- `/tension` — Tension module
- `/compression` — Compression module
- `/bending-shear` — Bending module (bending/shear/deflection)
- `/shear` — Shear module (web shear; workbook PROGRAM-2 parity)
- `/report` — Combined report snapshot (print/PDF friendly)
- `/info` — In-app documentation: scope, units, limitations, tips
- `/offline` — PWA offline fallback page

Legacy redirect routes (kept to avoid 404s on stale bookmarks):

- `/connections`, `/combined` → `/`
- `/workspace` → `/`
- `/scope` → `/info`

### No application backend

There is **no application backend** for engineering computations (no database, no remote compute service, no API routes). All work — calculation, storage, and report generation — happens client-side in the browser.

---

## Frontend structure and design system

The UI is organized into:

- `src/app/**`: module pages and supporting routes (`layout.tsx`, module `page.tsx` files)
- `src/components/**`: reusable components
  - **Layout/navigation**: `AppShell`, `AppHeader`, `PageFooterNav`, section navigation
  - **UI primitives**: `Card`, `Button`, `Field`, `InputGroup`, `Toast`, `ConfirmDialog`
  - **Results**: `ResultHero`, `UtilizationBar`, `StepsTable`
  - **Actions**: `CalculatorActionRail` (save slots + compare + reset)
  - **Compare**: `CompareDrawer` (pin vs current)
- `src/features/**`: cross-page UX utilities and feature modules (e.g. autosave hook)
- `src/lib/**`: calculation engine, domain data, formatting, storage keys, report summarizers
- `src/data/**`: engineering data and verification documents

Styling is Tailwind-first with small UI primitives used to keep module pages consistent.

---

## Module breakdown

| Module | Route | What it does (summary) |
|---|---|---|
| **Tension** | `/tension` | Gross yielding, net-section rupture, block shear. Includes stagger helper. Supports LRFD/ASD and “check vs design” modes. |
| **Compression** | `/compression` | Member compression capacity with KL/r sensitivity. Supports LRFD/ASD and “check vs design” modes. |
| **Bending** | `/bending-shear` | Flexure, shear, and deflection checks. Includes helper inputs to derive demands from loads/span. Supports “check vs design” modes. |
| **Shear** | `/shear` | Web shear capacity (G2) from workbook PROGRAM-2 Shear (ANALYSIS), with stiffened/unstiffened cases. |
| **Report** | `/report` | Reads saved module inputs from this browser and recomputes a combined snapshot for printing/PDF. |
| **Info** | `/info` | Scope, units, limitations, and workflow tips. |

### Calculation engine entry points (reference)

The core calculations live in `src/lib/limit-state-engine/**`. Typical entry points:

- `calculateTensionDesign(...)` (`src/lib/limit-state-engine/tension.ts`)
- `calculateCompressionDesign(...)` (`src/lib/limit-state-engine/compression.ts`)
- `calculateBendingShearDesign(...)` (`src/lib/limit-state-engine/bending.ts`)
- `calculateShearDesign(...)` (`src/lib/limit-state-engine/shear.ts`)

Each returns a structured `CalculationOutput` (see `src/lib/types/calculation`) containing:

- **results**: per-limit-state capacities
- **governingCase** and **controllingStrength**
- **demand** and **isSafe**
- **steps**: a structured step-by-step list rendered by `StepsTable`

---

## Data flow: input → output (end-to-end)

1. **User edits inputs** on a module page (`src/app/<module>/page.tsx`).
2. Inputs remain as **strings** for form control, then are parsed into numbers for compute.
3. The module calls its evaluator / calculation function and renders:
   - overall status (safe/unsafe/invalid),
   - governing case and capacities/demand,
   - limit-state table(s) and step-by-step breakdown.
4. In parallel, inputs are **autosaved** to `localStorage` using `useBrowserDraft(...)`.
5. The **Report** page reads saved module JSON blobs and recomputes outputs to produce a print-ready snapshot.

---

## Storage, autosave, and privacy

### What is stored

Module inputs are persisted in `localStorage` under these keys (`src/lib/storage/keys.ts`):

- `spanledger/v1/forms/tension`
- `spanledger/v1/forms/compression`
- `spanledger/v1/forms/beam-flexure`
- `spanledger/v1/forms/shear`

Additional UI-level keys (theme, compare snapshots, last route, save slots, etc.) are defined in `src/lib/client-persistence.ts`.

### Scope and behavior

- Storage is **device + browser** scoped.
- Clearing site data clears saved inputs.
- Report output depends on what is saved locally; it does not fetch server-side state.

---

## Getting started

### Prerequisites

| Tool | Minimum version | Notes |
|---|---|---|
| **Node.js** | **20.9** (LTS recommended) | Download from [nodejs.org](https://nodejs.org/). |
| **npm** | 10+ | Bundled with Node.js. |
| (optional) **Git** | any recent | Only needed if cloning the repo (Option B). |

Verify in a fresh terminal:

```bash
node -v
npm -v
```

### Option A — Run from a ZIP archive

1. **Unzip** the archive to any folder (a plain path like `C:\projects\spanledger-steel` works best).
2. **Open a terminal** in the project folder (`aisc-pwa/`).
3. **Install dependencies** (only the first time):
   ```bash
   npm install
   ```
4. **Start the dev server:**
   ```bash
   npm run dev
   ```
   Open <http://localhost:3000> in any modern browser.

### Option B — Run from the Git repository

```bash
git clone <your-repo-url>
cd <repo-folder>/aisc-pwa
npm install
npm run dev
```

Open <http://localhost:3000>.

### Production build (for offline / PWA testing)

PWA install and offline behavior are **only enabled in production builds**. To test them locally:

```bash
npm run build
npm run start
```

Then open <http://localhost:3000>. After the first visit, the page can be installed and used offline.

### Quality checks

```bash
npm run lint   # Code static analysis
npm test       # Calculation regression tests (16 tests across 4 files)
```

### Deploying to Vercel (optional)

1. Push the repository to GitHub.
2. Go to <https://vercel.com/new> and import the repository.
3. Framework preset **Next.js**. Build command `npm run build`. No environment variables required.
4. Click **Deploy**. Full PWA behavior (install prompt, offline) activates on the deployed (https) URL.

### Typical end-user workflow

1. Start at **Home** (`/`) and open a module (keyboard shortcuts: `1`–`4` for the four calculators).
2. Pick a material and AISC shape, then enter the demands.
3. Use the action rail to:
   - save the current inputs to a named slot (up to 20 per module),
   - pin and compare runs,
   - reset the inputs stored in this browser.
4. Open **Report** (`/report`) and click **Print / Save PDF** for submission or review.

---

## Key workflows (details)

### Compare runs (pin vs current)

Each module can store a “pinned” snapshot in the browser and compare it to the current run:

- Pin current run → saved in `localStorage` under `CLIENT_PERSISTENCE.compareSnapshot(<module>)`
- Compare view parses common metrics (capacity/demand/utilization/governing) from the module’s summary lines

### Save slots (per module)

Each calculator page exposes a Save Slots panel:

- Up to 20 named slots per module
- Slots are saved, renamed, loaded, or deleted entirely client-side
- Loading a slot writes its payload back into the module’s draft store and reloads the page

---

## PWA / offline behavior

PWA is configured in `next.config.ts` using `next-pwa`:

- Service worker is emitted to `public/sw.js` during `npm run build`
- PWA behavior is **disabled in development** and enabled in production builds
- `/offline` is used as a document fallback when offline and content is unavailable

Practical expectations:

- After a successful online load, core assets can be cached.
- Offline navigation depends on cache state; when a route cannot be served from cache, the app falls back to `/offline`.

---

## Deployment (Vercel)

### Production readiness notes

- The app builds cleanly with `next build` and runs with `next start`.
- Calculations run client-side; there is no database or external compute dependency.

### Deploy steps

1. Push the repository to GitHub.
2. In Vercel:
   - Framework preset: **Next.js**
   - Build command: `npm run build`
   - Output: default (Next.js)
3. Deploy. No required environment variables are expected for baseline operation.

If you change caching/PWA behavior, always validate on a Vercel preview deployment (service workers can make debugging confusing if older caches persist).

---

## Future improvements (optional)

- Expand regression coverage for edge cases and boundary conditions (see `src/data/VERIFICATION_TESTS.md`).
- Performance profiling: reduce unnecessary UI re-renders while keeping calculations deterministic and readable.

---

## License

MIT (see `LICENSE`).

---

## Disclaimer

This tool is for **educational use** only. It does not replace professional engineering judgment, peer review, or code-compliant design checks. Always validate critical designs with appropriate standards and qualified personnel.
