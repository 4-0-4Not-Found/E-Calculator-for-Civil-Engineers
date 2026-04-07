import Link from "next/link";

export default function ConnectionsPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 p-6 md:p-10">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Bolted & Welded Connections</h1>
          <Link href="/" className="text-sm font-medium text-blue-700 hover:underline">Back to modules</Link>
        </div>
        <p className="mt-2 text-slate-600">Module shell created with design-first intent. Bolt shear/bearing/tear-out and weld checks will be added after core modules.</p>
      </header>
    </main>
  );
}
