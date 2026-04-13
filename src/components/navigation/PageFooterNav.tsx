import Link from "next/link";

type Item = { href: string; label: string };

const order: Item[] = [
  { href: "/", label: "Home" },
  { href: "/tension", label: "Tension" },
  { href: "/compression", label: "Compression" },
  { href: "/bending-shear", label: "Beam" },
  { href: "/connections", label: "Connections" },
  { href: "/report", label: "Report" },
  { href: "/info", label: "Info" },
];

export function PageFooterNav(props: { currentHref: string }) {
  const idx = order.findIndex((i) => i.href === props.currentHref);
  const prev = idx > 0 ? order[idx - 1] : null;
  const next = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;

  if (!prev && !next) return null;

  return (
    <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-6">
      {prev ? (
        <Link
          href={prev.href}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:border-slate-300 hover:bg-slate-50"
        >
          ← {prev.label}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={next.href}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:border-slate-300 hover:bg-slate-50"
        >
          {next.label} →
        </Link>
      ) : null}
    </footer>
  );
}

