import { ChevronDown, ChevronsLeft, ChevronsRight, ChevronsUpDown, ChevronUp } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { LoadState } from "../types";
import { EmptyState } from "./EmptyState";

export interface Column<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  width?: string;
  align?: "left" | "right" | "center";
  /** Return a comparable value to make this column sortable. */
  sortValue?: (row: T) => string | number | null | undefined;
}

type SortDir = "asc" | "desc";

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  state: LoadState;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  rowKey: (row: T) => string;
  /** Enable client-side pagination controls (default true). */
  paginate?: boolean;
}

const PAGE_SIZES = [10, 25, 50, 100];

export function DataTable<T>({
  columns,
  rows,
  state,
  emptyTitle,
  emptyDescription,
  onRowClick,
  rowKey,
  paginate = true,
}: Props<T>) {
  const [sort, setSort] = useState<{ id: string; dir: SortDir } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const toggleSort = (id: string) => {
    setPage(1);
    setSort((prev) =>
      prev?.id !== id ? { id, dir: "asc" } : prev.dir === "asc" ? { id, dir: "desc" } : null,
    );
  };

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.id === sort.id);
    if (!col?.sortValue) return rows;
    const get = col.sortValue;
    return [...rows].sort((a, b) => {
      const av = get(a);
      const bv = get(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [rows, sort, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const visible = paginate ? sorted.slice((page - 1) * pageSize, page * pageSize) : sorted;

  if (state === "loading") {
    return (
      <div className="overflow-hidden rounded-lg border border-hairline bg-card">
        <TableHeader columns={columns} sort={null} onSort={() => {}} />
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
      <TableHeader columns={columns} sort={sort} onSort={toggleSort} />
      <div aria-live="polite" className="sr-only">
        {sort
          ? `Sorted by ${columns.find((c) => c.id === sort.id)?.header} ${
              sort.dir === "asc" ? "ascending" : "descending"
            }`
          : "Sorting cleared"}
      </div>
      <div className="scrollbar-thin max-h-[60vh] overflow-auto">
        {visible.map((r) => (
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
      {paginate && (
        <TablePagination
          page={page}
          totalPages={totalPages}
          total={sorted.length}
          pageSize={pageSize}
          onPage={setPage}
          onPageSize={(s) => {
            setPageSize(s);
            setPage(1);
          }}
        />
      )}
    </div>
  );
}

function TableHeader<T>({
  columns,
  sort,
  onSort,
}: {
  columns: Column<T>[];
  sort: { id: string; dir: SortDir } | null;
  onSort: (id: string) => void;
}) {
  return (
    <div
      role="row"
      className="flex h-9 items-center gap-3 bg-surface-2 px-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
    >
      {columns.map((c) => {
        const active = sort?.id === c.id;
        const ariaSort = !c.sortValue ? undefined : active ? (sort!.dir === "asc" ? "ascending" : "descending") : "none";
        return (
          <div
            key={c.id}
            role="columnheader"
            aria-sort={ariaSort}
            style={{ flex: c.width ?? 1, textAlign: c.align ?? "left" }}
          >
            {c.sortValue ? (
              <button
                type="button"
                onClick={() => onSort(c.id)}
                aria-label={`Sort by ${c.header}`}
                className={`inline-flex items-center gap-1 rounded px-1 py-0.5 uppercase outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand ${
                  active ? "text-foreground" : ""
                }`}
              >
                {c.header}
                {active ? (
                  sort!.dir === "asc" ? (
                    <ChevronUp className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-3 w-3" aria-hidden="true" />
                  )
                ) : (
                  <ChevronsUpDown className="h-3 w-3 opacity-50" aria-hidden="true" />
                )}
              </button>
            ) : (
              c.header
            )}
          </div>
        );
      })}
    </div>
  );
}

function TablePagination({
  page,
  totalPages,
  total,
  pageSize,
  onPage,
  onPageSize,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
  onPageSize: (s: number) => void;
}) {
  const [jump, setJump] = useState("");
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const btn =
    "grid h-8 min-w-8 place-items-center rounded-md border border-hairline px-2 text-xs outline-none hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-40";

  return (
    <nav
      aria-label="Table pagination"
      className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline bg-surface-2/40 px-3 py-2 text-xs"
    >
      <div className="text-muted-foreground" aria-live="polite">
        Showing {from}–{to} of {total}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 text-muted-foreground">
          Rows
          <select
            value={pageSize}
            onChange={(e) => onPageSize(Number(e.target.value))}
            aria-label="Rows per page"
            className="h-8 rounded-md border border-hairline bg-surface-2 px-1.5 outline-none focus:border-brand"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <button className={btn} onClick={() => onPage(1)} disabled={page === 1} aria-label="First page">
          <ChevronsLeft className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <button
          className={btn}
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
        >
          <ChevronUp className="h-3.5 w-3.5 -rotate-90" aria-hidden="true" />
        </button>
        <span className="text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <button
          className={btn}
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          aria-label="Next page"
        >
          <ChevronDown className="h-3.5 w-3.5 -rotate-90" aria-hidden="true" />
        </button>
        <button
          className={btn}
          onClick={() => onPage(totalPages)}
          disabled={page === totalPages}
          aria-label="Last page"
        >
          <ChevronsRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number(jump);
            if (Number.isFinite(n) && n >= 1 && n <= totalPages) onPage(Math.floor(n));
            setJump("");
          }}
          className="flex items-center gap-1.5"
        >
          <input
            value={jump}
            onChange={(e) => setJump(e.target.value)}
            inputMode="numeric"
            placeholder="Go to"
            aria-label={`Jump to page (1 to ${totalPages})`}
            className="h-8 w-16 rounded-md border border-hairline bg-surface-2 px-2 outline-none focus:border-brand"
          />
          <button type="submit" className={btn}>
            Go
          </button>
        </form>
      </div>
    </nav>
  );
}
