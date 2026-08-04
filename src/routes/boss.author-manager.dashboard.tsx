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

  const live = Boolean(s?.authed);

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
      <WallHero
        eyebrow="Software Vala Author Program"
        title="Hello, Boss"
        description="Manage authors, catalog, royalties and operations — all from one control panel."
        live={live}
        liveLabel="database"
        actions={
          <>
            <Link
              to="/boss/author-manager/authors"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-primary transition hover:bg-white/90"
            >
              Open Author Directory <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              to="/boss/author-manager/applications"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-5 py-2.5 text-sm font-medium backdrop-blur transition hover:bg-white/25"
            >
              <Sparkles className="h-4 w-4" /> Review Applications
            </Link>
          </>
        }
        panelTitle="Program Snapshot"
        panelSubtitle={live ? "Live from your database" : "Awaiting live signals"}
        stats={[
          { label: "Authors", value: fmtNumber(s?.totalAuthors) },
          { label: "Verified", value: fmtNumber(s?.verifiedAuthors) },
          { label: "Pending", value: fmtNumber(s?.pendingApplications) },
        ]}
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        <KpiCard label="Total authors" value={fmtNumber(s?.totalAuthors)} icon={Users} tone="brand" />
        <KpiCard label="Verified" value={fmtNumber(s?.verifiedAuthors)} icon={ShieldCheck} tone="success" />
        <KpiCard label="Pending applications" value={fmtNumber(s?.pendingApplications)} icon={Inbox} tone="warning" />
        <KpiCard label="Suspended" value={fmtNumber(s?.suspendedAuthors)} icon={Ban} tone="danger" />
        <KpiCard label="Published products" value={fmtNumber(s?.publishedProducts)} icon={Package} />
        <KpiCard label="Pending reviews" value={fmtNumber(s?.pendingReviews)} icon={Star} tone="warning" />
        <KpiCard label="Revenue" value={fmtMoney(s?.revenue)} icon={TrendingUp} tone="success" />
        <KpiCard label="Royalties" value={fmtMoney(s?.royalties)} icon={Wallet} />
        <KpiCard label="Downloads" value={fmtNumber(s?.downloads)} icon={Download} />
        <KpiCard label="Active licenses" value={fmtNumber(s?.activeLicenses)} icon={KeyRound} />
        <KpiCard label="Support tickets" value={fmtNumber(s?.supportTickets)} icon={LifeBuoy} tone="info" />
        <KpiCard label="Health" value="—" hint="Awaiting live signals" icon={Activity} />
      </section>


      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 bento-card p-5">
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
        <div className="bento-card p-5">
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
