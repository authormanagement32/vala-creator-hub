import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, History, Pause, Pencil, Plus, Trash2 } from "lucide-react";
import { WallShell } from "@/features/author-manager/components/WallShell";
import { FilterBar } from "@/features/author-manager/components/FilterBar";
import { DataTable, type Column } from "@/features/author-manager/components/DataTable";
import { StatusBadge } from "@/features/author-manager/components/StatusBadge";
import { RightActionPanel } from "@/features/author-manager/components/RightActionPanel";
import { AuditTimeline } from "@/features/author-manager/components/AuditTimeline";
import { deriveState } from "@/features/author-manager/data";
import { fmtMoney, fmtNumber } from "@/features/author-manager/format";
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkUpdateProducts,
} from "@/lib/author-manager.functions";

export const Route = createFileRoute("/boss/author-manager/products")({
  head: () => ({ meta: [{ title: "Products — Author Manager" }] }),
  component: ProductsWall,
});

type ProductRow = {
  id: string;
  name: string;
  category: string;
  type: string;
  version: string;
  price: number;
  status: string;
  downloads: number;
  rating: number | null;
};

const columns: Column<ProductRow>[] = [
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
  { id: "price", header: "Price", cell: (r) => fmtMoney(Number(r.price)), width: "0.6", align: "right" },
  { id: "downloads", header: "Downloads", cell: (r) => fmtNumber(Number(r.downloads)), width: "0.7", align: "right" },
  { id: "status", header: "Status", cell: (r) => <StatusBadge status={r.status as any} />, width: "0.7" },
];

function ProductsWall() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState<ProductRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);

  const qc = useQueryClient();
  const list = useServerFn(listProducts);
  const create = useServerFn(createProduct);
  const update = useServerFn(updateProduct);
  const remove = useServerFn(deleteProduct);
  const bulk = useServerFn(bulkUpdateProducts);

  const queryKey = useMemo(() => ["products", { search, status, category }], [search, status, category]);
  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => list({ data: { search, status, category, page: 1, pageSize: 50 } }),
    retry: false,
  });

  const rows: ProductRow[] = (data as any)?.rows ?? [];
  const total: number = (data as any)?.total ?? 0;
  const state = deriveState(isLoading, isError, { rows, total });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: ["audit"] });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  const createM = useMutation({
    mutationFn: (input: any) => create({ data: input }),
    onSuccess: (r: any) => { toast.success(`Created "${r.name}"`); invalidate(); setCreateOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteM = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => { toast.success("Product deleted"); invalidate(); setSelected(null); },
    onError: (e: any) => toast.error(e.message),
  });
  const updateM = useMutation({
    mutationFn: (v: { id: string; patch: any }) => update({ data: v }),
    onSuccess: (r: any) => { toast.success(`Updated "${r.name}"`); invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });
  const bulkM = useMutation({
    mutationFn: (action: "publish" | "suspend" | "archive") => bulk({ data: { ids: Array.from(selectedIds), action } }),
    onSuccess: (r: any, action) => { toast.success(`Bulk ${action} on ${r.count} product(s)`); setSelectedIds(new Set()); invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });

  const bulkActive = selectedIds.size > 0;
  const accessDenied = isError && /boss|forbidden|unauthorized/i.test((error as any)?.message ?? "");

  return (
    <WallShell
      title="Products"
      subtitle="Every author product across software, SaaS, APK, source, templates, themes, plugins, and AI."
      count={total}
      actions={
        bulkActive ? (
          <>
            <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>
            <button disabled={bulkM.isPending} onClick={() => bulkM.mutate("publish")} className="flex h-9 items-center gap-1.5 rounded-md border border-hairline px-2.5 text-sm hover:bg-surface-2 disabled:opacity-50">
              <CheckCircle2 className="h-3.5 w-3.5" /> Publish
            </button>
            <button disabled={bulkM.isPending} onClick={() => bulkM.mutate("suspend")} className="flex h-9 items-center gap-1.5 rounded-md border border-hairline px-2.5 text-sm hover:bg-surface-2 disabled:opacity-50">
              <Pause className="h-3.5 w-3.5" /> Suspend
            </button>
            <button disabled={bulkM.isPending} onClick={() => bulkM.mutate("archive")} className="flex h-9 items-center gap-1.5 rounded-md border border-danger/40 px-2.5 text-sm text-danger hover:bg-danger/10 disabled:opacity-50">
              <Trash2 className="h-3.5 w-3.5" /> Archive
            </button>
          </>
        ) : null
      }
    >
      {accessDenied && (
        <div className="rounded-md border border-warning/40 bg-warning/5 p-3 text-xs text-warning">
          You need the boss role to manage products. Visit the dashboard to claim it (one-time, first user only).
        </div>
      )}
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
        onCreate={() => setCreateOpen(true)}
        createLabel="New product"
        extras={
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 rounded-md border border-hairline bg-surface-2 px-2 text-sm outline-none focus:border-brand">
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

      <table className="hidden">{/* keep selection ui hidden for now */}</table>
      <div className="flex items-center justify-between gap-2 px-1 text-[11px] text-muted-foreground">
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={rows.length > 0 && selectedIds.size === rows.length}
            onChange={(e) => setSelectedIds(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())}
          />
          Select all ({rows.length})
        </label>
        {selectedIds.size > 0 && (
          <button className="hover:text-foreground" onClick={() => setSelectedIds(new Set())}>Clear selection</button>
        )}
      </div>

      <div className="space-y-1">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedIds.has(r.id)}
              onChange={(e) => {
                const next = new Set(selectedIds);
                if (e.target.checked) next.add(r.id); else next.delete(r.id);
                setSelectedIds(next);
              }}
            />
            <button
              onClick={() => setSelected(r)}
              className="flex flex-1 items-center justify-between rounded-md border border-hairline bg-surface-2 px-3 py-2 text-left text-sm hover:bg-surface"
            >
              <div className="flex flex-col">
                <span className="font-medium">{r.name}</span>
                <span className="text-[11px] text-muted-foreground">{r.category} · {r.type} · v{r.version}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="font-mono">{fmtMoney(Number(r.price))}</span>
                <StatusBadge status={r.status as any} />
              </div>
            </button>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={[]}
        state={rows.length === 0 ? state : "empty"}
        rowKey={(r) => r.id}
        emptyTitle={accessDenied ? "Access denied" : "No products yet"}
        emptyDescription={accessDenied ? "Claim the boss role to manage products." : 'Click "New product" to create the first one. Every action is audited and notified.'}
      />

      <RightActionPanel
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        subtitle={selected ? `${selected.type} · v${selected.version}` : undefined}
      >
        {selected && (
          <ProductPanel
            product={selected}
            onPublish={() => updateM.mutate({ id: selected.id, patch: { status: "published" } })}
            onSuspend={() => updateM.mutate({ id: selected.id, patch: { status: "draft" } })}
            onArchive={() => updateM.mutate({ id: selected.id, patch: { status: "archived" } })}
            onDelete={() => deleteM.mutate(selected.id)}
            busy={updateM.isPending || deleteM.isPending}
          />
        )}
      </RightActionPanel>

      {createOpen && <CreateProductDialog onClose={() => setCreateOpen(false)} onSubmit={(v) => createM.mutate(v)} busy={createM.isPending} />}
    </WallShell>
  );
}

function ProductPanel({ product, onPublish, onSuspend, onArchive, onDelete, busy }: { product: ProductRow; onPublish: () => void; onSuspend: () => void; onArchive: () => void; onDelete: () => void; busy: boolean }) {
  return (
    <div className="space-y-5 text-sm">
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Price" value={fmtMoney(Number(product.price))} />
        <Stat label="Downloads" value={fmtNumber(Number(product.downloads))} />
        <Stat label="Type" value={product.type} />
        <Stat label="Status" value={<StatusBadge status={product.status as any} />} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button disabled={busy} onClick={onPublish} className="flex items-center justify-center gap-1.5 rounded-md bg-brand px-3 py-2 text-sm font-medium text-brand-foreground hover:opacity-90 disabled:opacity-50">
          <CheckCircle2 className="h-3.5 w-3.5" /> Publish
        </button>
        <button disabled={busy} onClick={onSuspend} className="flex items-center justify-center gap-1.5 rounded-md border border-hairline px-3 py-2 text-sm hover:bg-surface-2 disabled:opacity-50">
          <Pause className="h-3.5 w-3.5" /> Suspend
        </button>
        <button disabled={busy} onClick={onArchive} className="flex items-center justify-center gap-1.5 rounded-md border border-hairline px-3 py-2 text-sm hover:bg-surface-2 disabled:opacity-50">
          <Pencil className="h-3.5 w-3.5" /> Archive
        </button>
        <button disabled={busy} onClick={onDelete} className="flex items-center justify-center gap-1.5 rounded-md border border-danger/40 px-3 py-2 text-sm text-danger hover:bg-danger/10 disabled:opacity-50">
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </button>
      </div>
      <div>
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <History className="h-3.5 w-3.5" /> Audit timeline
        </div>
        <AuditTimeline entity="product" entityId={product.id} />
      </div>
    </div>
  );
}

function CreateProductDialog({ onClose, onSubmit, busy }: { onClose: () => void; onSubmit: (v: any) => void; busy: boolean }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("software");
  const [price, setPrice] = useState("0");
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-lg border border-hairline bg-surface p-5 shadow-xl">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Plus className="h-4 w-4" /> New product
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit({ name, type, price: Number(price) || 0 }); }}
          className="space-y-3 text-sm"
        >
          <label className="block">
            <span className="text-xs text-muted-foreground">Name</span>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-9 w-full rounded-md border border-hairline bg-surface-2 px-2" />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">Type</span>
            <select value={type} onChange={(e) => setType(e.target.value)} className="mt-1 h-9 w-full rounded-md border border-hairline bg-surface-2 px-2">
              {["software","saas","apk","source","template","theme","plugin","ai"].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">Price (USD)</span>
            <input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 h-9 w-full rounded-md border border-hairline bg-surface-2 px-2" />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-md border border-hairline px-3 py-2 text-sm hover:bg-surface-2">Cancel</button>
            <button disabled={busy} type="submit" className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-brand-foreground hover:opacity-90 disabled:opacity-50">
              {busy ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
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
