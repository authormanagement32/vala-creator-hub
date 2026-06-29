import { createFileRoute } from "@tanstack/react-router";
import { StubWall } from "@/features/author-manager/components/StubWall";
export const Route = createFileRoute("/boss/author-manager/settings")({
  head: () => ({ meta: [{ title: "Settings — Author Manager" }] }),
  component: () => <StubWall title="Settings" subtitle="Submission rules, review rules, royalty rules, workflows, templates, branding, automation, integrations, audit, and system health." />,
});
