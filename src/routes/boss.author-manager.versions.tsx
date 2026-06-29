import { createFileRoute } from "@tanstack/react-router";
import { Undo2 } from "lucide-react";
import { DomainWall } from "@/features/author-manager/components/DomainWall";
import { StatusBadge } from "@/features/author-manager/components/StatusBadge";
import { fmtNumber, fmtDate } from "@/features/author-manager/format";

interface VersionRow {
  id: string;
  product: string;
  version: string;
  channel: "stable" | "beta" | "alpha";
  breaking: boolean;
  changelog: string;
  status: "draft" | "published" | "archived" | "rejected";
  downloads: number;
  releasedAt: string;
}

export const Route = createFileRoute("/boss/author-manager/versions")({
  head: () => ({ meta: [{ title: "Versions — Author Manager" }] }),
  component: () => (
    <DomainWall<VersionRow>
      title="Version Management"
      subtitle="Releases, changelogs, rollback, compatibility, breaking changes, and update analytics."
      queryKey="versions"
      auditEntity="version"
      kpis={[
        { label: "Releases (30d)" },
        { label: "Stable" },
        { label: "Beta" },
        { label: "Breaking releases" },
        { label: "Rollbacks" },
        { label: "Update adoption" },
      ]}
      statusOptions={[
        { value: "draft", label: "Draft" },
        { value: "published", label: "Published" },
        { value: "archived", label: "Archived" },
        { value: "rejected", label: "Rejected" },
      ]}
      extraFilter={{
        placeholder: "All channels",
        options: [
          { value: "stable", label: "Stable" },
          { value: "beta", label: "Beta" },
          { value: "alpha", label: "Alpha" },
        ],
      }}
      createLabel="Cut release"
      bulkActions={[{ label: "Rollback", tone: "danger", icon: <Undo2 className="h-3.5 w-3.5" /> }]}
      columns={[
        { id: "product", header: "Product", cell: (r) => <span className="font-medium">{r.product}</span>, width: "1.2" },
        { id: "version", header: "Version", cell: (r) => <span className="font-mono text-[11px]">{r.version}</span>, width: "0.6" },
        { id: "channel", header: "Channel", cell: (r) => <span className="capitalize">{r.channel}</span>, width: "0.5" },
        { id: "breaking", header: "Breaking", cell: (r) => (r.breaking ? <StatusBadge status="rejected" /> : <StatusBadge status="approved" />), width: "0.6" },
        { id: "downloads", header: "Downloads", cell: (r) => fmtNumber(r.downloads), width: "0.7", align: "right" },
        { id: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, width: "0.6" },
        { id: "released", header: "Released", cell: (r) => fmtDate(r.releasedAt), width: "0.7" },
      ]}
      rowKey={(r) => r.id}
      panelTitle={(r) => `${r.product} v${r.version}`}
      panelSubtitle={(r) => `${r.channel}${r.breaking ? " · breaking" : ""}`}
      emptyTitle="No releases tracked"
      emptyDescription="Every version published by an author appears here with full changelog, compatibility matrix, and rollback controls."
    />
  ),
});
