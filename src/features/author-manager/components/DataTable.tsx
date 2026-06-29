import type { ReactNode } from "react";
import type { LoadState } from "../types";
import { EmptyState } from "./EmptyState";

export interface Column<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  width?: string;
  align?: "left" | "right" | "center";
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  state: "loading" | "empty" | "error" | "ready";
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  rowKey: (row: T) => string;
}

export function DataTable<T>({
  columns,
  rows,
  state,
  emptyTitle,
  emptyDescription,
  onRowClick,
  rowKey,
}: Props<T>) {
  if (state === "loading") {
    return (
      <div className="overflow-hidden rounded-lg border border-hairline bg-card">
        <TableHeader columns={columns} />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex h-10 items-center gap-3 border-t border-hairline px-3">
            {columns.map((c) => (
              <div key={c.id} className="h-3 flex-1 animate-pulse rounded bg-surface-2" />
            ))}
          </div>
        ))}
      </div>
    );
  }
  if (state === "error") {
    return (
      <EmptyState
        title="Couldn't load records"
        description="Something went wrong fetching data. Retry shortly."
      />
    );
  }
  if (state === "empty") {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }
  return (
    <div className="overflow-hidden rounded-lg border border-hairline bg-card">
      <TableHeader columns={columns} />
      <div className="scrollbar-thin max-h-[60vh] overflow-auto">
        {rows.map((r) => (
          <div
            key={rowKey(r)}
            onClick={() => onRowClick?.(r)}
            className="flex h-10 cursor-pointer items-center gap-3 border-t border-hairline px-3 text-[13px] hover:bg-surface-2"
          >
            {columns.map((c) => (
              <div
                key={c.id}
                style={{ flex: c.width ?? 1, textAlign: c.align ?? "left" }}
                className="truncate"
              >
                {c.cell(r)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function TableHeader<T>({ columns }: { columns: Column<T>[] }) {
  return (
    <div className="flex h-9 items-center gap-3 bg-surface-2 px-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
      {columns.map((c) => (
        <div key={c.id} style={{ flex: c.width ?? 1, textAlign: c.align ?? "left" }}>
          {c.header}
        </div>
      ))}
    </div>
  );
}
