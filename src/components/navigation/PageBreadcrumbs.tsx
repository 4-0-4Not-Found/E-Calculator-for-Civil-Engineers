"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";
import { BREADCRUMB_LABELS } from "@/lib/ui/strings";
import { BrandLink } from "@/components/ui/BrandLink";

export function PageBreadcrumbs() {
  const pathname = usePathname() ?? "/";
  const navRef = useRef<HTMLElement | null>(null);

  // Expose breadcrumbs height for fixed/sticky layouts (sidebar, rails, etc).
  useLayoutEffect(() => {
    const el = navRef.current;
    if (!el) return;

    const apply = () => {
      const h = Math.max(0, Math.round(el.getBoundingClientRect().height));
      document.documentElement.style.setProperty("--app-crumbs-h", `${h}px`);
    };

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pathname]);

  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { href: string; label: string }[] = [{ href: "/", label: "Home" }];
  let acc = "";
  for (const seg of segments) {
    acc += `/${seg}`;
    const label = BREADCRUMB_LABELS[acc] ?? seg.replace(/-/g, " ");
    crumbs.push({ href: acc, label });
  }

  return (
    <nav
      ref={navRef}
      aria-label="Breadcrumb"
      className="border-b border-[color:var(--accent-weak)] bg-[color:var(--glass-bg)] px-2 pb-2 pt-1.5 backdrop-blur-md"
    >
      <ol className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-2 text-xs font-semibold text-[color:var(--accent)]/70 md:px-6">
        <li className="flex items-center gap-1">
          <span className="text-[color:var(--accent)]/70">Dashboard</span>
          <span className="text-[color:var(--accent)]/50" aria-hidden="true">
            /
          </span>
        </li>
        {crumbs.map((c, i) => (
          <li key={c.href} className="flex items-center gap-1">
            {i === crumbs.length - 1 ? (
              <span className="text-[color:var(--accent)]">{c.label}</span>
            ) : (
              <BrandLink href={c.href} className="text-[color:var(--accent)]/70 hover:text-[color:var(--accent)]">
                {c.label}
              </BrandLink>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
