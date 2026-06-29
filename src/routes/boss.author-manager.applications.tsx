import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { WallShell } from "@/features/author-manager/components/WallShell";
import { FilterBar } from "@/features/author-manager/components/FilterBar";
import { DataTable, type Column } from "@/features/author-manager/components/DataTable";
import { StatusBadge } from "@/features/author-manager/components/StatusBadge";
import { RightActionPanel } from "@/features/author-manager/components/RightActionPanel";
import { AuditTimeline } from "@/features/author-manager/components/AuditTimeline";
import { useApplications, deriveState } from "@/features/author-manager/data";
import { fmtDate } from "@/features/author-manager/format";
import type { Application } from "@/features/author-manager/types";

export const Route = createFileRoute("/boss/author-manager/applications")({
  head: () => ({ meta: [{ title: "Applications — Author Manager" }] }),
  component: ApplicationsWall,
});

const columns: Column<Application>[] = [
  { id: "name", header: "Applicant", cell: (r) => <span className="font-medium">{r.applicantName}</span> },
  { id: "email", header: "Email", cell: (r) => <span className="text-muted-foreground">{r.email}</span> },
  { id: "country", header: "Country", cell: (r) => r.country ?? "—", width: "0.6" },
  { id: "stage", header: "Stage", cell: (r) => <StatusBadge status={r.stage} />, width: "0.7" },
  { id: "submitted", header: "Submitted", cell: (r) => fmtDate(r.submittedAt), width: "0.7" },
  { id: "reviewer", header: "Reviewer", cell: (r) => r.reviewer ?? "—", width: "0.7" },
];

function ApplicationsWall() {
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("");
  const [selected, setSelected] = useState<Application | null>(null);
  const q = { page: 1, pageSize: 50, search, filters: { stage } };
  const { data, isLoading, isError } = useApplications(q);
  const state = deriveState(isLoading, isError, data);
  return (
    <WallShell title="Applications" subtitle="Author onboarding pipeline — registration through agreement." count={data?.total}>
      <FilterBar
        search={search}
        onSearch={setSearch}
        statusOptions={[
          { value: "registration", label: "Registration" },
          { value: "identity", label: "Identity" },
          { value: "kyc", label: "KYC" },
          { value: "portfolio", label: "Portfolio" },
          { value: "interview", label: "Interview" },
          { value: "agreement", label: "Agreement" },
          { value: "approved", label: "Approved" },
          { value: "rejected", label: "Rejected" },
        ]}
        status={stage}
        onStatusChange={setStage}
        onCreate={() => {}}
        createLabel="Invite author"
      />
      <DataTable
        columns={columns}
        rows={data?.rows ?? []}
        state={state}
        rowKey={(r) => r.id}
        onRowClick={setSelected}
        emptyTitle="No applications in the pipeline"
        emptyDescription="New applicant submissions will land here for KYC, portfolio review, and approval."
      />
      <RightActionPanel
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.applicantName ?? ""}
        subtitle={selected ? `Stage · ${selected.stage}` : undefined}
      >
        <div className="space-y-4 text-sm">
          <button className="w-full rounded-md bg-success px-3 py-2 text-sm font-medium text-success-foreground">
            Approve & issue agreement
          </button>
          <button className="w-full rounded-md border border-hairline px-3 py-2 text-sm">Request changes</button>
          <button className="w-full rounded-md border border-danger/40 px-3 py-2 text-sm text-danger">Reject</button>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Audit</div>
            <AuditTimeline entity="application" entityId={selected?.id} />
          </div>
        </div>
      </RightActionPanel>
    </WallShell>
  );
}
