import { createFileRoute } from "@tanstack/react-router";
import { StubWall } from "@/features/author-manager/components/StubWall";
export const Route = createFileRoute("/boss/author-manager/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Author Manager" }] }),
  component: () => <StubWall title="Analytics" subtitle="Revenue, downloads, ratings, retention, top products, top authors, conversion, and forecasting." />,
});
