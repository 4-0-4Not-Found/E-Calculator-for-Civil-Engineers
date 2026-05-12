# Continuation handoff (SteelSight)

Use this file when starting a **new chat thread** so context is not lost.

## Product

- **Brand:** SteelSight (`src/lib/brand.ts`); visible app title/tagline in `src/lib/ui/strings.ts` also pull from `PRODUCT_BRAND`.
- **PWA / metadata:** `public/manifest.json`, `src/app/layout.tsx`
- **Install icons:** `public/icons/icon-{180,192,512}.png`, `public/apple-touch-icon.png`, in-app brand image `public/publicbrandowl-logo.png`.

## Structural differences vs other white-label copy

- **Calculation modules path:** `src/lib/limit-state-engine/` (renamed from `calculations/`).
- **Browser storage namespace:** `src/lib/client-persistence.ts` + `src/lib/storage/keys.ts` — keys live under `spanledger/v1/*` and are **not** shared with other deployments.
- **Theme / UI persistence keys:** also under `CLIENT_PERSISTENCE` in `client-persistence.ts`.

## Active modules

- **Home** (`/`), **Tension** (`/tension`), **Compression** (`/compression`), **Bending** (`/bending-shear`), **Shear** (`/shear`), **Report** (`/report`), **Info** (`/info`).
- Removed modules retain redirect-only pages to avoid 404s on stale bookmarks: `/combined`, `/connections`, `/workspace`, `/scope` all redirect home or to `/info`.

## Verified commands (from `aisc-pwa/`)

- `npm test` — calculation parity (Vitest)
- `npm run lint`
- `npm run build`
