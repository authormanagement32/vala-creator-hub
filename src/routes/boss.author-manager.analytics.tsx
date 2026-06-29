import { createFileRoute } from "@tanstack/react-router";
import { WallShell } from "@/features/author-manager/components/WallShell";
import { KpiStrip } from "@/features/author-manager/components/KpiStrip";
import { EmptyState } from "@/features/author-manager/components/EmptyState";

export const Route = createFileRoute("/boss/author-manager/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Author Manager" }] }),
  component: AnalyticsWall,
});

const sections = [
  { title: "Revenue", desc: "Gross, net, refunds, MRR, ARR — sliced by author, product, geo, and channel." },
  { title: "Downloads", desc: "Unique downloads, bandwidth, device mix, and time-series trends." },
  { title: "Ratings & Reviews", desc: "Average rating, distribution, sentiment, and response time." },
  { title: "Growth", desc: "Acquisition, activation, retention, expansion, and churn cohorts." },
  { title: "Top Products", desc: "Best-selling products across categories and regions." },
  { title: "Top Authors", desc: "Highest-earning and fastest-growing authors." },
  { title: "Geographic", desc: "Sales and downloads by country, region, and city." },
  { title: "Conversion", desc: "Funnel from view → preview → purchase → activation → retention." },
  { title: "Forecasting", desc: "Projected revenue, downloads, and royalty obligations." },
];

function AnalyticsWall() {
  return (
    <WallShell
      title="Analytics"
      subtitle="Global author analytics across revenue, downloads, ratings, growth, geo, and forecasting."
    >
      <KpiStrip
        items={[
          { label: "Revenue (30d)" },
          { label: "Downloads (30d)" },
          { label: "Active authors" },
          { label: "Conversion" },
          { label: "Retention (90d)" },
          { label: "Forecast (next 30d)" },
        ]}
      />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((s) => (
          <div key={s.title} className="rounded-lg border border-hairline bg-card p-4">
            <div className="text-sm font-semibold">{s.title}</div>
            <div className="mt-1 text-xs text-muted-foreground">{s.desc}</div>
            <div className="mt-3">
              <EmptyState
                title="Awaiting telemetry"
                description="Charts render once Lovable Cloud delivers the analytics warehouse."
              />
            </div>
          </div>
        ))}
      </div>
    </WallShell>
  );
}
