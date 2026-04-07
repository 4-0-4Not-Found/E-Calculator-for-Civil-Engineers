import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 p-6 md:p-10">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
          AISC 16th Edition Structural Engineering PWA
        </h1>
        <p className="mt-2 text-slate-600">
          Select an independent module. Each module has dedicated step-by-step computation flow.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <Link href="/tension" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-400">
          <h2 className="text-xl font-semibold text-slate-900">Tension Analysis & Design</h2>
          <p className="mt-2 text-slate-600">Fully working first module with yielding, fracture, block shear, and governing strength.</p>
        </Link>
        <Link href="/compression" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-400">
          <h2 className="text-xl font-semibold text-slate-900">Compression Analysis & Design</h2>
          <p className="mt-2 text-slate-600">Flexural buckling (AISC E3), KL/r, and step-by-step stress/capacity checks.</p>
        </Link>
        <Link href="/bending-shear" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-400">
          <h2 className="text-xl font-semibold text-slate-900">Bending & Shear</h2>
          <p className="mt-2 text-slate-600">Scaffold for beam analysis/design with bending, shear cases, and deflection checks.</p>
        </Link>
        <Link href="/connections" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-400">
          <h2 className="text-xl font-semibold text-slate-900">Bolted & Welded Connections</h2>
          <p className="mt-2 text-slate-600">Structured module shell for bolt/weld design workflows.</p>
        </Link>
      </section>
    </main>
  );
}
