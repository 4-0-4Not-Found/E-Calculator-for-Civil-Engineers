"use client";

type Props = {
  data: unknown;
  label?: string;
};

/** Copies a JSON snapshot of results to the clipboard for reports / checking. */
export function ExportJsonButton(props: Props) {
  return (
    <button
      type="button"
      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:border-slate-300 hover:bg-slate-50"
      onClick={async () => {
        try {
          const text = JSON.stringify(props.data, null, 2);
          await navigator.clipboard.writeText(text);
        } catch {
          /* ignore */
        }
      }}
    >
      {props.label ?? "Copy results (JSON)"}
    </button>
  );
}
