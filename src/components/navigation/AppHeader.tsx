"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CommandPaletteButton, CommandPaletteHost } from "@/components/command/CommandPalette";

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

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppHeader() {
  const pathname = usePathname() ?? "/";

  // Remember last visited route for a fast "Continue" on Home.
  // UI-only preference, no calculation logic.
  try {
    if (typeof window !== "undefined") localStorage.setItem("ssc:lastRoute", pathname);
  } catch {
    /* ignore */
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <CommandPaletteHost />
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 md:px-8">
        <div className="min-w-0">
          <Link
            href="/"
            className="block truncate text-sm font-extrabold tracking-tight text-slate-950 hover:text-[#0818A8]"
            aria-label="Structural Steel Calculators — Home"
          >
            Structural Steel Calculators
          </Link>
          <p className="hidden truncate text-xs font-medium text-slate-600 sm:block">
            Fast AISC-based checks for civil engineering students
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:block">
            <CommandPaletteButton />
          </div>
          <Link
            href="/report"
            className="hidden rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm hover:border-slate-300 hover:bg-slate-50 md:inline-flex"
          >
            Report
          </Link>
          <Link
            href="/info"
            className="hidden rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm hover:border-slate-300 hover:bg-slate-50 md:inline-flex"
          >
            Info
          </Link>
        </div>
      </div>

      <nav className="border-t border-slate-100 bg-white">
        <div className="mx-auto w-full max-w-6xl px-2 md:px-6">
          <div className="flex items-center gap-1 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <NavPill href="/" label="Home" active={isActive(pathname, "/")} />
            <div className="mx-1 h-5 w-px bg-slate-200" aria-hidden="true" />
            {modules.map((item) => (
              <NavPill
                key={item.href}
                href={item.href}
                label={item.label}
                short={item.short}
                active={isActive(pathname, item.href)}
              />
            ))}
            <div className="mx-1 h-5 w-px bg-slate-200 md:hidden" aria-hidden="true" />
            <div className="flex items-center gap-1 md:hidden">
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
        </div>
      </nav>
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
        "inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-sm font-semibold transition",
        props.active
          ? "bg-[#0818A8] text-white"
          : "border border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50",
      ].join(" ")}
      title={props.label}
    >
      {label}
    </Link>
  );
}

