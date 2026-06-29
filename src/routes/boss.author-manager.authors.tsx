import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { WallShell } from "@/features/author-manager/components/WallShell";
import { FilterBar } from "@/features/author-manager/components/FilterBar";
import { DataTable, type Column } from "@/features/author-manager/components/DataTable";
import { StatusBadge } from "@/features/author-manager/components/StatusBadge";
import { RightActionPanel } from "@/features/author-manager/components/RightActionPanel";
import { AuditTimeline } from "@/features/author-manager/components/AuditTimeline";
import { useAuthors, deriveState } from "@/features/author-manager/data";
import { fmtMoney, fmtNumber } from "@/features/author-manager/format";
import type { Author } from "@/features/author-manager/types";

export const Route = createFileRoute("/boss/author-manager/authors")({
  head: () => ({ meta: [{ title: "Authors — Author Manager" }] }),
  component: AuthorsWall,
});

const columns: Column<Author>[] = [
  {
    id: "name",
    header: "Author",
    cell: (r) => (
      <div className="flex items-center gap-2">
        <div className="grid h-6 w-6 place-items-center rounded-full bg-brand/15 text-[10px] font-semibold text-brand">
          {r.name.slice(0, 1)}
        </div>
        <div>
          <div className="font-medium">{r.name}</div>
          <div className="text-[11px] text-muted-foreground">{r.email}</div>
        </div>
      </div>
    ),
    width: "1.5",
  },
  { id: "company", header: "Company", cell: (r) => r.company ?? "—" },
  { id: "country", header: "Country", cell: (r) => r.country ?? "—", width: "0.6" },
  { id: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, width: "0.6" },
  { id: "products", header: "Products", cell: (r) => fmtNumber(r.products), width: "0.5", align: "right" },
  { id: "revenue", header: "Revenue", cell: (r) => fmtMoney(r.revenue), width: "0.7", align: "right" },
  { id: "royalties", header: "Royalties", cell: (r) => fmtMoney(r.royalties), width: "0.7", align: "right" },
  { id: "health", header: "Health", cell: (r) => fmtNumber(r.healthScore), width: "0.4", align: "right" },
  { id: "risk", header: "Risk", cell: (r) => fmtNumber(r.riskScore), width: "0.4", align: "right" },
];

function AuthorsWall() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<Author | null>(null);
  const { data, isLoading, isError } = useAuthors({
    page: 1,
    pageSize: 100,
    search,
    filters: { status },
  });
  const state = deriveState(isLoading, isError, data);
  return (
    <WallShell
      title="Authors"
      subtitle="Master directory of every software author, publisher, and creator."
      count={data?.total}
    >
      <FilterBar
        search={search}
        onSearch={setSearch}
        statusOptions={[
          { value: "verified", label: "Verified" },
          { value: "pending", label: "Pending" },
          { value: "suspended", label: "Suspended" },
          { value: "rejected", label: "Rejected" },
        ]}
        status={status}
        onStatusChange={setStatus}
        onCreate={() => {}}
        createLabel="Add author"
      />
      <DataTable
        columns={columns}
        rows={data?.rows ?? []}
        state={state}
        rowKey={(r) => r.id}
        onRowClick={setSelected}
        emptyTitle="No authors yet"
        emptyDescription="Once authors are approved through the pipeline, their profiles populate this directory."
      />
      <RightActionPanel
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        subtitle={selected?.email}
      >
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Products" value={fmtNumber(selected?.products)} />
            <Stat label="Revenue" value={fmtMoney(selected?.revenue)} />
            <Stat label="Royalties" value={fmtMoney(selected?.royalties)} />
            <Stat label="Health" value={fmtNumber(selected?.healthScore)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-md border border-hairline px-3 py-1.5 text-xs">View profile</button>
            <button className="rounded-md border border-hairline px-3 py-1.5 text-xs">Message</button>
            <button className="rounded-md border border-warning/40 px-3 py-1.5 text-xs text-warning">Suspend</button>
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Audit</div>
            <AuditTimeline entity="author" entityId={selected?.id} />
          </div>
        </div>
      </RightActionPanel>
    </WallShell>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-hairline p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}
