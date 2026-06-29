import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, XCircle } from "lucide-react";
import { DomainWall } from "@/features/author-manager/components/DomainWall";
import { StatusBadge } from "@/features/author-manager/components/StatusBadge";
import { fmtDate } from "@/features/author-manager/format";

interface ReviewItem {
  id: string;
  product: string;
  author: string;
  category: string;
  reviewer: string | null;
  aiScore: number | null;
  malware: "clean" | "flagged" | "pending";
  license: "valid" | "invalid" | "pending";
  status: "pending" | "review" | "approved" | "rejected";
  submittedAt: string;
}

export const Route = createFileRoute("/boss/author-manager/reviews")({
  head: () => ({ meta: [{ title: "Reviews — Author Manager" }] }),
  component: () => (
    <DomainWall<ReviewItem>
      title="Review & Approval"
      subtitle="Manual + AI review queue with security scans, malware detection, and license validation."
      queryKey="reviews"
      auditEntity="review"
      kpis={[
        { label: "Awaiting review" },
        { label: "In manual review" },
        { label: "AI-flagged" },
        { label: "Malware hits" },
        { label: "Avg time to decision" },
        { label: "Approval rate" },
      ]}
      statusOptions={[
        { value: "pending", label: "Pending" },
        { value: "review", label: "In review" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
      ]}
      extraFilter={{
        placeholder: "All reviewers",
        options: [
          { value: "ai", label: "AI reviewer" },
          { value: "human", label: "Human reviewer" },
          { value: "unassigned", label: "Unassigned" },
        ],
      }}
      createLabel="Assign reviewer"
      bulkActions={[
        { label: "Approve", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
        { label: "Reject", tone: "danger", icon: <XCircle className="h-3.5 w-3.5" /> },
      ]}
      columns={[
        { id: "product", header: "Product", cell: (r) => <span className="font-medium">{r.product}</span>, width: "1.2" },
        { id: "author", header: "Author", cell: (r) => r.author },
        { id: "category", header: "Category", cell: (r) => r.category, width: "0.7" },
        { id: "ai", header: "AI score", cell: (r) => (r.aiScore != null ? r.aiScore.toFixed(2) : "—"), width: "0.5", align: "right" },
        { id: "malware", header: "Malware", cell: (r) => <StatusBadge status={r.malware === "clean" ? "approved" : r.malware === "flagged" ? "rejected" : "pending"} />, width: "0.7" },
        { id: "license", header: "License", cell: (r) => <StatusBadge status={r.license === "valid" ? "approved" : r.license === "invalid" ? "rejected" : "pending"} />, width: "0.7" },
        { id: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, width: "0.7" },
        { id: "submitted", header: "Submitted", cell: (r) => fmtDate(r.submittedAt), width: "0.7" },
      ]}
      rowKey={(r) => r.id}
      panelTitle={(r) => r.product}
      panelSubtitle={(r) => `${r.author} · ${r.category}`}
      emptyTitle="No items in the review queue"
      emptyDescription="New product submissions and version releases flow into this queue for AI scan, malware check, and human approval."
    />
  ),
});
