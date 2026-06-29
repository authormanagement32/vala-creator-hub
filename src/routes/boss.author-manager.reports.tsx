import { createFileRoute } from "@tanstack/react-router";
import { FileDown, FileSpreadsheet, FileText } from "lucide-react";
import { WallShell } from "@/features/author-manager/components/WallShell";
import { EmptyState } from "@/features/author-manager/components/EmptyState";

export const Route = createFileRoute("/boss/author-manager/reports")({
  head: () => ({ meta: [{ title: "Reports — Author Manager" }] }),
  component: ReportsWall,
});

const reports = [
  { id: "authors", title: "Author report", desc: "Roster, verification, health, and risk by cohort." },
  { id: "revenue", title: "Revenue report", desc: "Gross, fees, net, refunds, taxes, and per-author splits." },
  { id: "royalty", title: "Royalty report", desc: "Accruals, payouts, withholdings, and outstanding balances." },
  { id: "downloads", title: "Download report", desc: "Volume, unique users, geo, and bandwidth costs." },
  { id: "licenses", title: "License report", desc: "Issued, active, expired, revoked, and renewals." },
  { id: "security", title: "Security report", desc: "Malware scans, CVE exposure, and compliance posture." },
];

function ReportsWall() {
  return (
    <WallShell
      title="Reports"
      subtitle="On-demand and scheduled reports across every domain. Export to PDF, Excel, or CSV."
      actions={
        <>
          <button className="flex h-9 items-center gap-1.5 rounded-md border border-hairline px-2.5 text-sm hover:bg-surface-2">
            <FileText className="h-3.5 w-3.5" /> PDF
          </button>
          <button className="flex h-9 items-center gap-1.5 rounded-md border border-hairline px-2.5 text-sm hover:bg-surface-2">
            <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
          </button>
          <button className="flex h-9 items-center gap-1.5 rounded-md border border-hairline px-2.5 text-sm hover:bg-surface-2">
            <FileDown className="h-3.5 w-3.5" /> CSV
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((r) => (
          <div key={r.id} className="rounded-lg border border-hairline bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-semibold">{r.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{r.desc}</div>
              </div>
              <button
                disabled
                className="rounded-md border border-hairline px-2 py-1 text-[11px] hover:bg-surface-2 disabled:opacity-50"
              >
                Generate
              </button>
            </div>
            <div className="mt-3">
              <EmptyState
                title="No runs yet"
                description="Connect Lovable Cloud to enable scheduled and on-demand exports."
              />
            </div>
          </div>
        ))}
      </div>
    </WallShell>
  );
}
