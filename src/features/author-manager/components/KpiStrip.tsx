import type { ReactNode } from "react";

export interface KpiItem {
  label: string;
  value?: ReactNode;
  hint?: string;
}

export function KpiStrip({ items }: { items: KpiItem[] }) {
  return (
    <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((k) => (
        <div key={k.label} className="rounded-lg border border-hairline bg-card px-3 py-2">
          <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {k.label}
          </div>
          <div className="mt-1 text-base font-semibold tabular-nums">{k.value ?? "—"}</div>
          {k.hint && <div className="text-[11px] text-muted-foreground">{k.hint}</div>}
        </div>
      ))}
    </div>
  );
}
