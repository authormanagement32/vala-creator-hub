import { createFileRoute } from "@tanstack/react-router";
import { Activity, Download } from "lucide-react";
import { WallShell } from "@/features/author-manager/components/WallShell";
import { KpiCard } from "@/features/author-manager/components/KpiCard";
import { EmptyState } from "@/features/author-manager/components/EmptyState";
import { useDashboardStats } from "@/features/author-manager/data";
import { fmtMoney, fmtNumber } from "@/features/author-manager/format";

export const Route = createFileRoute("/boss/author-manager/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Author Manager" },
      {
        name: "description",
        content:
          "Author program health, revenue, royalties, and operations at a glance inside the Software Vala boss panel.",
      },
      { property: "og:title", content: "Dashboard — Author Manager" },
      {
        property: "og:description",
        content: "Author program health, revenue, royalties, and operations at a glance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardWall,
});

function DashboardWall() {
  const { data } = useDashboardStats();
  const s = data;

  return (
    <WallShell
      title="Dashboard"
      subtitle="Global author program health, revenue, and operations."
      actions={
        <button className="flex h-10 items-center gap-1.5 rounded-full border border-border bg-surface px-4 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
          <Download className="h-3.5 w-3.5" /> Export snapshot
        </button>
      }
    >

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Total authors" value={fmtNumber(s?.totalAuthors)} tone="brand" />
        <KpiCard label="Verified" value={fmtNumber(s?.verifiedAuthors)} tone="success" />
        <KpiCard label="Pending applications" value={fmtNumber(s?.pendingApplications)} tone="warning" />
        <KpiCard label="Suspended" value={fmtNumber(s?.suspendedAuthors)} tone="danger" />
        <KpiCard label="Published products" value={fmtNumber(s?.publishedProducts)} />
        <KpiCard label="Pending reviews" value={fmtNumber(s?.pendingReviews)} tone="warning" />
        <KpiCard label="Revenue" value={fmtMoney(s?.revenue)} tone="success" />
        <KpiCard label="Royalties" value={fmtMoney(s?.royalties)} />
        <KpiCard label="Downloads" value={fmtNumber(s?.downloads)} />
        <KpiCard label="Active licenses" value={fmtNumber(s?.activeLicenses)} />
        <KpiCard label="Support tickets" value={fmtNumber(s?.supportTickets)} tone="info" />
        <KpiCard label="Health" value="—" hint="Awaiting live signals" />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border border-hairline bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Recent submissions</div>
              <div className="text-xs text-muted-foreground">
                Latest products awaiting review across the marketplace.
              </div>
            </div>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <EmptyState
            title="No submissions yet"
            description="When authors submit products for review, they appear here in realtime."
          />
        </div>
        <div className="rounded-lg border border-hairline bg-card p-4">
          <div className="mb-3 text-sm font-semibold">Live activity</div>
          <EmptyState
            title="Quiet"
            description="Author events, approvals, payouts, and license activations stream into this feed."
          />
        </div>
      </section>
    </WallShell>
  );
}
