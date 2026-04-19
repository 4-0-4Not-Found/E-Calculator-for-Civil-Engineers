import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

/** next-pwa default Workbox routes — includes same-origin `others` cache used by register.js on SPA nav. */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pwaDefaultRuntimeCaching = require("next-pwa/cache") as Array<Record<string, unknown>>;

/**
 * App routes that must be available offline after one online visit.
 * NOTE: Do NOT pass these as `additionalManifestEntries: [...]` — that replaces next-pwa’s
 * default `public/**` glob and drops manifest.json, icons, and other static precache entries,
 * which breaks offline installs. Use `manifestTransforms` below to append instead.
 */
const OFFLINE_SHELL_ROUTES = [
  "/",
  "/tension",
  "/compression",
  "/bending-shear",
  "/connections",
  "/report",
  "/info",
  "/workspace",
  "/offline",
];

const APP_SHELL_REVISION = "app-shell-v4";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  cacheStartUrl: true,
  cacheOnFrontEndNav: true,
  dynamicStartUrl: false,
  reloadOnOnline: true,
  fallbacks: {
    document: "/offline",
  },
  ignoreURLParametersMatching: [/^utm_/, /^fbclid$/, /^source$/, /^ref$/],
  /**
   * Omit `additionalManifestEntries` so next-pwa keeps the default precache of everything
   * under `public/` (icons, manifest.json, etc.) plus webpack-emitted assets.
   */
  manifestTransforms: [
    async (manifestEntries: Array<{ url: string; revision?: string | null }>) => {
      const normalize = (u: string) => u.replace(/%5B/g, "[").replace(/%5D/g, "]").split("?")[0];
      const seen = new Set(manifestEntries.map((m) => normalize(m.url)));
      const extra: Array<{ url: string; revision: string }> = [];
      for (const path of OFFLINE_SHELL_ROUTES) {
        const url = path.startsWith("/") ? path : `/${path}`;
        if (!seen.has(url)) {
          extra.push({ url, revision: APP_SHELL_REVISION });
          seen.add(url);
        }
      }
      return { manifest: [...manifestEntries, ...extra], warnings: [] };
    },
  ],
  runtimeCaching: [
    {
      urlPattern: ({ url }: { url: URL }) => url.origin === self.location.origin && url.pathname.startsWith("/_next/static/"),
      handler: "CacheFirst",
      method: "GET",
      options: {
        cacheName: "next-static-assets",
        expiration: {
          maxEntries: 256,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        },
      },
    },
    {
      urlPattern: ({ request, url }: { request: Request; url: URL }) => {
        if (url.origin !== self.location.origin || request.method !== "GET") return false;
        const hasRscParam = url.searchParams.has("_rsc") || url.searchParams.has("__nextDataReq");
        const hasRscHeaders = request.headers.get("RSC") === "1" || request.headers.get("Next-Router-State-Tree") !== null;
        return hasRscParam || hasRscHeaders;
      },
      handler: "StaleWhileRevalidate",
      method: "GET",
      options: {
        cacheName: "next-app-router-data",
        expiration: {
          maxEntries: 256,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        },
      },
    },
    ...pwaDefaultRuntimeCaching,
  ],
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [{ source: "/scope", destination: "/info", permanent: true }];
  },
};

export default withPWA(nextConfig);
