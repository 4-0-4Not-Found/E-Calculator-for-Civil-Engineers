"use client";

import dynamic from "next/dynamic";
import type { CalculationStep } from "@/lib/types/calculation";

const Inner = dynamic(() => import("./StepsTable").then((m) => m.StepsTable), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
      Loading step table…
    </div>
  ),
});

export function StepsTableClient(props: { steps: CalculationStep[]; governingCase?: string; tools?: boolean }) {
  return <Inner {...props} />;
}
