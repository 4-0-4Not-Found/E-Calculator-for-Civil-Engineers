"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { InstallAppButton } from "@/components/InstallAppButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { BrandLink } from "@/components/ui/BrandLink";
import { PRODUCT_BRAND } from "@/lib/brand";
import { AUTOSAVE_MODULE_KEYS, CLIENT_PERSISTENCE, type AutosaveModuleKey } from "@/lib/client-persistence";
import { STORAGE } from "@/lib/storage/keys";

type ModuleKey = keyof typeof STORAGE;

const modules: Array<{
  key: ModuleKey;
  label: string;
  href: string;
  summary: string;
  bullets: string[];
}> = [
  {
    key: "tension",
    label: "Tension",
    href: "/tension",
    summary: "Yielding, rupture, block shear; optional stagger helper.",
    bullets: ["Quick SAFE / NOT SAFE", "Exports + step table"],
  },
  {
    key: "compression",
    label: "Compression",
    href: "/compression",
    summary: "Member buckling (E3), LRFD/ASD; KL/r focus.",
    bullets: ["K + length inputs", "Section snapshot"],
  },
  {
    key: "bending",
    label: "Beam",
    href: "/bending-shear",
    summary: "Flexure, shear, deflection; W + HSS check modes.",
    bullets: ["Load-to-M/V helper", "Utilization by limit state"],
  },
  {
    key: "shear",
    label: "Shear",
    href: "/shear",
    summary: "Web shear capacity from PROGRAM-2 Shear (ANALYSIS).",
    bullets: ["Cv case detection", "Method-aware capacity"],
  },
  {
    key: "combined",
    label: "Combined",
    href: "/combined",
    summary: "Integrated bending + shear + deflection design workflow.",
    bullets: ["Workbook load combos", "Lightest SAFE shape hint"],
  },
  {
    key: "connections",
    label: "Connections",
    href: "/connections",
    summary: "Bolts, slip-critical, tension, interaction, welds.",
    bullets: ["Overall summary", "Design hints (n, weld size)"],
  },
];

const moduleDiagramSrc: Record<string, string> = {
  Tension: "/assets/tension.png",
  Compression: "/assets/compression.png",
  Bending: "/assets/bending.png",
  Connections: "/assets/connections.png",
  Shear: "/assets/shear.png",
  Combined: "/assets/combined.png",
};

function tsKey(m: ModuleKey) {
  return CLIENT_PERSISTENCE.savedAt(m as AutosaveModuleKey);
}

function formatSaved(ts: number | null) {
  if (!ts) return null;
  try {
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch {
    return null;
  }
}

function readJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readFavorites(): string[] {
  try {
    const raw = localStorage.getItem(CLIENT_PERSISTENCE.favorites);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeFavorites(favs: string[]) {
  try {
    localStorage.setItem(CLIENT_PERSISTENCE.favorites, JSON.stringify(favs));
  } catch {
    /* ignore */
  }
}

function readHomeOrder(): string[] | null {
  try {
    const raw = localStorage.getItem(CLIENT_PERSISTENCE.homeModuleOrder);
    const arr = raw ? (JSON.parse(raw) as unknown) : null;
    if (!Array.isArray(arr)) return null;
    const out = arr.filter((x) => typeof x === "string") as string[];
    return out.length ? out : null;
  } catch {
    return null;
  }
}

function writeHomeOrder(order: string[]) {
  try {
    localStorage.setItem(CLIENT_PERSISTENCE.homeModuleOrder, JSON.stringify(order));
  } catch {
    /* ignore */
  }
}

function emptyModuleState(): Record<ModuleKey, { hasData: boolean; savedTs: number | null }> {
  return {
    tension: { hasData: false, savedTs: null },
    compression: { hasData: false, savedTs: null },
    bending: { hasData: false, savedTs: null },
    shear: { hasData: false, savedTs: null },
    combined: { hasData: false, savedTs: null },
    connections: { hasData: false, savedTs: null },
  };
}

function previewLineFor(key: ModuleKey): string | null {
  try {
    const raw = localStorage.getItem(STORAGE[key]);
    const p = readJson<Record<string, unknown>>(raw);
    if (!p) return null;
    if (key === "tension") {
      const shape = typeof p.shapeName === "string" ? p.shapeName : null;
      const Pu = typeof p.Pu === "string" ? p.Pu : null;
      return shape && Pu ? `${shape} · Pu ${Pu} kips` : shape ? String(shape) : null;
    }
    if (key === "compression") {
      const shape = typeof p.shapeName === "string" ? p.shapeName : null;
      const Pu = typeof p.Pu === "string" ? p.Pu : null;
      const L = typeof p.L === "string" ? p.L : null;
      return shape && Pu && L ? `${shape} · Pu ${Pu} kips · L ${L} in` : shape ? String(shape) : null;
    }
    if (key === "bending") {
      const shape = typeof p.shapeName === "string" ? p.shapeName : null;
      const Mu = typeof p.Mu === "string" ? p.Mu : null;
      const Vu = typeof p.Vu === "string" ? p.Vu : null;
      return shape && Mu && Vu ? `${shape} · Mu ${Mu} · Vu ${Vu}` : shape ? String(shape) : null;
    }
    if (key === "connections") {
      const vu = typeof p.vu === "string" ? p.vu : null;
      const tu = typeof p.tu === "string" ? p.tu : null;
      const n = typeof p.nBolts === "string" ? p.nBolts : null;
      const d = typeof p.dBolt === "string" ? p.dBolt : null;
      return vu && n && d ? `Vu ${vu} · Tu ${tu ?? "0"} · n=${n} d=${d} in` : vu ? `Vu ${vu}` : null;
    }
    if (key === "shear") {
      const shape = typeof p.shapeName === "string" ? p.shapeName : null;
      const vu = typeof p.demandV === "string" ? p.demandV : null;
      return shape && vu ? `${shape} · Vu ${vu} kips` : shape ? shape : null;
    }
    if (key === "combined") {
      const shape = typeof p.shapeName === "string" ? p.shapeName : null;
      const span = typeof p.spanFt === "string" ? p.spanFt : null;
      const dl = typeof p.deadLoadKft === "string" ? p.deadLoadKft : null;
      const ll = typeof p.liveLoadKft === "string" ? p.liveLoadKft : null;
      return shape && span ? `${shape} · L ${span} ft · D/L ${dl ?? "0"}/${ll ?? "0"}` : shape ? shape : null;
    }
    return null;
  } catch {
    return null;
  }
}

function StatusBadge(props: { tone: "empty" | "complete" | "placeholder"; label: string }) {
  const dot =
    props.tone === "complete"
      ? "bg-emerald-500"
      : props.tone === "placeholder"
        ? "bg-slate-300"
        : "bg-slate-400";
  const ring =
    props.tone === "complete"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : props.tone === "placeholder"
        ? "border-slate-200 bg-[color:var(--surface)] text-slate-600"
        : "border-slate-200 bg-[color:var(--surface)] text-slate-700";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-semibold ${ring}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden="true" />
      {props.label}
    </span>
  );
}

function ModuleIcon(props: { src: string | null }) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setLoaded(false);
  }, [props.src]);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    // If the image is already in cache, onLoad may not fire in time for our fade-in.
    if (el.complete && el.naturalWidth > 0) setLoaded(true);
  }, [props.src]);

  return (
    <div
      className="relative flex h-28 w-full items-center justify-center overflow-hidden rounded-xl border border-white/80 bg-white p-4 shadow-sm"
      aria-hidden="true"
    >
      {!loaded ? <div className="pointer-events-none absolute inset-0 skeleton" aria-hidden="true" /> : null}
      {props.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={props.src}
          alt=""
          className="relative z-[1] h-full w-auto max-w-full object-contain"
          draggable={false}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
          decoding="async"
        />
      ) : (
        <span className="relative z-[1] text-xs font-semibold text-[color:var(--muted)]">—</span>
      )}
    </div>
  );
}

export function HomeDashboard() {
  const [tick, setTick] = useState(0);
  /** false until after mount — SSR and first client paint must not read localStorage (differs from server HTML). */
  const [mounted, setMounted] = useState(false);
  /** null until mounted — avoids SSR vs client mismatch on navigator.onLine */
  const [networkOnline, setNetworkOnline] = useState<boolean | null>(null);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [moduleQuery, setModuleQuery] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Home-only: preload module diagrams for faster first paint.
  useEffect(() => {
    const hrefs = [
      "/assets/tension.png",
      "/assets/compression.png",
      "/assets/bending.png",
      "/assets/shear.png",
      "/assets/combined.png",
      "/assets/connections.png",
    ];
    const links: HTMLLinkElement[] = [];
    for (const href of hrefs) {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = href;
      document.head.appendChild(link);
      links.push(link);
    }
    return () => {
      for (const l of links) l.remove();
    };
  }, []);

  useEffect(() => {
    const key = "spanledger/v1/home/module-search";
    const evt = "spanledger:v1:home:module-search";
    try {
      setModuleQuery(localStorage.getItem(key) ?? "");
    } catch {
      /* ignore */
    }
    const onEvt = (e: Event) => {
      const ce = e as CustomEvent<{ q?: string }>;
      const q = typeof ce.detail?.q === "string" ? ce.detail.q : "";
      setModuleQuery(q);
    };
    window.addEventListener(evt, onEvt as EventListener);
    return () => window.removeEventListener(evt, onEvt as EventListener);
  }, []);

  useEffect(() => {
    function isTypingTarget(t: EventTarget | null) {
      if (!(t instanceof HTMLElement)) return false;
      const tag = t.tagName.toLowerCase();
      return tag === "input" || tag === "textarea" || tag === "select" || t.isContentEditable;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (isTypingTarget(e.target)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "m") {
        const el = document.getElementById("modules");
        if (el) {
          e.preventDefault();
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
      if (k === "p") {
        const el = document.getElementById("home-personalize") as HTMLDetailsElement | null;
        if (el) {
          e.preventDefault();
          el.open = !el.open;
        }
      }
      if (k === "1") window.location.assign("/tension");
      if (k === "2") window.location.assign("/compression");
      if (k === "3") window.location.assign("/bending-shear");
      if (k === "4") window.location.assign("/connections");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const onFocus = () => setTick((v) => v + 1);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    const sync = () => setNetworkOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  const resumeHref = useMemo(() => {
    if (!mounted) return null;
    void tick;
    try {
      const last = localStorage.getItem(CLIENT_PERSISTENCE.lastRoute);
      if (!last || last === "/") return null;
      return last;
    } catch {
      return null;
    }
  }, [tick, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      const hasAny = Object.values(STORAGE).some((k) => Boolean(localStorage.getItem(k)));
      const last = localStorage.getItem(CLIENT_PERSISTENCE.lastRoute);
      if (hasAny && last && last !== "/") setRestoreOpen(true);
    } catch {
      /* ignore */
    }
  }, [mounted]);

  const moduleState = useMemo(() => {
    if (!mounted) return emptyModuleState();
    void tick;
    const out: Record<string, { hasData: boolean; savedTs: number | null }> = {};
    for (const m of modules) {
      const k = STORAGE[m.key];
      const hasData = Boolean(localStorage.getItem(k));
      const rawTs = localStorage.getItem(tsKey(m.key));
      const ts = rawTs ? Number(rawTs) : null;
      out[m.key] = { hasData, savedTs: Number.isFinite(ts ?? NaN) ? ts : null };
    }
    return out;
  }, [tick, mounted]);

  const favorites = useMemo(() => {
    if (!mounted) return [];
    void tick;
    return readFavorites();
  }, [tick, mounted]);

  const orderedModules = useMemo(() => {
    if (!mounted) return modules;
    void tick;
    const order = readHomeOrder();
    if (!order) return modules;
    const byHref = new Map(modules.map((m) => [m.href, m] as const));
    const kept: typeof modules = [];
    for (const href of order) {
      const m = byHref.get(href);
      if (m) kept.push(m);
    }
    // Append any new modules not in storage order.
    for (const m of modules) if (!kept.some((x) => x.href === m.href)) kept.push(m);
    return kept;
  }, [tick, mounted]);

  const modulesWithPreview = useMemo(() => {
    if (!mounted) {
      return modules.map((m) => ({ ...m, preview: null as string | null, isFav: false }));
    }
    return orderedModules.map((m) => ({
      ...m,
      preview: previewLineFor(m.key),
      isFav: favorites.includes(m.href),
    }));
  }, [orderedModules, favorites, mounted]);

  const recent = useMemo(() => {
    if (!mounted) return [];
    void tick;
    return modulesWithPreview
      .map((m) => ({ m, s: moduleState[m.key] }))
      .filter((x) => x.s?.hasData)
      .sort((a, b) => (b.s?.savedTs ?? 0) - (a.s?.savedTs ?? 0))
      .slice(0, 4);
  }, [moduleState, modulesWithPreview, mounted, tick]);

  return (
    <div className="space-y-10 md:space-y-12">
      <ConfirmDialog
        open={restoreOpen}
        contextLabel="This device"
        title="Restore your previous session?"
        description={
          <p>
            We found saved inputs from a previous session on this device. You can continue where you left off or start fresh.
          </p>
        }
        confirmLabel="Continue"
        cancelLabel="Start fresh"
        onCancel={() => {
          setRestoreOpen(false);
          try {
            Object.values(STORAGE).forEach((k) => localStorage.removeItem(k));
            AUTOSAVE_MODULE_KEYS.forEach((m) => localStorage.removeItem(CLIENT_PERSISTENCE.savedAt(m)));
            localStorage.removeItem(CLIENT_PERSISTENCE.lastRoute);
          } catch {
            /* ignore */
          }
          setTick((v) => v + 1);
        }}
        onConfirm={() => {
          setRestoreOpen(false);
          if (resumeHref) window.location.assign(resumeHref);
        }}
      />

      {resumeHref ? (
        <section className="rounded-2xl border border-[color:var(--accent-weak)] bg-[color:var(--mint)] px-5 py-4 shadow-[var(--shadow-sm)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#2d4a3e]">Continue where you left off</p>
              <p className="mt-1 text-xs text-[#2d4a3e]/70">
                Tip: press <span className="rounded-full border border-[#2d4a3e]/20 bg-white/70 px-2 py-0.5 font-mono font-semibold">R</span> anytime on this page.
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => window.location.assign(resumeHref)}
              className="min-h-10 px-5 py-2 text-xs font-extrabold uppercase tracking-wide"
            >
              Continue
            </Button>
          </div>
        </section>
      ) : null}

      {/* Hero (split layout: text left, in-app owl mark right — install icon is separate in manifest) */}
      <section className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--zone-hero)] px-6 py-10 shadow-[var(--shadow-sm)] sm:px-10 sm:py-14 md:px-16 md:py-16">
        <div className="flex flex-col items-start justify-between gap-10 md:flex-row md:items-center">
          <div className="max-w-xl">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--foreground)]">
              steel-ingo
            </p>
            <p className="mt-2 text-xs text-[color:var(--muted)]">
              An AISC-based Steel Analysis
              <br />
              and Design Calculator
            </p>

            <h1 className="mt-8 text-[40px] font-extrabold leading-[0.95] tracking-tight text-[color:var(--foreground)] sm:text-[56px]">
              <span className="bg-gradient-to-r from-[color:var(--heading-grad-from)] to-[color:var(--heading-grad-to)] bg-clip-text text-transparent">
                Compute Smarter.
                <br />
                Build Better.
              </span>
              <br />
              Engineer the Future.
            </h1>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-start">
              <a href="#modules">
                <Button
                  variant="primary"
                  size="sm"
                  className="min-h-10 px-5 py-2 text-xs font-extrabold uppercase tracking-wide"
                >
                  START CALCULATING
                </Button>
              </a>
              <InstallAppButton />
            </div>
          </div>

          <div className="w-full md:w-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/publicbrandowl-logo.png"
              alt=""
              className="mx-auto h-52 w-52 rounded-sm bg-[#2f4f46] p-3 object-contain sm:h-60 sm:w-60 md:h-64 md:w-64"
              draggable={false}
            />
          </div>
        </div>
      </section>

      {recent.length > 0 ? (
        <section className="rounded-2xl bg-[color:var(--mint)] p-6 shadow-[var(--shadow-sm)] md:p-8">
          <div className="flex items-end justify-between gap-4">
            <p className="text-2xl font-extrabold tracking-tight text-[color:var(--accent)]">Recent work</p>
            <BrandLink href="/report" className="text-sm font-semibold text-[color:var(--accent)]">
              Open report
            </BrandLink>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {recent.map(({ m, s }) => (
              <a
                key={m.key}
                href={m.href}
                className={[
                  "no-underline rounded-2xl bg-white/70 p-6 shadow-sm transition",
                  "hover:bg-white hover:shadow-[var(--shadow)] hover:-translate-y-0.5",
                  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--accent)]/10",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-[color:var(--accent)]">{m.label}</p>
                    <p className="mt-2 text-sm text-[color:var(--muted)]">{m.summary}</p>
                    {m.preview ? <p className="mt-4 text-xs font-semibold text-[color:var(--muted)]">{m.preview}</p> : null}
                    {s?.savedTs ? (
                      <p className="mt-3 text-xs font-semibold text-[color:var(--muted)]">
                        Last saved: {formatSaved(s.savedTs) ?? "—"}
                      </p>
                    ) : null}
                  </div>
                  <Badge tone="good">READY</Badge>
                </div>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <section id="modules" className="scroll-mt-28 space-y-8 md:scroll-mt-32">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight text-[color:var(--accent)]">What to Calculate?</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="#modules"
              className="rounded-full border border-[#2d4a3e]/15 bg-[#f0f9f4] px-4 py-2 text-sm font-semibold text-[#2d4a3e] shadow-sm hover:bg-[#e7f4ee] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2d4a3e]/10"
            >
              All modules
            </a>
            <a
              href="#content"
              className="rounded-full border border-[#2d4a3e]/15 bg-white/70 px-4 py-2 text-sm font-semibold text-[#2d4a3e] shadow-sm hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2d4a3e]/10"
            >
              Back to top
            </a>
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {(() => {
            const all = [
              { label: "Tension", href: "/tension" },
              { label: "Compression", href: "/compression" },
              { label: "Bending", href: "/bending-shear" },
              { label: "Shear", href: "/shear" },
              { label: "Combined", href: "/combined" },
              { label: "Connections", href: "/connections" },
            ] as const;
            const q = moduleQuery.trim().toLowerCase();
            const list = q.length ? all.filter((m) => m.label.toLowerCase().includes(q)) : all;
            if (list.length === 0) {
              return (
                <div className="col-span-full rounded-2xl bg-[color:var(--mint)] p-8 text-center text-sm font-semibold text-[color:var(--accent)]/70">
                  No modules found
                </div>
              );
            }
            const moduleNumber: Record<string, string> = {
              Tension: "1",
              Compression: "2",
              Bending: "3",
              Shear: "4",
              Combined: "5",
              Connections: "6",
            };
            return list.map((m) => {
            const diagramSrc = moduleDiagramSrc[m.label] ?? null;
            const shortcut = moduleNumber[m.label] ?? "";
            return (
              <a
                key={m.label}
                href={m.href}
                className={[
                  "group relative flex min-h-[320px] flex-col justify-between rounded-2xl bg-[color:var(--mint)] p-8 no-underline shadow-[var(--shadow-sm)] transition",
                  "hover:bg-[color:var(--mint-2)] hover:shadow-[var(--shadow)] hover:-translate-y-0.5 hover:ring-1 hover:ring-[color:var(--accent-weak)]",
                  "active:translate-y-0 active:shadow-[var(--shadow-sm)]",
                  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--accent)]/10",
                ].join(" ")}
              >
                <div className="space-y-8">
                  <div className="relative mx-auto w-full max-w-[260px]">
                    <ModuleIcon src={diagramSrc} />
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <p className="text-2xl font-semibold text-[color:var(--accent)]">{m.label}</p>
                    {shortcut ? (
                      <span className="rounded-full border border-[color:var(--accent-weak)] bg-white/70 px-2 py-0.5 font-mono text-xs font-semibold text-[color:var(--accent)]">
                        {shortcut}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-end justify-end">
                  <span className="text-sm font-medium italic text-[color:var(--accent)]">
                    Open module →
                  </span>
                </div>
              </a>
            );
            });
          })()}
        </div>
      </section>
    </div>
  );
}

