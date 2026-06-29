import { createFileRoute } from "@tanstack/react-router";
import { DomainWall } from "@/features/author-manager/components/DomainWall";
import { StatusBadge } from "@/features/author-manager/components/StatusBadge";
import { fmtDate } from "@/features/author-manager/format";

interface Ticket {
  id: string;
  subject: string;
  author: string;
  channel: "ticket" | "chat" | "whatsapp" | "email" | "remote";
  priority: "low" | "normal" | "high" | "urgent";
  status: "pending" | "review" | "approved" | "rejected";
  slaRemaining: string | null;
  updatedAt: string;
}

export const Route = createFileRoute("/boss/author-manager/support")({
  head: () => ({ meta: [{ title: "Support — Author Manager" }] }),
  component: () => (
    <DomainWall<Ticket>
      title="Support"
      subtitle="Tickets, chat, WhatsApp, email, remote sessions, bug reports, feature requests, and SLA tracking."
      queryKey="support"
      auditEntity="ticket"
      kpis={[
        { label: "Open tickets" },
        { label: "SLA at risk" },
        { label: "Awaiting author" },
        { label: "Resolved (24h)" },
        { label: "CSAT (30d)" },
        { label: "Median first response" },
      ]}
      statusOptions={[
        { value: "pending", label: "Open" },
        { value: "review", label: "In progress" },
        { value: "approved", label: "Resolved" },
        { value: "rejected", label: "Closed" },
      ]}
      extraFilter={{
        placeholder: "All channels",
        options: [
          { value: "ticket", label: "Ticket" },
          { value: "chat", label: "Live chat" },
          { value: "whatsapp", label: "WhatsApp" },
          { value: "email", label: "Email" },
          { value: "remote", label: "Remote" },
        ],
      }}
      createLabel="New ticket"
      columns={[
        { id: "subject", header: "Subject", cell: (r) => <span className="font-medium">{r.subject}</span>, width: "1.4" },
        { id: "author", header: "Author", cell: (r) => r.author },
        { id: "channel", header: "Channel", cell: (r) => <span className="capitalize">{r.channel}</span>, width: "0.6" },
        { id: "priority", header: "Priority", cell: (r) => <span className="capitalize">{r.priority}</span>, width: "0.6" },
        { id: "sla", header: "SLA", cell: (r) => r.slaRemaining ?? "—", width: "0.6" },
        { id: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, width: "0.6" },
        { id: "upd", header: "Updated", cell: (r) => fmtDate(r.updatedAt), width: "0.7" },
      ]}
      rowKey={(r) => r.id}
      panelTitle={(r) => r.subject}
      panelSubtitle={(r) => `${r.author} · ${r.channel}`}
      emptyTitle="No support tickets"
      emptyDescription="Authors and customers route support requests here across ticket, chat, WhatsApp, email, and remote-assist channels."
    />
  ),
});
