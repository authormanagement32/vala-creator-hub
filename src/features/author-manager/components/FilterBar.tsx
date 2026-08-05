import { Filter, Plus, Search, SlidersHorizontal, Upload, X } from "lucide-react";
import type { ReactNode } from "react";

export interface FilterChip {
  key: string;
  label: string;
  onClear: () => void;
}

interface Props {
  search: string;
  onSearch: (v: string) => void;
  statusOptions?: { value: string; label: string }[];
  status?: string;
  onStatusChange?: (v: string) => void;
  onCreate?: () => void;
  createLabel?: string;
  extras?: ReactNode;
  /** Additional applied-filter chips contributed by the wall. */
  chips?: FilterChip[];
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
  chips = [],
}: Props) {
  const appliedChips: FilterChip[] = [
    ...(search.trim()
      ? [{ key: "search", label: `Search: “${search.trim()}”`, onClear: () => onSearch("") }]
      : []),
    ...(status
      ? [
          {
            key: "status",
            label: `Status: ${statusOptions?.find((o) => o.value === status)?.label ?? status}`,
            onClear: () => onStatusChange?.(""),
          },
        ]
      : []),
    ...chips,
  ];

  const clearAll = () => {
    appliedChips.forEach((c) => c.onClear());
  };

  return (
    <div className="mb-3 rounded-lg border border-hairline bg-card p-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search…"
            aria-label="Search this list"
            className="h-9 w-full rounded-md border border-hairline bg-surface-2 pl-8 pr-3 text-sm outline-none focus:border-brand"
          />
        </div>
        {statusOptions && (
          <select
            value={status ?? ""}
            onChange={(e) => onStatusChange?.(e.target.value)}
            aria-label="Filter by status"
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

      {appliedChips.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-hairline pt-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Filters
          </span>
          {appliedChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 rounded-full border border-hairline bg-surface-2 py-0.5 pl-2 pr-1 text-xs"
            >
              {chip.label}
              <button
                onClick={chip.onClear}
                aria-label={`Clear filter ${chip.label}`}
                className="grid h-5 w-5 place-items-center rounded-full text-muted-foreground hover:bg-card hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            onClick={clearAll}
            className="ml-1 rounded-md px-2 py-0.5 text-xs font-medium text-brand hover:bg-surface-2"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
