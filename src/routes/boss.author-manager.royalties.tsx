import { createFileRoute } from "@tanstack/react-router";
import { DomainWall } from "@/features/author-manager/components/DomainWall";
import { StatusBadge } from "@/features/author-manager/components/StatusBadge";
import { fmtMoney, fmtDate, fmtPercent } from "@/features/author-manager/format";

interface RoyaltyRow {
  id: string;
  author: string;
  product: string;
  rate: number;
  sales: number;
  earned: number;
  status: "pending" | "approved" | "paid";
  period: string;
  paidAt: string | null;
}

export const Route = createFileRoute("/boss/author-manager/royalties")({
  head: () => ({ meta: [{ title: "Royalties — Author Manager" }] }),
  component: () => (
    <DomainWall<RoyaltyRow>
      title="Royalties"
      subtitle="Royalty rules, calculations, commissions, withdrawals, and payout history."
      queryKey="royalties"
      auditEntity="royalty"
      kpis={[
        { label: "Royalties accrued" },
        { label: "Pending payouts" },
        { label: "Paid (30d)" },
        { label: "Avg royalty %" },
        { label: "Top earner" },
        { label: "Withdrawal queue" },
      ]}
      statusOptions={[
        { value: "pending", label: "Pending" },
        { value: "approved", label: "Approved" },
        { value: "paid", label: "Paid" },
      ]}
      createLabel="Run royalty cycle"
      columns={[
        { id: "author", header: "Author", cell: (r) => <span className="font-medium">{r.author}</span> },
        { id: "product", header: "Product", cell: (r) => r.product },
        { id: "period", header: "Period", cell: (r) => r.period, width: "0.6" },
        { id: "rate", header: "Rate", cell: (r) => fmtPercent(r.rate), align: "right", width: "0.5" },
        { id: "sales", header: "Sales", cell: (r) => fmtMoney(r.sales), align: "right", width: "0.7" },
        { id: "earned", header: "Earned", cell: (r) => fmtMoney(r.earned), align: "right", width: "0.7" },
        { id: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, width: "0.6" },
        { id: "paid", header: "Paid", cell: (r) => fmtDate(r.paidAt), width: "0.7" },
      ]}
      rowKey={(r) => r.id}
      panelTitle={(r) => r.author}
      panelSubtitle={(r) => `${r.product} · ${r.period}`}
      emptyTitle="No royalty events"
      emptyDescription="Royalty rules trigger from marketplace sales. Configure rules in Settings → Royalty Rules to start accruing payouts."
    />
  ),
});
