import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Pause } from "lucide-react";
import { DomainWall } from "@/features/author-manager/components/DomainWall";
import { StatusBadge } from "@/features/author-manager/components/StatusBadge";
import { fmtMoney, fmtNumber, fmtDate } from "@/features/author-manager/format";

interface AiModelRow {
  id: string;
  name: string;
  author: string;
  modality: "text" | "vision" | "audio" | "multimodal" | "embedding";
  parameters: string;
  license: string;
  price: number;
  calls: number;
  rating: number | null;
  safetyStatus: "approved" | "pending" | "rejected";
  status: "draft" | "review" | "published" | "rejected" | "archived";
  updatedAt: string;
}

export const Route = createFileRoute("/boss/author-manager/ai-models")({
  head: () => ({ meta: [{ title: "AI Models — Author Manager" }] }),
  component: () => (
    <DomainWall<AiModelRow>
      title="AI Models"
      subtitle="Author-published AI models with safety review, license validation, and usage telemetry."
      queryKey="ai-models"
      auditEntity="ai-model"
      kpis={[
        { label: "Published models" },
        { label: "Awaiting safety review" },
        { label: "Calls (24h)" },
        { label: "Avg rating" },
        { label: "Safety incidents" },
        { label: "Top modality" },
      ]}
      statusOptions={[
        { value: "draft", label: "Draft" },
        { value: "review", label: "In review" },
        { value: "published", label: "Published" },
        { value: "rejected", label: "Rejected" },
        { value: "archived", label: "Archived" },
      ]}
      extraFilter={{
        placeholder: "All modalities",
        options: [
          { value: "text", label: "Text" },
          { value: "vision", label: "Vision" },
          { value: "audio", label: "Audio" },
          { value: "multimodal", label: "Multimodal" },
          { value: "embedding", label: "Embedding" },
        ],
      }}
      createLabel="Submit model"
      bulkActions={[
        { label: "Publish", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
        { label: "Suspend", icon: <Pause className="h-3.5 w-3.5" /> },
      ]}
      columns={[
        { id: "name", header: "Model", cell: (r) => <span className="font-medium">{r.name}</span>, width: "1.4" },
        { id: "author", header: "Author", cell: (r) => r.author },
        { id: "modality", header: "Modality", cell: (r) => <span className="capitalize">{r.modality}</span>, width: "0.7" },
        { id: "params", header: "Parameters", cell: (r) => <span className="font-mono text-[11px]">{r.parameters}</span>, width: "0.7" },
        { id: "license", header: "License", cell: (r) => <span className="font-mono text-[11px]">{r.license}</span>, width: "0.7" },
        { id: "price", header: "Price", cell: (r) => fmtMoney(r.price), width: "0.5", align: "right" },
        { id: "calls", header: "Calls", cell: (r) => fmtNumber(r.calls), width: "0.6", align: "right" },
        { id: "rating", header: "Rating", cell: (r) => (r.rating ? r.rating.toFixed(2) : "—"), width: "0.5", align: "right" },
        { id: "safety", header: "Safety", cell: (r) => <StatusBadge status={r.safetyStatus} />, width: "0.6" },
        { id: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, width: "0.6" },
        { id: "upd", header: "Updated", cell: (r) => fmtDate(r.updatedAt), width: "0.7" },
      ]}
      rowKey={(r) => r.id}
      panelTitle={(r) => r.name}
      panelSubtitle={(r) => `${r.author} · ${r.modality}`}
      emptyTitle="No AI models yet"
      emptyDescription="Author-submitted AI models go through safety, license, and bias review before appearing here."
    />
  ),
});
