"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";
import { CommandPaletteHost } from "@/components/command/CommandPalette";
import { CLIENT_PERSISTENCE } from "@/lib/client-persistence";

type NavItem = { href: string; label: string; short?: string };

const modules: NavItem[] = [
  { href: "/tension", label: "Tension" },
  { href: "/compression", label: "Compression" },
  { href: "/bending-shear", label: "Bending", short: "Bending" },
  { href: "/shear", label: "Shear", short: "Shear" },
];

const utility: NavItem[] = [
  { href: "/report", label: "Report", short: "Report" },
  { href: "/info", label: "Info", short: "Info" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppHeader() {
  const pathname = usePathname() ?? "/";
  const headerRef = useRef<HTMLElement | null>(null);

  // Expose header height as a CSS custom property so sticky offsets stay in sync.
  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const apply = () => {
      const r = el.getBoundingClientRect();
      const h = Math.max(0, Math.round(r.height));
      document.documentElement.style.setProperty("--app-header-h", `${h}px`);
    };

    apply();
    const ro = new ResizeObserver(() => apply());
    ro.observe(el);
    return () => ro.disconnect();
  }, [pathname]);

  // Remember last visited route for a fast "Continue" on Home.
  // UI-only preference, no calculation logic.
  useEffect(() => {
    try {
      localStorage.setItem(CLIENT_PERSISTENCE.lastRoute, pathname);
    } catch {
      /* ignore */
    }
  }, [pathname]);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 h-16 border-b border-[color:var(--accent-weak)] bg-[color:var(--glass-bg)] backdrop-blur-md"
    >
      <CommandPaletteHost />
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
