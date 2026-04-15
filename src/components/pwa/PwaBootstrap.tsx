"use client";

import { useEffect } from "react";

const CORE_ROUTES = ["/", "/tension", "/compression", "/bending-shear", "/connections", "/report", "/info", "/workspace"];

/**
 * Ensures service worker registration in production and warms
 * core route documents so installed app can reopen offline.
 */
export function PwaBootstrap() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;

    const warmCoreRoutes = async () => {
      const warmOne = async (path: string) => {
        try {
          const ctrl = new AbortController();
          const timer = window.setTimeout(() => ctrl.abort(), 7000);
          await fetch(path, {
            method: "GET",
            credentials: "same-origin",
            cache: "reload",
            signal: ctrl.signal,
          });
          window.clearTimeout(timer);
        } catch {
          // Ignore warm-up failures; app still works online.
        }
      };

      for (const path of CORE_ROUTES) {
        if (cancelled) return;
        // eslint-disable-next-line no-await-in-loop
        await warmOne(path);
      }
    };

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await navigator.serviceWorker.ready;
        if (!cancelled && navigator.onLine) {
          void warmCoreRoutes();
        }
      } catch {
        // If registration fails, browser behaves as normal web app.
      }
    };

    void register();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

