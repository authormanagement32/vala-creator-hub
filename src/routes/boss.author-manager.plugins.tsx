import { createFileRoute } from "@tanstack/react-router";
import { StubWall } from "@/features/author-manager/components/StubWall";
export const Route = createFileRoute("/boss/author-manager/plugins")({
  head: () => ({ meta: [{ title: "Plugins — Author Manager" }] }),
  component: () => <StubWall title="Plugins" subtitle="Author-published plugins across platforms." />,
});
