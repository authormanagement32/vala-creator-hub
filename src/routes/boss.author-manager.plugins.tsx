import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Pause } from "lucide-react";
import { DomainWall } from "@/features/author-manager/components/DomainWall";
import { StatusBadge } from "@/features/author-manager/components/StatusBadge";
import { fmtMoney, fmtNumber, fmtDate } from "@/features/author-manager/format";

interface PluginRow {
  id: string;
  name: string;
  author: string;
  host: string;
  version: string;
  compatibility: string;
  price: number;
  installs: number;
  rating: number | null;
  status: "draft" | "review" | "published" | "rejected" | "archived";
  updatedAt: string;
}

export const Route = createFileRoute("/boss/author-manager/plugins")({
  head: () => ({ meta: [{ title: "Plugins — Author Manager" }] }),
  component: () => (
    <DomainWall<PluginRow>
      title="Plugins"
      subtitle="Extensions and plugins for every supported host platform with compatibility tracking."
      queryKey="plugins"
      auditEntity="plugin"
      kpis={[
        { label: "Published plugins" },
        { label: "Awaiting review" },
        { label: "Installs (30d)" },
        { label: "Active installs" },
        { label: "Avg rating" },
        { label: "Compat issues" },
      ]}
      statusOptions={[
        { value: "draft", label: "Draft" },
        { value: "review", label: "In review" },
        { value: "published", label: "Published" },
        { value: "rejected", label: "Rejected" },
        { value: "archived", label: "Archived" },
      ]}
      extraFilter={{
        placeholder: "All hosts",
        options: [
          { value: "wordpress", label: "WordPress" },
          { value: "shopify", label: "Shopify" },
          { value: "figma", label: "Figma" },
          { value: "chrome", label: "Chrome" },
          { value: "vscode", label: "VS Code" },
        ],
      }}
      createLabel="New plugin"
      bulkActions={[
        { label: "Publish", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
        { label: "Suspend", icon: <Pause className="h-3.5 w-3.5" /> },
      ]}
      columns={[
        { id: "name", header: "Plugin", cell: (r) => <span className="font-medium">{r.name}</span>, width: "1.4" },
        { id: "author", header: "Author", cell: (r) => r.author },
        { id: "host", header: "Host", cell: (r) => r.host, width: "0.7" },
        { id: "version", header: "Version", cell: (r) => <span className="font-mono text-[11px]">{r.version}</span>, width: "0.5" },
        { id: "compat", header: "Compat", cell: (r) => <span className="font-mono text-[11px]">{r.compatibility}</span>, width: "0.7" },
        { id: "price", header: "Price", cell: (r) => fmtMoney(r.price), width: "0.5", align: "right" },
        { id: "installs", header: "Installs", cell: (r) => fmtNumber(r.installs), width: "0.6", align: "right" },
        { id: "rating", header: "Rating", cell: (r) => (r.rating ? r.rating.toFixed(2) : "—"), width: "0.5", align: "right" },
        { id: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, width: "0.6" },
        { id: "upd", header: "Updated", cell: (r) => fmtDate(r.updatedAt), width: "0.7" },
      ]}
      rowKey={(r) => r.id}
      panelTitle={(r) => r.name}
      panelSubtitle={(r) => `${r.author} · ${r.host}`}
      emptyTitle="No plugins yet"
      emptyDescription="Published plugins from approved authors land here with install counts and compatibility tracking."
    />
  ),
});
