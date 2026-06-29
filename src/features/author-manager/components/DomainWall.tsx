import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { WallShell } from "./WallShell";
import { FilterBar } from "./FilterBar";
import { DataTable, type Column } from "./DataTable";
import { RightActionPanel } from "./RightActionPanel";
import { AuditTimeline } from "./AuditTimeline";
import { KpiStrip, type KpiItem } from "./KpiStrip";
import { deriveState } from "../data";
import type { PaginatedQuery, PaginatedResult } from "../types";

export interface DomainWallProps<T> {
  title: string;
  subtitle: string;
  kpis: KpiItem[];
  statusOptions?: { value: string; label: string }[];
  extraFilter?: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder: string };
  createLabel?: string;
  columns: Column<T>[];
  rowKey: (r: T) => string;
  panelTitle?: (r: T) => string;
  panelSubtitle?: (r: T) => string;
  panelChildren?: (r: T) => ReactNode;
  emptyTitle: string;
  emptyDescription: string;
  auditEntity: string;
  queryKey: string;
  bulkActions?: { label: string; tone?: "default" | "danger"; icon?: ReactNode }[];
}

export function DomainWall<T>({
  title,
  subtitle,
  kpis,
  statusOptions,
  extraFilter,
  createLabel,
  columns,
  rowKey,
  panelTitle,
  panelSubtitle,
  panelChildren,
  emptyTitle,
  emptyDescription,
  auditEntity,
  queryKey,
  bulkActions,
}: DomainWallProps<T>) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<T | null>(null);

  const q: PaginatedQuery = useMemo(
    () => ({ page: 1, pageSize: 50, search, filters: { status, extra: extraFilter?.value } }),
    [search, status, extraFilter?.value],
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["author-manager", queryKey, q],
    queryFn: async (): Promise<PaginatedResult<T>> => ({ rows: [], total: 0 }),
  });

  const state = deriveState(isLoading, isError, data);

  return (
    <WallShell
      title={title}
      subtitle={subtitle}
      count={data?.total}
      actions={
        bulkActions && bulkActions.length > 0 ? (
          <>
            {bulkActions.map((a) => (
              <button
                key={a.label}
                disabled
                className={`flex h-9 items-center gap-1.5 rounded-md border px-2.5 text-sm disabled:opacity-50 ${
                  a.tone === "danger"
                    ? "border-danger/40 text-danger hover:bg-danger/10"
                    : "border-hairline hover:bg-surface-2"
                }`}
              >
                {a.icon}
                {a.label}
              </button>
            ))}
          </>
        ) : null
      }
    >
      <KpiStrip items={kpis} />
      <FilterBar
        search={search}
        onSearch={setSearch}
        statusOptions={statusOptions}
        status={status}
        onStatusChange={setStatus}
        onCreate={createLabel ? () => {} : undefined}
        createLabel={createLabel}
        extras={
          extraFilter ? (
            <select
              value={extraFilter.value}
              onChange={(e) => extraFilter.onChange(e.target.value)}
              className="h-9 rounded-md border border-hairline bg-surface-2 px-2 text-sm outline-none focus:border-brand"
            >
              <option value="">{extraFilter.placeholder}</option>
              {extraFilter.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : undefined
        }
      />
      <DataTable
        columns={columns}
        rows={data?.rows ?? []}
        state={state}
        rowKey={rowKey}
        onRowClick={setSelected}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />
      <RightActionPanel
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected && panelTitle ? panelTitle(selected) : ""}
        subtitle={selected && panelSubtitle ? panelSubtitle(selected) : undefined}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            {panelChildren?.(selected)}
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Audit
              </div>
              <AuditTimeline entity={auditEntity} entityId={rowKey(selected)} />
            </div>
          </div>
        )}
      </RightActionPanel>
    </WallShell>
  );
}
