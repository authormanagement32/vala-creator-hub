import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Pause } from "lucide-react";
import { DomainWall } from "@/features/author-manager/components/DomainWall";
import { StatusBadge } from "@/features/author-manager/components/StatusBadge";
import { fmtMoney, fmtNumber, fmtDate } from "@/features/author-manager/format";

interface ThemeRow {
  id: string;
  name: string;
  author: string;
  platform: string;
  version: string;
  price: number;
  sales: number;
  rating: number | null;
  status: "draft" | "review" | "published" | "rejected" | "archived";
  updatedAt: string;
}

export const Route = createFileRoute("/boss/author-manager/themes")({
  head: () => ({ meta: [{ title: "Themes — Author Manager" }] }),
  component: () => (
    <DomainWall<ThemeRow>
      title="Themes"
      subtitle="Themes for WordPress, Shopify, Webflow, Ghost, and custom platforms."
      queryKey="themes"
      auditEntity="theme"
      kpis={[
        { label: "Published themes" },
        { label: "Awaiting review" },
        { label: "Sales (30d)" },
        { label: "Avg rating" },
        { label: "Refund rate" },
        { label: "Top platform" },
      ]}
      statusOptions={[
        { value: "draft", label: "Draft" },
        { value: "review", label: "In review" },
        { value: "published", label: "Published" },
        { value: "rejected", label: "Rejected" },
        { value: "archived", label: "Archived" },
      ]}
      extraFilter={{
        placeholder: "All platforms",
        options: [
          { value: "wordpress", label: "WordPress" },
          { value: "shopify", label: "Shopify" },
          { value: "webflow", label: "Webflow" },
          { value: "ghost", label: "Ghost" },
          { value: "custom", label: "Custom" },
        ],
      }}
      createLabel="New theme"
      bulkActions={[
        { label: "Publish", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
        { label: "Suspend", icon: <Pause className="h-3.5 w-3.5" /> },
      ]}
      columns={[
        { id: "name", header: "Theme", cell: (r) => <span className="font-medium">{r.name}</span>, width: "1.4" },
        { id: "author", header: "Author", cell: (r) => r.author },
        { id: "platform", header: "Platform", cell: (r) => r.platform, width: "0.7" },
        { id: "version", header: "Version", cell: (r) => <span className="font-mono text-[11px]">{r.version}</span>, width: "0.5" },
        { id: "price", header: "Price", cell: (r) => fmtMoney(r.price), width: "0.5", align: "right" },
        { id: "sales", header: "Sales", cell: (r) => fmtNumber(r.sales), width: "0.5", align: "right" },
        { id: "rating", header: "Rating", cell: (r) => (r.rating ? r.rating.toFixed(2) : "—"), width: "0.5", align: "right" },
        { id: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, width: "0.6" },
        { id: "upd", header: "Updated", cell: (r) => fmtDate(r.updatedAt), width: "0.7" },
      ]}
      rowKey={(r) => r.id}
      panelTitle={(r) => r.name}
      panelSubtitle={(r) => `${r.author} · ${r.platform}`}
      emptyTitle="No themes yet"
      emptyDescription="Author-submitted themes appear here once approved and published."
    />
  ),
});
