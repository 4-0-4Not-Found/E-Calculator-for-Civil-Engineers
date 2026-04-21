import { CLIENT_PERSISTENCE } from "@/lib/client-persistence";

const STORAGE_KEY = CLIENT_PERSISTENCE.recentRoutes;
const MAX = 5;

/** Remember last few distinct routes for command palette (client-only). */
export function recordRecentRoute(href: string) {
  if (!href || href === "/") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const prev = raw ? (JSON.parse(raw) as unknown) : [];
    const list = Array.isArray(prev) ? prev.filter((x): x is string => typeof x === "string") : [];
    const next = [href, ...list.filter((h) => h !== href)].slice(0, MAX);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function readRecentRoutes(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}
