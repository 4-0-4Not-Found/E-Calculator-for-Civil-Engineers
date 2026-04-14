# Structural Steel Calculators

**Repository:** **[Civil-E-Cal](https://github.com/4-0-4Not-Found/Civil-E-Cal)** — `github.com/4-0-4Not-Found/Civil-E-Cal`

Structural Steel Calculators is a Next.js PWA for civil engineering students to run AISC-style tension, compression, beam, and connection checks in the browser, with local TypeScript calculations and offline support after first load.

---

## Key features

- **Module calculators** — Tension, compression, beam (bending/shear/deflection), and bolted/welded connections  
- **LRFD and ASD** where applicable, with step-by-step output for learning  
- **AISC v16 shapes** and material presets  
- **Local persistence** — inputs saved in the browser; optional JSON backup/restore  
- **Report** — combined snapshot from saved module data; print/save as PDF from the browser  
- **Fast UI** — Next.js App Router, responsive layout, keyboard-friendly navigation  

---

## Tech stack

| Layer | Technology |
|--------|------------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| UI | [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Calculations | TypeScript modules under `src/lib/` |
| PWA | [next-pwa](https://github.com/shadowwalker/next-pwa) |

---

## Project structure (App Router)

```text
src/
├── app/                    # Routes and layouts
│   ├── page.tsx            # Home
│   ├── tension/            # Tension module
│   ├── compression/      # Compression module
│   ├── bending-shear/      # Beam module
│   ├── connections/        # Connections module
│   ├── report/             # Combined report / print
│   ├── info/               # Help, units, limitations
│   ├── offline/            # Offline fallback page
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global styles
├── components/             # Shared UI (cards, navigation, actions, etc.)
└── lib/                    # Calculations, data, storage keys (core logic)
public/                     # Static assets, service worker
```

---

## Modules

| Module | Route | What it covers |
|--------|--------|----------------|
| **Tension** | `/tension` | Yielding, rupture, block shear; optional staggered net-width helper |
| **Compression** | `/compression` | Member buckling (e.g. AISC E3), effective length, LRFD/ASD |
| **Beam** | `/bending-shear` | Flexure, shear, deflection; check vs design modes where supported |
| **Connections** | `/connections` | Bolts (shear, bearing, slip, tension), interaction, welds, optional helpers |
| **Report** | `/report` | Snapshot of saved inputs/results across modules; print/PDF |
| **Info** | `/info` | Capabilities, units, limitations, tips |

Use the **header navigation** or **Home** to switch modules. **Footer links** on each page move to the previous/next module in a suggested order.

---

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)  
- npm (comes with Node)

### Steps

```bash
# Clone the repository
git clone https://github.com/4-0-4Not-Found/Civil-E-Cal.git
cd Civil-E-Cal

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Other commands

```bash
npm run build    # Production build
npm run start    # Run production server (after build)
npm run lint     # ESLint
npm test         # Vitest (calculation regression tests)
```

---

## Usage

### Navigation

- **Home (`/`)** — Dashboard, quick links to modules, project backup, install prompt (PWA).  
- **Top nav** — Jump to any module, Report, or Info.  
- **Continue** — Uses the last visited route stored locally (when available).  

### Using each calculator

1. Open the module from **Home** or the **nav bar**.  
2. Enter **steel**, **section**, **loads**, and **method** (LRFD/ASD) as prompted.  
3. Inputs **auto-save** in `localStorage` for that module (same browser).  
4. Review **results**, **limit states**, and optional **step-by-step** tables.  
5. Use **Copy summary**, **export** (CSV/JSON where offered), or **Report** for a combined view.  

Always confirm assumptions, units, and code edition with your course or a licensed engineer when required.

### Report

The **Report** page (`/report`) reads **saved module state** from the browser and shows a **single-page summary** suitable for review or **Print → Save as PDF**. It reflects what was last saved in each module on **this device and browser**.

---

## Design and UX

The interface is tuned for **students**: clear hierarchy, minimal clutter, **fast** data entry, readable numbers and tables, and **mobile-friendly** controls. The visual system uses a light base with restrained accent colors for structure and primary actions.

---

## PWA and offline

After the app loads once, the **service worker** caches assets so core routes can open **offline**. If the network is unavailable, the app may show the **offline** page; cached pages still work depending on cache state. **Install** the app from the browser (where supported) for an app-like shortcut.

---

## Git: one folder, one repository

Use **this project folder** as the Git root (File → Add Local Repository → choose the folder that contains `package.json` and `.git`).

- **Do not** place this whole project inside another Git repo as a subfolder that still has its own `.git` — GitHub Desktop will show errors like “nothing added to commit” or refuse to stage nested repos correctly.
- If you already copied this project **inside** another clone: either develop only in one folder, or copy **files only** (not the `.git` folder) into the other repo if you want one combined tree.

Remote `origin` should be [4-0-4Not-Found/Civil-E-Cal](https://github.com/4-0-4Not-Found/Civil-E-Cal). After changing remotes, run `git fetch origin` and reconcile history (`git pull --rebase origin main` or follow GitHub’s merge instructions if histories differ) before pushing.

---

## Contributing

1. **Fork** [4-0-4Not-Found/Civil-E-Cal](https://github.com/4-0-4Not-Found/Civil-E-Cal) and create a **feature branch** from `main` (or branch directly if you have write access).  
2. Keep changes **focused**; avoid unrelated refactors.  
3. Run **`npm run lint`**, **`npm test`**, and **`npm run build`** before opening a PR.  
4. Describe **what** changed and **why** in the PR.  
5. For calculation or code changes, add or update **tests** in `src/lib/calculations/*.test.ts` when applicable.  

---

## License

This project is licensed under the **MIT License** — see the [`LICENSE`](LICENSE) file in the repository root.

---

## Disclaimer

This tool is for **educational use**. It does not replace professional engineering judgment, peer review, or building code compliance. Verify critical designs with appropriate standards and qualified personnel.
