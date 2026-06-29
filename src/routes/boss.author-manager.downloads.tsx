import { createFileRoute } from "@tanstack/react-router";
import { DomainWall } from "@/features/author-manager/components/DomainWall";
import { fmtNumber, fmtDate } from "@/features/author-manager/format";

interface DownloadRow {
  id: string;
  product: string;
  version: string;
  customer: string;
  country: string | null;
  device: string | null;
  bytes: number;
  ip: string;
  at: string;
}

export const Route = createFileRoute("/boss/author-manager/downloads")({
  head: () => ({ meta: [{ title: "Downloads — Author Manager" }] }),
  component: () => (
    <DomainWall<DownloadRow>
      title="Downloads"
      subtitle="Download statistics, unique downloads, geographic distribution, devices, and bandwidth."
      queryKey="downloads"
      auditEntity="download"
      kpis={[
        { label: "Downloads (24h)" },
        { label: "Unique (24h)" },
        { label: "Bandwidth (24h)" },
        { label: "Top country" },
        { label: "Top product" },
        { label: "Failed downloads" },
      ]}
      extraFilter={{
        placeholder: "All devices",
        options: [
          { value: "desktop", label: "Desktop" },
          { value: "mobile", label: "Mobile" },
          { value: "server", label: "Server" },
          { value: "cli", label: "CLI" },
        ],
      }}
      columns={[
        { id: "product", header: "Product", cell: (r) => <span className="font-medium">{r.product}</span>, width: "1.2" },
        { id: "version", header: "Version", cell: (r) => <span className="font-mono text-[11px]">{r.version}</span>, width: "0.6" },
        { id: "customer", header: "Customer", cell: (r) => r.customer },
        { id: "country", header: "Country", cell: (r) => r.country ?? "—", width: "0.6" },
        { id: "device", header: "Device", cell: (r) => r.device ?? "—", width: "0.6" },
        { id: "bytes", header: "Size", cell: (r) => fmtNumber(r.bytes), width: "0.6", align: "right" },
        { id: "ip", header: "IP", cell: (r) => <span className="font-mono text-[11px]">{r.ip}</span>, width: "0.8" },
        { id: "at", header: "When", cell: (r) => fmtDate(r.at), width: "0.7" },
      ]}
      rowKey={(r) => r.id}
      panelTitle={(r) => `${r.product} v${r.version}`}
      panelSubtitle={(r) => `${r.customer} · ${r.country ?? "—"}`}
      emptyTitle="No downloads recorded"
      emptyDescription="Download telemetry streams here as customers fetch products and updates."
    />
  ),
});
