import { createFileRoute } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { WallShell } from "@/features/author-manager/components/WallShell";

export const Route = createFileRoute("/boss/author-manager/settings")({
  head: () => ({ meta: [{ title: "Settings — Author Manager" }] }),
  component: SettingsWall,
});

const groups: { group: string; items: { title: string; desc: string }[] }[] = [
  {
    group: "Policy",
    items: [
      { title: "Submission rules", desc: "What can be submitted, by whom, with which assets." },
      { title: "Review rules", desc: "AI + manual review thresholds, reviewer routing, SLA." },
      { title: "Royalty rules", desc: "Default split, tiers, accelerators, and overrides." },
      { title: "Commission rules", desc: "Platform fees, payment-provider costs, tax handling." },
      { title: "Approval workflow", desc: "Roles, escalations, and auto-approval bands." },
    ],
  },
  {
    group: "Communications",
    items: [
      { title: "Notification templates", desc: "In-app notifications for every lifecycle event." },
      { title: "Email templates", desc: "Branded transactional email templates." },
      { title: "WhatsApp templates", desc: "Approved WhatsApp Business templates." },
    ],
  },
  {
    group: "Brand",
    items: [
      { title: "Branding", desc: "Logo, palette, typography, certificate styling." },
      { title: "Automation", desc: "Scheduled jobs, webhooks, and event-driven flows." },
    ],
  },
  {
    group: "Infrastructure",
    items: [
      { title: "API keys", desc: "Issue, rotate, and revoke API credentials." },
      { title: "Integrations", desc: "GitHub, GitLab, payment, KYC, and analytics partners." },
      { title: "Backup", desc: "Database backups, retention, and disaster recovery." },
      { title: "Audit", desc: "System-wide audit log retention and export." },
      { title: "System health", desc: "Worker, queue, and database telemetry." },
    ],
  },
];

function SettingsWall() {
  return (
    <WallShell
      title="Settings"
      subtitle="Policy, communications, brand, and infrastructure controls for the Author Manager."
    >
      <div className="space-y-5">
        {groups.map((g) => (
          <div key={g.group}>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {g.group}
            </div>
            <div className="overflow-hidden rounded-lg border border-hairline bg-card">
              {g.items.map((it, i) => (
                <button
                  key={it.title}
                  className={`flex w-full items-center justify-between px-3 py-3 text-left hover:bg-surface-2 ${
                    i > 0 ? "border-t border-hairline" : ""
                  }`}
                >
                  <div>
                    <div className="text-sm font-medium">{it.title}</div>
                    <div className="text-xs text-muted-foreground">{it.desc}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </WallShell>
  );
}
