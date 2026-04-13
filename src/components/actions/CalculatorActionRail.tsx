"use client";

import { useMemo, useState } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CopySummaryButton } from "@/components/actions/CopySummaryButton";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { ExportJsonButton } from "@/components/ExportJsonButton";
import { cn } from "@/lib/utils";
import { CompareDrawer, type CompareSnapshot } from "@/components/compare/CompareDrawer";

type CsvSpec = { filename: string; rows: string[][] };
type JsonSpec = { data: unknown };
type CompareSpec = { storageKey: string; getCurrent: () => Omit<CompareSnapshot, "ts"> };

export function CalculatorActionRail(props: {
  desktopClassName?: string;
  /** When true, only the mobile bottom bar + spacer render (use for the rail below the main card). */
  mobileOnly?: boolean;
  /** When true, do not render the fixed mobile bar (use on the in-page / sidebar rail so only one bottom bar exists). */
  hideMobileBar?: boolean;
  title?: string;
  subtitle?: string;
  copyText: () => string;
  csv?: CsvSpec;
  json?: JsonSpec;
  compare?: CompareSpec;
  onReset?: () => void;
  onGoSteps?: () => void;
}) {
  const [resetArmed, setResetArmed] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const hasExport = Boolean(props.csv || props.json);

  const header = useMemo(() => {
    if (!props.title && !props.subtitle) return null;
    return (
      <div className="mb-3">
        {props.title ? <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{props.title}</p> : null}
        {props.subtitle ? <p className="mt-1 text-sm font-semibold text-slate-950">{props.subtitle}</p> : null}
      </div>
    );
  }, [props.title, props.subtitle]);

  return (
    <>
      {/* Desktop rail */}
      {!props.mobileOnly ? (
      <div className={cn("hidden md:block", props.desktopClassName)}>
        <Card className="border-slate-200">
          <CardBody className="space-y-3">
            {header}
            <div className="flex flex-wrap gap-2">
              <CopySummaryButton getText={props.copyText} label="Copy summary" />
              {props.onGoSteps ? (
                <Button variant="secondary" size="sm" onClick={props.onGoSteps}>
                  Steps
                </Button>
              ) : null}
              {props.compare ? (
                <Button variant="secondary" size="sm" type="button" onClick={() => setCompareOpen(true)}>
                  Compare
                </Button>
              ) : null}
            </div>

            {hasExport ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Export</p>
                <div className="flex flex-wrap gap-2">
                  {props.csv ? <ExportCsvButton filename={props.csv.filename} rows={props.csv.rows} /> : null}
                  {props.json ? <ExportJsonButton data={props.json.data} /> : null}
                </div>
              </div>
            ) : null}

            {props.onReset ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reset</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant={resetArmed ? "danger" : "secondary"}
                    size="sm"
                    onClick={() => {
                      if (!resetArmed) {
                        setResetArmed(true);
                        window.setTimeout(() => setResetArmed(false), 1500);
                        return;
                      }
                      setResetArmed(false);
                      props.onReset?.();
                    }}
                  >
                    {resetArmed ? "Confirm reset" : "Reset inputs"}
                  </Button>
                  <span className="text-xs font-medium text-slate-600">Clears saved inputs in this browser.</span>
                </div>
              </div>
            ) : null}
          </CardBody>
        </Card>
      </div>
      ) : null}

      {/* Mobile bottom bar */}
      {!props.hideMobileBar ? (
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2">
          <div className="min-w-0">
            {props.subtitle ? <p className="truncate text-xs font-semibold text-slate-800">{props.subtitle}</p> : null}
            <p className="text-[11px] font-medium text-slate-600">Copy, jump to steps, export, or reset.</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {props.onGoSteps ? (
              <Button variant="secondary" size="sm" onClick={props.onGoSteps}>
                Steps
              </Button>
            ) : null}
            {props.compare ? (
              <Button variant="secondary" size="sm" type="button" onClick={() => setCompareOpen(true)}>
                Compare
              </Button>
            ) : null}
            <CopySummaryButton getText={props.copyText} label="Copy" />
          </div>
        </div>
      </div>
      ) : null}
      {!props.hideMobileBar ? <div className="h-14 md:hidden" aria-hidden="true" /> : null}

      {props.compare ? (
        <CompareDrawer
          open={compareOpen}
          onClose={() => setCompareOpen(false)}
          storageKey={props.compare.storageKey}
          getCurrent={props.compare.getCurrent}
        />
      ) : null}
    </>
  );
}

