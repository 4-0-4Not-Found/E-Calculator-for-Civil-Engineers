"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CommandPaletteHost } from "@/components/command/CommandPalette";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { AUTOSAVE_MODULE_KEYS, CLIENT_PERSISTENCE, type AutosaveModuleKey } from "@/lib/client-persistence";
import { STORAGE } from "@/lib/storage/keys";

type NavItem = { href: string; label: string; short?: string };

const modules: NavItem[] = [
  { href: "/tension", label: "Tension" },
  { href: "/compression", label: "Compression" },
  { href: "/bending-shear", label: "Beam", short: "Beam" },
  { href: "/connections", label: "Connections", short: "Conn." },
];

const utility: NavItem[] = [
  { href: "/report", label: "Report", short: "Report" },
  { href: "/info", label: "Info", short: "Info" },
];

type LastSaved = { label: string; ts: number } | null;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function readLastSaved(): LastSaved {
  try {
    const pairs: Array<{ key: AutosaveModuleKey; label: string }> = [
      { key: "tension", label: "Tension" },
      { key: "compression", label: "Compression" },
      { key: "bending", label: "Beam" },
      { key: "connections", label: "Connections" },
    ];
    let best: LastSaved = null;
    for (const p of pairs) {
      const raw = localStorage.getItem(CLIENT_PERSISTENCE.savedAt(p.key));
      const ts = raw ? Number(raw) : NaN;
      if (!Number.isFinite(ts)) continue;
      if (!best || ts > best.ts) best = { label: p.label, ts };
    }
    return best;
  } catch {
    return null;
  }
}

function formatRelative(ts: number) {
  const diff = Date.now() - ts;
  if (!Number.isFinite(diff)) return null;
  if (diff < 15_000) return "just now";
  const min = Math.floor(diff / 60_000);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

export function AppHeader() {
  const pathname = usePathname() ?? "/";
  const [tick, setTick] = useState(0);
  const [clearOpen, setClearOpen] = useState(false);
  const toast = useToast();
  const isDev = process.env.NODE_ENV === "development";
  const [mounted, setMounted] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    const onFocus = () => setTick((t) => t + 1);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  // #region agent log (header height -> sticky offsets)
  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    if (!isDev) return;

    const apply = (hypothesisId: string, message: string) => {
      const r = el.getBoundingClientRect();
      const h = Math.max(0, Math.round(r.height));
      document.documentElement.style.setProperty("--app-header-h", `${h}px`);
      fetch("/api/debug-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "291aab",
          runId: "pre-fix",
          hypothesisId,
          location: "AppHeader.tsx:useLayoutEffect(headerHeight)",
          message,
          data: {
            pathname,
            headerPx: h,
            cssVar: getComputedStyle(document.documentElement).getPropertyValue("--app-header-h").trim() || null,
            scrollY: typeof window !== "undefined" ? window.scrollY : null,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    };

    apply("H1", "Initial header height measured");

    const ro = new ResizeObserver(() => apply("H2", "Header height changed (ResizeObserver)"));
    ro.observe(el);
    return () => ro.disconnect();
  }, [pathname, isDev]);
  // #endregion agent log (header height -> sticky offsets)

  // (dev-only hydration logging removed)

  const lastSaved = useMemo(() => {
    // tick + pathname intentionally trigger refresh of localStorage-derived UI
    void tick;
    void pathname;
    return mounted ? readLastSaved() : null;
  }, [mounted, tick, pathname]);
  const lastSavedLabel = lastSaved ? `${lastSaved.label} · ${formatRelative(lastSaved.ts) ?? "saved"}` : null;

  const projectStatus = useMemo(() => {
    void tick;
    void pathname;
    if (!mounted) return { items: [], completed: 0, total: 4 };
    try {
      const keys: Array<{ k: AutosaveModuleKey; label: string; href: string }> = [
        { k: "tension", label: "Tension", href: "/tension" },
        { k: "compression", label: "Compression", href: "/compression" },
        { k: "bending", label: "Beam", href: "/bending-shear" },
        { k: "connections", label: "Connections", href: "/connections" },
      ];
      const items = keys.map((x) => {
        const raw = localStorage.getItem(CLIENT_PERSISTENCE.savedAt(x.k));
        const ts = raw ? Number(raw) : NaN;
        return { ...x, ts: Number.isFinite(ts) ? ts : null };
      });
      const completed = items.filter((i) => i.ts != null).length;
      return { items, completed, total: items.length };
    } catch {
      return { items: [], completed: 0, total: 4 };
    }
  }, [tick, pathname, mounted]);

  // Remember last visited route for a fast "Continue" on Home.
  // UI-only preference, no calculation logic.
  useEffect(() => {
    try {
      localStorage.setItem(CLIENT_PERSISTENCE.lastRoute, pathname);
    } catch {
      /* ignore */
    }
  }, [pathname]);

  // (dev-only debug logging removed for production safety)

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 h-16 border-b border-[color:var(--accent-weak)] bg-[color:var(--glass-bg)] backdrop-blur-md"
    >
      <CommandPaletteHost />
      <ConfirmDialog
        open={clearOpen}
        contextLabel="This device"
        title="Clear all saved inputs?"
        description={<p>This clears saved fields for all modules in this browser and cannot be undone.</p>}
        confirmLabel="Clear"
        cancelLabel="Cancel"
        onCancel={() => setClearOpen(false)}
        onConfirm={() => {
          setClearOpen(false);
          try {
            Object.values(STORAGE).forEach((k) => localStorage.removeItem(k));
            for (const k of AUTOSAVE_MODULE_KEYS) localStorage.removeItem(CLIENT_PERSISTENCE.savedAt(k));
            localStorage.removeItem(CLIENT_PERSISTENCE.lastRoute);
          } catch {
            /* ignore */
          }
          toast.push({ title: "Cleared", message: "Saved inputs removed for this browser.", tone: "info" });
          setTick((t) => t + 1);
        }}
      />
      {/* Desktop: slim header */}
      <div className="mx-auto hidden h-16 w-full max-w-6xl items-center justify-between gap-x-6 px-4 md:flex md:px-8">
        {/* Left: primary navigation */}
        <nav className="flex items-center gap-x-2">
          <NavPill href="/" label="Home" active={isActive(pathname, "/")} />
          {modules.map((item) => (
            <NavPill
              key={item.href}
              href={item.href}
              label={item.label}
              short={item.short}
              active={isActive(pathname, item.href)}
            />
          ))}
        </nav>

        {/* Right: utilities */}
        <div className="flex shrink-0 items-center gap-x-3">
          {utility.map((item) => (
            <NavPill
              key={item.href}
              href={item.href}
              label={item.label}
              short={item.short}
              active={isActive(pathname, item.href)}
            />
          ))}
        </div>
      </div>

      {/* Mobile header: slim */}
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 md:hidden">
        <div className="flex items-center gap-x-2">
          <details className="relative">
            <summary className="list-none rounded-full border border-[#2d4a3e]/15 bg-[#f0f9f4] px-4 py-2 text-sm font-semibold text-[#2d4a3e] shadow-sm hover:bg-[#e7f4ee] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2d4a3e]/10 [&::-webkit-details-marker]:hidden">
              Menu
            </summary>
            <div className="absolute left-0 mt-2 w-56 overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[var(--shadow)] ring-1 ring-slate-950/5">
              <div className="border-b border-[color:var(--border)]/35 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Navigate
              </div>
              <div className="p-2">
                {[{ href: "/", label: "Home" }, ...modules, ...utility].map((i) => (
                  <Link
                    key={i.href}
                    href={i.href}
                    className="block rounded-xl px-3 py-2 text-sm font-semibold text-[color:var(--foreground)] hover:bg-[color:var(--surface-3)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--accent)]/10"
                    onClick={(e) => {
                      const d = (e.currentTarget.closest("details") ?? null) as HTMLDetailsElement | null;
                      if (d) d.open = false;
                    }}
                  >
                    {i.label}
                  </Link>
                ))}
              </div>
            </div>
          </details>
        </div>

        <div />
      </div>
    </header>
  );
}

function NavPill(props: { href: string; label: string; short?: string; active: boolean }) {
  const label = props.short ?? props.label;
  return (
    <Link
      href={props.href}
      aria-current={props.active ? "page" : undefined}
      className={[
        "inline-flex min-h-10 shrink-0 items-center rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--accent)]/10",
        props.active
          ? "bg-[color:var(--accent)] text-white shadow-sm"
          : "border border-[color:var(--accent-weak)] bg-[color:var(--mint)] text-[color:var(--accent)] hover:bg-[color:var(--mint-2)]",
      ].join(" ")}
      title={props.label}
    >
      {label}
    </Link>
  );
}

