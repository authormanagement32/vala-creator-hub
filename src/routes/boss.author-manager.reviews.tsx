import { createFileRoute } from "@tanstack/react-router";
import { StubWall } from "@/features/author-manager/components/StubWall";
export const Route = createFileRoute("/boss/author-manager/reviews")({
  head: () => ({ meta: [{ title: "Reviews — Author Manager" }] }),
  component: () => <StubWall title="Reviews" subtitle="Manual + AI review pipeline with quality, security, malware, and license checks." />,
});
