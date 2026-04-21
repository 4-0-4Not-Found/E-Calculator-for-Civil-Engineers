# Continuation handoff (SpanLedger Steel)

Use this file when starting a **new chat thread** so context is not lost.

## Product

- **Brand:** SpanLedger Steel (`src/lib/brand.ts`); visible app title/tagline in `src/lib/ui/strings.ts` also pull from `PRODUCT_BRAND`.
- **PWA / metadata:** `public/manifest.json`, `src/app/layout.tsx`
- **Install icons:** `public/icons/icon-*.png`, `public/apple-touch-icon.png` (generated art + vector mark at `public/brand/spanledger-mark.svg`)

## Structural differences vs other white-label copy

- **Calculation modules path:** `src/lib/limit-state-engine/` (renamed from `calculations/`).
- **Browser storage namespace:** `src/lib/client-persistence.ts` + `src/lib/storage/keys.ts` — keys are **not** shared with other deployments.
- **Theme / UI persistence keys:** also under `CLIENT_PERSISTENCE` in `client-persistence.ts`.

## Navigation

- **All primary routes** remain: Home, Tension, Compression, Beam (`/bending-shear`), Connections, Report, Info (see `PageFooterNav`, `AppHeader`, `CommandPalette`).
- `/workspace` still redirects to `/` (legacy).

## Open work (when you resume)

- Client formal instructions + any Excel-driven formula tweaks.
- Parity benchmark cases (Excel vs app) as agreed in planning.
- Optional: trim/replace root `README.md` if it still describes the old product name.

## Last verified commands (from project folder)

- `npm test`
- `npm run lint`
- `npm run build`
