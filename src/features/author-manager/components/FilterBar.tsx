import { Filter, Plus, Search, SlidersHorizontal, Upload } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  search: string;
  onSearch: (v: string) => void;
  statusOptions?: { value: string; label: string }[];
  status?: string;
  onStatusChange?: (v: string) => void;
  onCreate?: () => void;
  createLabel?: string;
  extras?: ReactNode;
}

export function FilterBar({
  search,
  onSearch,
  statusOptions,
  status,
  onStatusChange,
  onCreate,
  createLabel = "New",
  extras,
}: Props) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-hairline bg-card p-2">
      <div className="relative flex-1 min-w-[220px]">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search…"
          className="h-9 w-full rounded-md border border-hairline bg-surface-2 pl-8 pr-3 text-sm outline-none focus:border-brand"
        />
      </div>
      {statusOptions && (
        <select
          value={status ?? ""}
          onChange={(e) => onStatusChange?.(e.target.value)}
          className="h-9 rounded-md border border-hairline bg-surface-2 px-2 text-sm outline-none focus:border-brand"
        >
          <option value="">All statuses</option>
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
      {extras}
      <button className="flex h-9 items-center gap-1.5 rounded-md border border-hairline px-2.5 text-sm hover:bg-surface-2">
        <SlidersHorizontal className="h-3.5 w-3.5" /> Columns
      </button>
      <button className="flex h-9 items-center gap-1.5 rounded-md border border-hairline px-2.5 text-sm hover:bg-surface-2">
        <Filter className="h-3.5 w-3.5" /> Advanced
      </button>
      <button className="flex h-9 items-center gap-1.5 rounded-md border border-hairline px-2.5 text-sm hover:bg-surface-2">
        <Upload className="h-3.5 w-3.5" /> Export
      </button>
      {onCreate && (
        <button
          onClick={onCreate}
          className="flex h-9 items-center gap-1.5 rounded-md bg-brand px-3 text-sm font-medium text-brand-foreground hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" /> {createLabel}
        </button>
      )}
    </div>
  );
}
