import Link from "next/link";

export default function CompressionPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 p-6 md:p-10">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Compression Analysis & Design</h1>
          <Link href="/" className="text-sm font-medium text-blue-700 hover:underline">Back to modules</Link>
        </div>
        <p className="mt-2 text-slate-600">Scaffold ready. Next step: full AISC E3 workflow with KL/r, Fcr, and local slenderness checks.</p>
      </header>
    </main>
  );
}
