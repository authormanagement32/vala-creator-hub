import { createFileRoute } from "@tanstack/react-router";
import { FileSignature, Upload } from "lucide-react";
import { WallShell } from "@/features/author-manager/components/WallShell";
import { EmptyState } from "@/features/author-manager/components/EmptyState";
import { KpiStrip } from "@/features/author-manager/components/KpiStrip";

export const Route = createFileRoute("/boss/author-manager/documents")({
  head: () => ({ meta: [{ title: "Documents — Author Manager" }] }),
  component: DocumentsWall,
});

const groups: { group: string; items: { title: string; desc: string }[] }[] = [
  {
    group: "Legal",
    items: [
      { title: "Author agreement", desc: "Master publishing agreement signed by every author." },
      { title: "NDA", desc: "Non-disclosure covering pre-release products and internal reviews." },
      { title: "Copyright", desc: "Ownership declarations and DMCA response records." },
      { title: "Trademark", desc: "Registered marks tied to authors, products, and brands." },
    ],
  },
  {
    group: "Compliance",
    items: [
      { title: "KYC", desc: "Identity, address, and beneficial-ownership evidence." },
      { title: "Tax documents", desc: "W-8/W-9, PAN, GST, VAT — jurisdiction-aware collection." },
      { title: "Certificates", desc: "Verification, security, and quality certifications." },
    ],
  },
  {
    group: "Financial",
    items: [
      { title: "Invoices", desc: "Author invoices, platform fees, and payout statements." },
      { title: "Digital signatures", desc: "Signed artifacts with full audit trail." },
    ],
  },
];

function DocumentsWall() {
  return (
    <WallShell
      title="Documents"
      subtitle="Author agreements, NDA, KYC, tax, certificates, copyright, trademark, invoices, and digital signatures."
      actions={
        <>
          <button className="flex h-9 items-center gap-1.5 rounded-md border border-hairline px-2.5 text-sm hover:bg-surface-2">
            <Upload className="h-3.5 w-3.5" /> Upload
          </button>
          <button className="flex h-9 items-center gap-1.5 rounded-md bg-brand px-2.5 text-sm font-medium text-brand-foreground">
            <FileSignature className="h-3.5 w-3.5" /> Request signature
          </button>
        </>
      }
    >
      <KpiStrip
        items={[
          { label: "Agreements" },
          { label: "NDAs on file" },
          { label: "KYC complete" },
          { label: "Tax on file" },
          { label: "Pending signatures" },
          { label: "Expiring < 30d" },
        ]}
      />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {groups.flatMap((g) =>
          g.items.map((it) => (
            <div key={it.title} className="rounded-lg border border-hairline bg-card p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {g.group}
              </div>
              <div className="mt-1 text-sm font-semibold">{it.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">{it.desc}</div>
              <div className="mt-3">
                <EmptyState
                  title="No documents yet"
                  description="Uploaded and signed artifacts appear here with an immutable audit trail."
                />
              </div>
            </div>
          )),
        )}
      </div>
    </WallShell>
  );
}
