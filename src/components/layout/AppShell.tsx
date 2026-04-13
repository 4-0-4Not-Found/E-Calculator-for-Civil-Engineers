import type { ReactNode } from "react";
import { AppHeader } from "@/components/navigation/AppHeader";

export function AppShell(props: { children: ReactNode; width?: "6xl" | "3xl" }) {
  const maxWidth = props.width === "3xl" ? "max-w-3xl" : "max-w-6xl";

  return (
    <div className="min-h-dvh bg-white">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#0818A8] focus:shadow-md"
      >
        Skip to content
      </a>
      <AppHeader />
      <main id="content" className={`mx-auto w-full ${maxWidth} px-4 pb-10 pt-6 md:px-8 md:pt-8`}>
        {props.children}
      </main>
    </div>
  );
}

