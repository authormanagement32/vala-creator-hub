import { createFileRoute } from "@tanstack/react-router";
import { StubWall } from "@/features/author-manager/components/StubWall";
export const Route = createFileRoute("/boss/author-manager/source-code")({
  head: () => ({ meta: [{ title: "Source Code — Author Manager" }] }),
  component: () => <StubWall title="Source Code" subtitle="Repositories, releases, Git integration, build status, dependencies, security scans, and license validation." />,
});
