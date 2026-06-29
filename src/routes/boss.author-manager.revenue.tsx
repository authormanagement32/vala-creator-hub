import { createFileRoute } from "@tanstack/react-router";
import { DomainWall } from "@/features/author-manager/components/DomainWall";
import { StatusBadge } from "@/features/author-manager/components/StatusBadge";
import { fmtMoney, fmtDate } from "@/features/author-manager/format";

interface RevenueRow {
  id: string;
  period: string;
  author: string;
  product: string;
  gross: number;
  fees: number;
  net: number;
  royalty: number;
  status: "pending" | "approved" | "paid";
  paidAt: string | null;
}

export const Route = createFileRoute("/boss/author-manager/revenue")({
  head: () => ({ meta: [{ title: "Revenue — Author Manager" }] }),
  component: () => (
    <DomainWall<RevenueRow>
      title="Revenue & Royalties"
      subtitle="Author revenue, royalty splits, withdrawals, invoices, taxes, and payout status."
      queryKey="revenue"
      auditEntity="revenue"
      kpis={[
        { label: "Gross revenue (30d)" },
        { label: "Net to authors (30d)" },
        { label: "Pending payouts" },
        { label: "Withdrawals queued" },
        { label: "Tax withheld" },
        { label: "Avg payout SLA" },
      ]}
      statusOptions={[
        { value: "pending", label: "Pending" },
        { value: "approved", label: "Approved" },
        { value: "paid", label: "Paid" },
      ]}
      createLabel="New payout run"
      columns={[
        { id: "period", header: "Period", cell: (r) => <span className="font-mono text-[11px]">{r.period}</span>, width: "0.6" },
        { id: "author", header: "Author", cell: (r) => <span className="font-medium">{r.author}</span> },
        { id: "product", header: "Product", cell: (r) => r.product },
        { id: "gross", header: "Gross", cell: (r) => fmtMoney(r.gross), align: "right", width: "0.7" },
        { id: "fees", header: "Fees", cell: (r) => fmtMoney(r.fees), align: "right", width: "0.6" },
        { id: "net", header: "Net", cell: (r) => fmtMoney(r.net), align: "right", width: "0.7" },
        { id: "royalty", header: "Royalty", cell: (r) => fmtMoney(r.royalty), align: "right", width: "0.7" },
        { id: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, width: "0.6" },
        { id: "paid", header: "Paid", cell: (r) => fmtDate(r.paidAt), width: "0.7" },
      ]}
      rowKey={(r) => r.id}
      panelTitle={(r) => `${r.author} · ${r.period}`}
      panelSubtitle={(r) => r.product}
      emptyTitle="No revenue activity yet"
      emptyDescription="Every order, royalty split, withdrawal, invoice, and tax record appears here once Lovable Cloud is connected to the marketplace ledger."
    />
  ),
});
