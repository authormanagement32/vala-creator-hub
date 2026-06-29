import { createFileRoute } from "@tanstack/react-router";
import { StubWall } from "@/features/author-manager/components/StubWall";
export const Route = createFileRoute("/boss/author-manager/themes")({
  head: () => ({ meta: [{ title: "Themes — Author Manager" }] }),
  component: () => <StubWall title="Themes" subtitle="Visual themes and design systems submitted by creators." />,
});
