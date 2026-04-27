import Link from "next/link";

type Item = { href: string; label: string };

const order: Item[] = [
  { href: "/", label: "Home" },
  { href: "/tension", label: "Tension" },
  { href: "/compression", label: "Compression" },
  { href: "/bending-shear", label: "Beam" },
  { href: "/shear", label: "Shear" },
  { href: "/combined", label: "Combined" },
  { href: "/connections", label: "Connections" },
  { href: "/report", label: "Report" },
  { href: "/info", label: "Info" },
];

const navClassName =
  "rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-[color:var(--surface-3)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--brand)]/10";

export function PageFooterNav(props: { currentHref: string }) {
  const idx = order.findIndex((i) => i.href === props.currentHref);
  const prev = idx > 0 ? order[idx - 1] : null;
  const next = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;

  const unknown = idx < 0;

  return (
    <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--border)]/35 pt-7">
      {unknown ? (
        <Link href="/" className={navClassName}>
          ← Home
        </Link>
      ) : prev ? (
        <Link href={prev.href} className={navClassName}>
          ← {prev.label}
        </Link>
      ) : (
        <span />
      )}
      {unknown ? (
        <Link href="/info" className={navClassName}>
          Info →
        </Link>
      ) : next ? (
        <Link href={next.href} className={navClassName}>
          {next.label} →
        </Link>
      ) : null}
    </footer>
  );
}
