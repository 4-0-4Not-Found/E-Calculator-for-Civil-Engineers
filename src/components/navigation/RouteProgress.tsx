"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/** Thin top bar on navigation — presentation only. */
export function RouteProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    queueMicrotask(() => setActive(true));
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => setActive(false), 320);
    return () => {
      if (t.current) clearTimeout(t.current);
    };
  }, [pathname]);

  return (
    <div className="pointer-events-none fixed left-0 top-0 z-[60] h-[3px] w-full bg-slate-200/40 dark:bg-slate-700/50" aria-hidden="true">
      <div
        className={["h-full bg-[#FF5F1F] transition-[width] duration-300 ease-out", active ? "w-full" : "w-0"].join(" ")}
      />
    </div>
  );
}
