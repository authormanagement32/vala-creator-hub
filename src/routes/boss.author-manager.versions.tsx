import { createFileRoute } from "@tanstack/react-router";
import { StubWall } from "@/features/author-manager/components/StubWall";
export const Route = createFileRoute("/boss/author-manager/versions")({
  head: () => ({ meta: [{ title: "Versions — Author Manager" }] }),
  component: () => <StubWall title="Versions" subtitle="Release management, changelogs, rollback, compatibility, and update notifications." />,
});
