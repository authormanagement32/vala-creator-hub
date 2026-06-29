import { createFileRoute } from "@tanstack/react-router";
import { Ban, RotateCw } from "lucide-react";
import { DomainWall } from "@/features/author-manager/components/DomainWall";
import { StatusBadge } from "@/features/author-manager/components/StatusBadge";
import { fmtDate } from "@/features/author-manager/format";

interface LicenseRow {
  id: string;
  key: string;
  product: string;
  customer: string;
  type: "personal" | "commercial" | "enterprise";
  activations: number;
  maxActivations: number;
  domains: number;
  status: "active" | "expired" | "revoked";
  issuedAt: string;
  expiresAt: string | null;
}

export const Route = createFileRoute("/boss/author-manager/licenses")({
  head: () => ({ meta: [{ title: "Licenses — Author Manager" }] }),
  component: () => (
    <DomainWall<LicenseRow>
      title="Licenses"
      subtitle="License generation, activation, renewal, expiry, device & domain limits, and audit history."
      queryKey="licenses"
      auditEntity="license"
      kpis={[
        { label: "Active licenses" },
        { label: "Expiring (30d)" },
        { label: "Revoked" },
        { label: "Enterprise" },
        { label: "Activations today" },
        { label: "Renewal rate" },
      ]}
      statusOptions={[
        { value: "active", label: "Active" },
        { value: "expired", label: "Expired" },
        { value: "revoked", label: "Revoked" },
      ]}
      extraFilter={{
        placeholder: "All license types",
        options: [
          { value: "personal", label: "Personal" },
          { value: "commercial", label: "Commercial" },
          { value: "enterprise", label: "Enterprise" },
        ],
      }}
      createLabel="Generate license"
      bulkActions={[
        { label: "Renew", icon: <RotateCw className="h-3.5 w-3.5" /> },
        { label: "Revoke", tone: "danger", icon: <Ban className="h-3.5 w-3.5" /> },
      ]}
      columns={[
        { id: "key", header: "Key", cell: (r) => <span className="font-mono text-[11px]">{r.key}</span>, width: "1.2" },
        { id: "product", header: "Product", cell: (r) => r.product },
        { id: "customer", header: "Customer", cell: (r) => r.customer },
        { id: "type", header: "Type", cell: (r) => <span className="capitalize">{r.type}</span>, width: "0.6" },
        { id: "act", header: "Activations", cell: (r) => `${r.activations}/${r.maxActivations}`, width: "0.7", align: "right" },
        { id: "domains", header: "Domains", cell: (r) => r.domains, width: "0.5", align: "right" },
        { id: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, width: "0.6" },
        { id: "exp", header: "Expires", cell: (r) => fmtDate(r.expiresAt), width: "0.7" },
      ]}
      rowKey={(r) => r.id}
      panelTitle={(r) => r.key}
      panelSubtitle={(r) => `${r.product} · ${r.customer}`}
      emptyTitle="No licenses issued"
      emptyDescription="Licenses generate automatically on order fulfillment. Connect Lovable Cloud and publish a product to issue the first license."
    />
  ),
});
