import { createFileRoute } from "@tanstack/react-router";
import { StubWall } from "@/features/author-manager/components/StubWall";
export const Route = createFileRoute("/boss/author-manager/downloads")({
  head: () => ({ meta: [{ title: "Downloads — Author Manager" }] }),
  component: () => <StubWall title="Downloads" subtitle="Download statistics, unique downloads, geography, devices, and bandwidth trends." />,
});
