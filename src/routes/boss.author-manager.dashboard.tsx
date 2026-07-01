import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Download, ShieldCheck } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { WallShell } from "@/features/author-manager/components/WallShell";
import { KpiCard } from "@/features/author-manager/components/KpiCard";
import { EmptyState } from "@/features/author-manager/components/EmptyState";
import { useDashboardStats } from "@/features/author-manager/data";
import { fmtMoney, fmtNumber } from "@/features/author-manager/format";
import { whoAmI, claimBossRole } from "@/lib/author-manager.functions";

export const Route = createFileRoute("/boss/author-manager/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Author Manager" }] }),
  component: DashboardWall,
});

function DashboardWall() {
  const { data } = useDashboardStats();
  const s = data;
  const me = useServerFn(whoAmI);
  const claim = useServerFn(claimBossRole);
  const qc = useQueryClient();
  const meQ = useQuery({ queryKey: ["whoami"], queryFn: () => me(), retry: false });
  const claimM = useMutation({
    mutationFn: () => claim(),
    onSuccess: () => { toast.success("Boss role claimed"); qc.invalidateQueries(); },
    onError: (e: any) => toast.error(e.message),
  });
  const needsAuth = meQ.data && !meQ.data.authed;
  const needsClaim = meQ.data && meQ.data.authed && !meQ.data.isBoss;

  return (
    <WallShell
      title="Dashboard"
      subtitle="Global author program health, revenue, and operations."
      actions={
        <button className="flex h-9 items-center gap-1.5 rounded-md border border-hairline px-3 text-sm hover:bg-surface-2">
          <Download className="h-3.5 w-3.5" /> Export snapshot
        </button>
      }
    >
      {needsAuth && (
        <div className="flex items-center justify-between rounded-md border border-brand/40 bg-brand/5 p-3 text-xs">
          <span>Sign in to manage authors, products, and audits.</span>
          <Link to="/auth" className="rounded-md bg-brand px-3 py-1.5 font-medium text-brand-foreground">Sign in</Link>
        </div>
      )}
      {needsClaim && (
        <div className="flex items-center justify-between rounded-md border border-warning/40 bg-warning/5 p-3 text-xs">
          <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> You are signed in but don't have the boss role.</span>
          <button disabled={claimM.isPending} onClick={() => claimM.mutate()} className="rounded-md bg-brand px-3 py-1.5 font-medium text-brand-foreground disabled:opacity-50">
            {claimM.isPending ? "Claiming…" : "Claim boss role"}
          </button>
        </div>
      )}
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
