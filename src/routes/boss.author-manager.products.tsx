import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CheckCircle2, History, Pause, Pencil, Trash2 } from "lucide-react";
import { WallShell } from "@/features/author-manager/components/WallShell";
import { FilterBar } from "@/features/author-manager/components/FilterBar";
import { DataTable, type Column } from "@/features/author-manager/components/DataTable";
import { StatusBadge } from "@/features/author-manager/components/StatusBadge";
import { RightActionPanel } from "@/features/author-manager/components/RightActionPanel";
import { AuditTimeline } from "@/features/author-manager/components/AuditTimeline";
import { EmptyState } from "@/features/author-manager/components/EmptyState";
import { useProducts, useProductVersions, deriveState } from "@/features/author-manager/data";
import { fmtMoney, fmtNumber, fmtDate } from "@/features/author-manager/format";
import type { Product } from "@/features/author-manager/types";

export const Route = createFileRoute("/boss/author-manager/products")({
  head: () => ({ meta: [{ title: "Products — Author Manager" }] }),
  component: ProductsWall,
});

const columns: Column<Product>[] = [
  {
    id: "name",
    header: "Product",
    cell: (r) => (
      <div className="flex flex-col">
        <span className="font-medium">{r.name}</span>
        <span className="text-[11px] text-muted-foreground">{r.category}</span>
      </div>
    ),
    width: "1.4",
  },
  { id: "type", header: "Type", cell: (r) => <span className="font-mono text-[11px] uppercase">{r.type}</span>, width: "0.7" },
  { id: "version", header: "Version", cell: (r) => <span className="font-mono text-[11px]">{r.version}</span>, width: "0.6" },
  { id: "price", header: "Price", cell: (r) => fmtMoney(r.price), width: "0.6", align: "right" },
  { id: "downloads", header: "Downloads", cell: (r) => fmtNumber(r.downloads), width: "0.7", align: "right" },
  { id: "rating", header: "Rating", cell: (r) => (r.rating ? r.rating.toFixed(2) : "—"), width: "0.5", align: "right" },
  { id: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, width: "0.7" },
];

function ProductsWall() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const q = useMemo(
    () => ({ page: 1, pageSize: 50, search, filters: { status, category } }),
    [search, status, category],
  );
  const { data, isLoading, isError } = useProducts(q);
  const state = deriveState(isLoading, isError, data);
  const rows = data?.rows ?? [];

  const bulkActive = selectedIds.size > 0;

  return (
    <WallShell
      title="Products"
      subtitle="Every author product across software, SaaS, APK, source, templates, themes, plugins, and AI."
      count={data?.total}
      actions={
        bulkActive ? (
          <>
            <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>
            <button className="flex h-9 items-center gap-1.5 rounded-md border border-hairline px-2.5 text-sm hover:bg-surface-2">
              <CheckCircle2 className="h-3.5 w-3.5" /> Publish
            </button>
            <button className="flex h-9 items-center gap-1.5 rounded-md border border-hairline px-2.5 text-sm hover:bg-surface-2">
              <Pause className="h-3.5 w-3.5" /> Suspend
            </button>
            <button className="flex h-9 items-center gap-1.5 rounded-md border border-danger/40 px-2.5 text-sm text-danger hover:bg-danger/10">
              <Trash2 className="h-3.5 w-3.5" /> Archive
            </button>
          </>
        ) : null
      }
    >
      <FilterBar
        search={search}
        onSearch={setSearch}
        statusOptions={[
          { value: "draft", label: "Draft" },
          { value: "review", label: "In review" },
          { value: "published", label: "Published" },
          { value: "rejected", label: "Rejected" },
          { value: "archived", label: "Archived" },
        ]}
        status={status}
        onStatusChange={setStatus}
        onCreate={() => {}}
        createLabel="New product"
        extras={
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-9 rounded-md border border-hairline bg-surface-2 px-2 text-sm outline-none focus:border-brand"
          >
            <option value="">All categories</option>
            <option value="software">Software</option>
            <option value="saas">SaaS</option>
            <option value="apk">APK</option>
            <option value="source">Source code</option>
            <option value="template">Templates</option>
            <option value="theme">Themes</option>
            <option value="plugin">Plugins</option>
            <option value="ai">AI</option>
          </select>
        }
      />
      <DataTable
        columns={columns}
        rows={rows}
        state={state}
        rowKey={(r) => r.id}
        onRowClick={setSelected}
        emptyTitle="No products yet"
        emptyDescription="Approved authors publish products here. Connect Lovable Cloud and approve your first author to see live records."
      />
      <RightActionPanel
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        subtitle={selected ? `${selected.type} · v${selected.version}` : undefined}
      >
        {selected && <ProductPanel product={selected} />}
      </RightActionPanel>
      {/* keep set state referenced for future selection UI */}
      <span className="hidden">{selectedIds.size}</span>
      <button className="hidden" onClick={() => setSelectedIds(new Set())} />
    </WallShell>
  );
}

function ProductPanel({ product }: { product: Product }) {
  const { data: versions = [] } = useProductVersions(product.id);
  return (
    <div className="space-y-5 text-sm">
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Price" value={fmtMoney(product.price)} />
        <Stat label="Downloads" value={fmtNumber(product.downloads)} />
        <Stat label="Rating" value={product.rating ? product.rating.toFixed(2) : "—"} />
        <Stat label="Status" value={<StatusBadge status={product.status} />} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button className="flex items-center justify-center gap-1.5 rounded-md bg-brand px-3 py-2 text-sm font-medium text-brand-foreground hover:opacity-90">
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
        <button className="flex items-center justify-center gap-1.5 rounded-md border border-hairline px-3 py-2 text-sm hover:bg-surface-2">
          <CheckCircle2 className="h-3.5 w-3.5" /> Publish
        </button>
        <button className="flex items-center justify-center gap-1.5 rounded-md border border-hairline px-3 py-2 text-sm hover:bg-surface-2">
          <Pause className="h-3.5 w-3.5" /> Suspend
        </button>
        <button className="flex items-center justify-center gap-1.5 rounded-md border border-danger/40 px-3 py-2 text-sm text-danger hover:bg-danger/10">
          <Trash2 className="h-3.5 w-3.5" /> Archive
        </button>
      </div>
      <div>
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <History className="h-3.5 w-3.5" /> Version history
        </div>
        {versions.length === 0 ? (
          <EmptyState
            title="No versions yet"
            description="Release history populates from product publishing events."
          />
        ) : (
          <ul className="divide-y divide-hairline rounded-md border border-hairline">
            {versions.map((v) => (
              <li key={v.id} className="flex items-center justify-between p-2 text-xs">
                <span className="font-mono">{v.version}</span>
                <StatusBadge status={v.status} />
                <span className="text-muted-foreground">{fmtDate(v.releasedAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Audit</div>
        <AuditTimeline entity="product" entityId={product.id} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-hairline bg-surface-2 p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}
