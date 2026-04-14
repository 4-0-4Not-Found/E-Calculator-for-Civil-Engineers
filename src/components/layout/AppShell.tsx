import type { ReactNode } from "react";
import { AppHeader } from "@/components/navigation/AppHeader";
import { PageBreadcrumbs } from "@/components/navigation/PageBreadcrumbs";
import { ToastProvider } from "@/components/ui/Toast";

export function AppShell(props: { children: ReactNode; width?: "6xl" | "3xl" }) {
  const maxWidth = props.width === "3xl" ? "max-w-3xl" : "max-w-6xl";

  return (
    <ToastProvider>
      <div className="min-h-dvh bg-white">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-[color:var(--brand)] focus:shadow-md"
        >
          Skip to content
        </a>
        <a
          href="#actions"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-16 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-[color:var(--brand)] focus:shadow-md"
        >
          Skip to actions
        </a>
        <a
          href="#results"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-28 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-[color:var(--brand)] focus:shadow-md"
        >
          Skip to results
        </a>
        <AppHeader />
        <PageBreadcrumbs />
        <main id="content" className={`mx-auto w-full ${maxWidth} px-4 pb-10 pt-6 md:px-8 md:pt-8`}>
          {props.children}
        </main>
      </div>
    </ToastProvider>
  );
}

