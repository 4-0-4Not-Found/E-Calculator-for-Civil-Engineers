import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function WorkspaceLayout(props: {
  sidebar: ReactNode;
  drawer: ReactNode;
  drawerOpen: boolean;
  onDrawerOpenChange: (open: boolean) => void;
  header: ReactNode;
  main: ReactNode;
  rightRail: ReactNode;
  footer?: ReactNode;
  /** Fixed sidebar width (must match padding-left at lg). */
  sidebarWidthPx?: number;
}) {
  const w = props.sidebarWidthPx ?? 280;
  return (
    <div
      className={cn(
        "relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen max-w-[100vw] box-border overflow-x-hidden",
        "px-4 pb-10 pt-6 md:px-6 lg:px-8",
        `lg:pl-[calc(${w}px+1.5rem)]`,
      )}
    >
      {props.sidebar}

      {props.drawerOpen ? (
        <div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true" aria-label="Workspace">
          <button
            type="button"
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            aria-label="Close workspace"
            onClick={() => props.onDrawerOpenChange(false)}
          />
          {props.drawer}
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-[1360px]">
        {props.header}
        <div className="min-w-0 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]/85 p-4 shadow-[0_12px_40px_-16px_rgba(15,23,42,0.14),0_1px_0_rgba(15,23,42,0.04)] ring-1 ring-[color:var(--border)]/60 backdrop-blur-[2px] sm:p-5 lg:p-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] lg:items-start">
            <div className="order-2 min-w-0 lg:order-1 lg:col-start-1">{props.main}</div>
            <aside className="order-1 lg:sticky lg:order-2 lg:col-start-2 lg:self-start lg:border-l lg:border-[color:var(--border)]/55 lg:pl-6 lg:top-[calc(var(--app-header-h,104px)+var(--app-crumbs-h,36px)+16px)]">
              {props.rightRail}
            </aside>
          </div>
        </div>
        {props.footer}
      </div>
    </div>
  );
}

