import { createFileRoute } from "@tanstack/react-router";
import { StubWall } from "@/features/author-manager/components/StubWall";
export const Route = createFileRoute("/boss/author-manager/templates")({
  head: () => ({ meta: [{ title: "Templates — Author Manager" }] }),
  component: () => <StubWall title="Templates" subtitle="Marketplace templates submitted by authors." />,
});
