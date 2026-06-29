import { createFileRoute } from "@tanstack/react-router";
import { StubWall } from "@/features/author-manager/components/StubWall";
export const Route = createFileRoute("/boss/author-manager/approvals")({
  head: () => ({ meta: [{ title: "Approvals — Author Manager" }] }),
  component: () => <StubWall title="Approvals" subtitle="Approval and rejection workflows with full audit timeline." />,
});
