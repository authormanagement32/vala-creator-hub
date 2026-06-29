import { createFileRoute } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { DomainWall } from "@/features/author-manager/components/DomainWall";
import { StatusBadge } from "@/features/author-manager/components/StatusBadge";
import { fmtDate } from "@/features/author-manager/format";

interface ApprovalItem {
  id: string;
  entityType: "application" | "product" | "version" | "withdrawal" | "license";
  entityName: string;
  requester: string;
  approver: string | null;
  status: "pending" | "approved" | "rejected";
  slaHours: number | null;
  submittedAt: string;
}

export const Route = createFileRoute("/boss/author-manager/approvals")({
  head: () => ({ meta: [{ title: "Approvals — Author Manager" }] }),
  component: () => (
    <DomainWall<ApprovalItem>
      title="Approval Queue"
      subtitle="Cross-domain approval workflow — applications, releases, payouts, and licenses."
      queryKey="approvals"
      auditEntity="approval"
      kpis={[
        { label: "Pending approvals" },
        { label: "SLA at risk" },
        { label: "Approved today" },
        { label: "Rejected today" },
        { label: "Median SLA" },
        { label: "Auto-approvals" },
      ]}
      statusOptions={[
        { value: "pending", label: "Pending" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
      ]}
      extraFilter={{
        placeholder: "All types",
        options: [
          { value: "application", label: "Application" },
          { value: "product", label: "Product" },
          { value: "version", label: "Version" },
          { value: "withdrawal", label: "Withdrawal" },
          { value: "license", label: "License" },
        ],
      }}
      bulkActions={[
        { label: "Approve", icon: <Check className="h-3.5 w-3.5" /> },
        { label: "Reject", tone: "danger", icon: <X className="h-3.5 w-3.5" /> },
      ]}
      columns={[
        { id: "type", header: "Type", cell: (r) => <span className="font-mono text-[11px] uppercase">{r.entityType}</span>, width: "0.7" },
        { id: "entity", header: "Entity", cell: (r) => <span className="font-medium">{r.entityName}</span>, width: "1.4" },
        { id: "requester", header: "Requester", cell: (r) => r.requester },
        { id: "approver", header: "Approver", cell: (r) => r.approver ?? "—" },
        { id: "sla", header: "SLA", cell: (r) => (r.slaHours != null ? `${r.slaHours}h` : "—"), width: "0.5", align: "right" },
        { id: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, width: "0.7" },
        { id: "submitted", header: "Submitted", cell: (r) => fmtDate(r.submittedAt), width: "0.8" },
      ]}
      rowKey={(r) => r.id}
      panelTitle={(r) => r.entityName}
      panelSubtitle={(r) => `${r.entityType} · ${r.requester}`}
      emptyTitle="Nothing waiting for approval"
      emptyDescription="Every approval-gated action across the Author Manager surfaces here with full audit timeline."
    />
  ),
});
